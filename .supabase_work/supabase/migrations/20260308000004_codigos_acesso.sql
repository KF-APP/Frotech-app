-- Tabela para armazenar códigos de acesso de cadastro de admin
CREATE TABLE IF NOT EXISTS public.codigos_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir o código padrão K3P
INSERT INTO public.codigos_acesso (codigo, ativo) 
VALUES ('K3P', true)
ON CONFLICT (codigo) DO NOTHING;

-- RLS: qualquer um pode verificar se um código existe e está ativo (necessário para o cadastro público)
ALTER TABLE public.codigos_acesso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode verificar código de acesso" ON public.codigos_acesso
  FOR SELECT USING (ativo = true);

-- Apenas admins podem gerenciar códigos
CREATE POLICY "Admin pode gerenciar códigos" ON public.codigos_acesso
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  );
