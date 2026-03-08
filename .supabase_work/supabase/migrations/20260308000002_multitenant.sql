-- =============================================
-- MIGRAÇÃO 2: MULTI-TENANT (cada admin vê apenas seus dados)
-- =============================================

-- 1. Adicionar admin_id na tabela motoristas
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Preencher admin_id existentes (usar o admin_id do caminhão vinculado, ou primeiro admin)
UPDATE public.motoristas m
SET admin_id = (
  SELECT c.admin_id FROM public.caminhoes c WHERE c.id = m.caminhao_id
)
WHERE m.caminhao_id IS NOT NULL AND m.admin_id IS NULL;

-- Para motoristas sem caminhão, pegar o primeiro admin
UPDATE public.motoristas
SET admin_id = (SELECT id FROM public.profiles WHERE tipo = 'admin' LIMIT 1)
WHERE admin_id IS NULL;

-- 2. Adicionar admin_id na tabela caminhoes (já existe, manter)
-- Já está na migration 1

-- 3. Recriar RLS policies de caminhoes para multi-tenant
DROP POLICY IF EXISTS "Caminhões visíveis para todos autenticados" ON public.caminhoes;
DROP POLICY IF EXISTS "Admin pode gerenciar caminhões" ON public.caminhoes;

CREATE POLICY "Admin vê apenas seus caminhões" ON public.caminhoes
  FOR SELECT TO authenticated USING (
    admin_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'motorista')
  );

CREATE POLICY "Admin gerencia apenas seus caminhões" ON public.caminhoes
  FOR ALL TO authenticated USING (
    admin_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  ) WITH CHECK (
    admin_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  );

-- 4. Recriar RLS policies de motoristas para multi-tenant
DROP POLICY IF EXISTS "Motoristas visíveis para todos autenticados" ON public.motoristas;
DROP POLICY IF EXISTS "Admin pode gerenciar motoristas" ON public.motoristas;
DROP POLICY IF EXISTS "Motorista pode ver seus próprios dados" ON public.motoristas;

CREATE POLICY "Admin vê apenas seus motoristas" ON public.motoristas
  FOR SELECT TO authenticated USING (
    admin_id = auth.uid() OR
    user_id = auth.uid()
  );

CREATE POLICY "Admin gerencia apenas seus motoristas" ON public.motoristas
  FOR ALL TO authenticated USING (
    admin_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  ) WITH CHECK (
    admin_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  );

CREATE POLICY "Motorista acessa seus próprios dados" ON public.motoristas
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 5. Recriar RLS policies de viagens para multi-tenant
DROP POLICY IF EXISTS "Viagens visíveis para todos autenticados" ON public.viagens;
DROP POLICY IF EXISTS "Admin pode gerenciar viagens" ON public.viagens;
DROP POLICY IF EXISTS "Motorista pode gerenciar suas viagens" ON public.viagens;

-- Adicionar admin_id em viagens
ALTER TABLE public.viagens ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Preencher admin_id das viagens existentes
UPDATE public.viagens v
SET admin_id = (
  SELECT m.admin_id FROM public.motoristas m WHERE m.id = v.motorista_id
)
WHERE v.admin_id IS NULL;

CREATE POLICY "Admin vê apenas suas viagens" ON public.viagens
  FOR SELECT TO authenticated USING (
    admin_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.motoristas WHERE user_id = auth.uid() AND id = motorista_id)
  );

CREATE POLICY "Admin gerencia suas viagens" ON public.viagens
  FOR ALL TO authenticated USING (
    admin_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  ) WITH CHECK (
    admin_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  );

CREATE POLICY "Motorista gerencia suas próprias viagens" ON public.viagens
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.motoristas WHERE user_id = auth.uid() AND id = motorista_id)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.motoristas WHERE user_id = auth.uid() AND id = motorista_id)
  );

-- 6. Recriar RLS policies de despesas para multi-tenant
DROP POLICY IF EXISTS "Despesas visíveis para todos autenticados" ON public.despesas;
DROP POLICY IF EXISTS "Admin pode gerenciar todas despesas" ON public.despesas;
DROP POLICY IF EXISTS "Motorista pode gerenciar suas despesas" ON public.despesas;

-- Adicionar admin_id em despesas
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Preencher admin_id das despesas existentes
UPDATE public.despesas d
SET admin_id = (
  SELECT c.admin_id FROM public.caminhoes c WHERE c.id = d.caminhao_id
)
WHERE d.caminhao_id IS NOT NULL AND d.admin_id IS NULL;

UPDATE public.despesas d
SET admin_id = (
  SELECT v.admin_id FROM public.viagens v WHERE v.id = d.viagem_id
)
WHERE d.viagem_id IS NOT NULL AND d.admin_id IS NULL;

CREATE POLICY "Admin vê apenas suas despesas" ON public.despesas
  FOR SELECT TO authenticated USING (
    admin_id = auth.uid() OR
    criado_por_id = auth.uid()
  );

CREATE POLICY "Admin gerencia suas despesas" ON public.despesas
  FOR ALL TO authenticated USING (
    admin_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  ) WITH CHECK (
    admin_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  );

CREATE POLICY "Motorista gerencia suas despesas" ON public.despesas
  FOR ALL TO authenticated USING (
    criado_por_id = auth.uid()
  ) WITH CHECK (
    criado_por_id = auth.uid()
  );

