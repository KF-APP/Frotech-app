-- Permite que usuário recém-criado insira/atualize seu próprio profile
-- (necessário para o cadastro via signUp do frontend)

-- Remover política existente que pode bloquear o insert pelo próprio usuário
DROP POLICY IF EXISTS "Service role pode inserir profiles" ON public.profiles;

-- Permitir que o próprio usuário insira seu profile (necessário no signUp)
CREATE POLICY "Usuário pode inserir seu próprio profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Permitir que o próprio usuário faça upsert no seu profile
CREATE POLICY "Usuário pode fazer upsert no próprio profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

