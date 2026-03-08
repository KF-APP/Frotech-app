-- Migration: Tabelas de Pagamentos
-- Adiciona suporte a pagamentos semanais, configuração de divisão de lucro
-- e histórico de pagamentos por motorista

-- 1. Tabela de configuração de divisão de lucro
CREATE TABLE IF NOT EXISTS public.config_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  porcentagem_motorista NUMERIC NOT NULL DEFAULT 30 CHECK (porcentagem_motorista >= 0 AND porcentagem_motorista <= 100),
  porcentagem_administrador NUMERIC NOT NULL DEFAULT 70 CHECK (porcentagem_administrador >= 0 AND porcentagem_administrador <= 100),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT soma_porcentagem_100 CHECK (porcentagem_motorista + porcentagem_administrador = 100)
);

ALTER TABLE public.config_pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar config de pagamentos" ON public.config_pagamentos
  FOR ALL TO authenticated USING (admin_id = auth.uid());

CREATE POLICY "Motoristas podem ver config de pagamentos" ON public.config_pagamentos
  FOR SELECT TO authenticated USING (true);

-- 2. Adicionar campo valor_frete na tabela viagens (valor da viagem/frete)
ALTER TABLE public.viagens ADD COLUMN IF NOT EXISTS valor_frete NUMERIC DEFAULT 0;

-- 3. Tabela de ciclos de pagamento semanal (agrupamento por semana)
CREATE TABLE IF NOT EXISTS public.ciclos_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  motorista_id UUID NOT NULL REFERENCES public.motoristas(id) ON DELETE CASCADE,
  motorista_nome TEXT NOT NULL,
  caminhao_id UUID REFERENCES public.caminhoes(id) ON DELETE SET NULL,
  caminhao_placa TEXT,
  semana_inicio DATE NOT NULL,
  semana_fim DATE NOT NULL,
  data_pagamento DATE NOT NULL, -- sempre a sexta-feira da semana
  total_viagens INTEGER NOT NULL DEFAULT 0,
  total_faturado NUMERIC NOT NULL DEFAULT 0,
  total_despesas NUMERIC NOT NULL DEFAULT 0,
  lucro_total NUMERIC NOT NULL DEFAULT 0,
  porcentagem_motorista NUMERIC NOT NULL DEFAULT 30,
  porcentagem_administrador NUMERIC NOT NULL DEFAULT 70,
  valor_motorista NUMERIC NOT NULL DEFAULT 0,
  valor_administrador NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
  data_confirmacao_pagamento TIMESTAMPTZ,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ciclos_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar ciclos de pagamento" ON public.ciclos_pagamento
  FOR ALL TO authenticated USING (admin_id = auth.uid());

CREATE POLICY "Motoristas podem ver seus ciclos de pagamento" ON public.ciclos_pagamento
  FOR SELECT TO authenticated USING (
    motorista_id IN (
      SELECT id FROM public.motoristas WHERE user_id = auth.uid()
    )
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ciclos_pagamento_admin ON public.ciclos_pagamento(admin_id);
CREATE INDEX IF NOT EXISTS idx_ciclos_pagamento_motorista ON public.ciclos_pagamento(motorista_id);
CREATE INDEX IF NOT EXISTS idx_ciclos_pagamento_semana ON public.ciclos_pagamento(semana_inicio, semana_fim);
CREATE INDEX IF NOT EXISTS idx_ciclos_pagamento_status ON public.ciclos_pagamento(status);
CREATE INDEX IF NOT EXISTS idx_viagens_valor_frete ON public.viagens(valor_frete);

-- Adicionar admin_id na tabela de motoristas se não existir
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.viagens ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
