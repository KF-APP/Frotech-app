-- =============================================
-- MIGRAÇÃO 8: Corrigir RLS de UPDATE e DELETE para admin
-- Problema: admin não consegue editar/excluir viagens e despesas
-- dos motoristas porque as políticas FOR ALL exigem admin_id = auth.uid()
-- mas só cobrem SELECT (não UPDATE/DELETE separadamente para viagens de motoristas)
-- =============================================

-- ---- VIAGENS ----

-- Remover política genérica FOR ALL do admin e criar políticas específicas
DROP POLICY IF EXISTS "Admin gerencia suas viagens" ON public.viagens;

-- Admin pode VER suas viagens e de seus motoristas (já existe na migração 7, garantir)
DROP POLICY IF EXISTS "Admin vê suas viagens e de seus motoristas" ON public.viagens;

CREATE POLICY "Admin vê suas viagens e de seus motoristas" ON public.viagens
  FOR SELECT TO authenticated USING (
    admin_id = auth.uid()
    OR motorista_id IN (
      SELECT id FROM public.motoristas WHERE admin_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.motoristas WHERE user_id = auth.uid() AND id = motorista_id)
  );

-- Admin pode INSERIR viagens (seu admin_id)
CREATE POLICY "Admin insere suas viagens" ON public.viagens
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  );

-- Admin pode ATUALIZAR viagens: as próprias OU dos seus motoristas
CREATE POLICY "Admin atualiza suas viagens e de motoristas" ON public.viagens
  FOR UPDATE TO authenticated
  USING (
    -- viagem com admin_id do admin
    admin_id = auth.uid()
    OR
    -- viagem de motorista que pertence ao admin
    motorista_id IN (
      SELECT id FROM public.motoristas WHERE admin_id = auth.uid()
    )
  )
  WITH CHECK (
    admin_id = auth.uid()
    OR motorista_id IN (
      SELECT id FROM public.motoristas WHERE admin_id = auth.uid()
    )
  );

-- Admin pode EXCLUIR viagens: as próprias OU dos seus motoristas
CREATE POLICY "Admin exclui suas viagens e de motoristas" ON public.viagens
  FOR DELETE TO authenticated
  USING (
    admin_id = auth.uid()
    OR motorista_id IN (
      SELECT id FROM public.motoristas WHERE admin_id = auth.uid()
    )
  );


-- ---- DESPESAS ----

-- Remover política genérica FOR ALL do admin e criar políticas específicas
DROP POLICY IF EXISTS "Admin gerencia suas despesas" ON public.despesas;

-- Admin pode VER suas despesas e de seus motoristas (já existe, garantir)
DROP POLICY IF EXISTS "Admin vê suas despesas e de seus motoristas" ON public.despesas;

CREATE POLICY "Admin vê suas despesas e de seus motoristas" ON public.despesas
  FOR SELECT TO authenticated USING (
    admin_id = auth.uid()
    OR criado_por_id IN (
      SELECT user_id FROM public.motoristas WHERE admin_id = auth.uid()
    )
    OR criado_por_id = auth.uid()
  );

-- Admin pode INSERIR despesas
CREATE POLICY "Admin insere suas despesas" ON public.despesas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo = 'admin')
  );

-- Admin pode ATUALIZAR despesas: as próprias OU de seus motoristas
CREATE POLICY "Admin atualiza suas despesas e de motoristas" ON public.despesas
  FOR UPDATE TO authenticated
  USING (
    -- despesa com admin_id do admin
    admin_id = auth.uid()
    OR
    -- despesa criada por motorista do admin
    criado_por_id IN (
      SELECT user_id FROM public.motoristas WHERE admin_id = auth.uid()
    )
  )
  WITH CHECK (
    admin_id = auth.uid()
    OR criado_por_id IN (
      SELECT user_id FROM public.motoristas WHERE admin_id = auth.uid()
    )
  );

-- Admin pode EXCLUIR despesas: as próprias OU de seus motoristas
CREATE POLICY "Admin exclui suas despesas e de motoristas" ON public.despesas
  FOR DELETE TO authenticated
  USING (
    admin_id = auth.uid()
    OR criado_por_id IN (
      SELECT user_id FROM public.motoristas WHERE admin_id = auth.uid()
    )
  );
