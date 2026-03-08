-- Adicionar campo valor_diaria na tabela caminhoes
ALTER TABLE public.caminhoes
  ADD COLUMN IF NOT EXISTS valor_diaria NUMERIC(10, 2) DEFAULT 0;
