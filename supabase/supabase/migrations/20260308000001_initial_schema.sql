-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('admin', 'motorista')),
  data_criacao TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles visíveis para usuários autenticados" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuário pode atualizar seu próprio perfil" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Service role pode inserir profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- 2. Caminhoes table
CREATE TABLE IF NOT EXISTS public.caminhoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT NOT NULL UNIQUE,
  modelo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  capacidade INTEGER NOT NULL,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_km NUMERIC DEFAULT 0,
  total_despesas NUMERIC DEFAULT 0,
  total_viagens INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.caminhoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caminhões visíveis para todos autenticados" ON public.caminhoes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin pode gerenciar caminhões" ON public.caminhoes
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  );

-- 3. Motoristas table
CREATE TABLE IF NOT EXISTS public.motoristas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  caminhao_id UUID REFERENCES public.caminhoes(id) ON DELETE SET NULL,
  km_total NUMERIC DEFAULT 0,
  total_viagens INTEGER DEFAULT 0,
  custo_medio_por_km NUMERIC DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.motoristas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Motoristas visíveis para todos autenticados" ON public.motoristas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin pode gerenciar motoristas" ON public.motoristas
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  );

CREATE POLICY "Motorista pode ver seus pr��prios dados" ON public.motoristas
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 4. Viagens table
CREATE TABLE IF NOT EXISTS public.viagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motorista_id UUID NOT NULL REFERENCES public.motoristas(id) ON DELETE CASCADE,
  motorista_nome TEXT NOT NULL,
  caminhao_id UUID NOT NULL REFERENCES public.caminhoes(id) ON DELETE CASCADE,
  caminhao_placa TEXT NOT NULL,
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_fim TIMESTAMPTZ,
  tempo_total INTEGER,
  km_total NUMERIC,
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluida', 'cancelada')),
  origem TEXT,
  destino TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.viagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Viagens visíveis para todos autenticados" ON public.viagens
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin pode gerenciar viagens" ON public.viagens
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  );

CREATE POLICY "Motorista pode gerenciar suas viagens" ON public.viagens
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.motoristas WHERE user_id = auth.uid() AND id = motorista_id)
  );

-- 5. Pontos GPS table
CREATE TABLE IF NOT EXISTS public.pontos_gps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id UUID NOT NULL REFERENCES public.viagens(id) ON DELETE CASCADE,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  velocidade NUMERIC,
  precisao NUMERIC
);

ALTER TABLE public.pontos_gps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pontos GPS visíveis para todos autenticados" ON public.pontos_gps
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Inserir pontos GPS" ON public.pontos_gps
  FOR INSERT TO authenticated WITH CHECK (true);

-- 6. Despesas table
CREATE TABLE IF NOT EXISTS public.despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_despesa TEXT NOT NULL CHECK (tipo_despesa IN ('combustivel','pedagio','alimentacao','manutencao','pneu','seguro','licenciamento','ipva','revisao','outros')),
  valor NUMERIC NOT NULL,
  descricao TEXT NOT NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  comprovante_url TEXT,
  caminhao_id UUID REFERENCES public.caminhoes(id) ON DELETE SET NULL,
  viagem_id UUID REFERENCES public.viagens(id) ON DELETE SET NULL,
  criado_por TEXT NOT NULL CHECK (criado_por IN ('motorista', 'admin')),
  criado_por_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  criado_por_nome TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Despesas visíveis para todos autenticados" ON public.despesas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin pode gerenciar todas despesas" ON public.despesas
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  );

CREATE POLICY "Motorista pode gerenciar suas despesas" ON public.despesas
  FOR ALL TO authenticated USING (criado_por_id = auth.uid());

-- Function to create profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, tipo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'tipo', 'motorista')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update caminhão stats
CREATE OR REPLACE FUNCTION public.update_caminhao_stats(p_caminhao_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.caminhoes SET
    total_km = COALESCE((SELECT SUM(km_total) FROM public.viagens WHERE caminhao_id = p_caminhao_id AND status = 'concluida'), 0),
    total_despesas = COALESCE((SELECT SUM(valor) FROM public.despesas WHERE caminhao_id = p_caminhao_id), 0),
    total_viagens = COALESCE((SELECT COUNT(*) FROM public.viagens WHERE caminhao_id = p_caminhao_id AND status = 'concluida'), 0)
  WHERE id = p_caminhao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update motorista stats
CREATE OR REPLACE FUNCTION public.update_motorista_stats(p_motorista_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_km NUMERIC;
  v_total_viagens INTEGER;
  v_total_despesas NUMERIC;
BEGIN
  SELECT 
    COALESCE(SUM(km_total), 0),
    COALESCE(COUNT(*), 0)
  INTO v_total_km, v_total_viagens
  FROM public.viagens 
  WHERE motorista_id = p_motorista_id AND status = 'concluida';
  
  SELECT COALESCE(SUM(valor), 0) INTO v_total_despesas
  FROM public.despesas 
  WHERE criado_por_id = (SELECT user_id FROM public.motoristas WHERE id = p_motorista_id);
  
  UPDATE public.motoristas SET
    km_total = v_total_km,
    total_viagens = v_total_viagens,
    custo_medio_por_km = CASE WHEN v_total_km > 0 THEN v_total_despesas / v_total_km ELSE 0 END
  WHERE id = p_motorista_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
