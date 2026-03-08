-- =============================================
-- MIGRAÇÃO 7: Corrigir RLS para motoristas verem/criarem dados com admin_id correto
-- =============================================

-- Problema: quando motorista insere despesas/viagens, o admin_id fica errado
-- Solu��ão: relaxar as políticas para o admin ver dados dos seus motoristas

-- 1. Corrigir SELECT de despesas: admin vê despesas onde o criador é um dos seus motoristas
DROP POLICY IF EXISTS "Admin vê apenas suas despesas" ON public.despesas;

CREATE POLICY "Admin vê suas despesas e de seus motoristas" ON public.despesas
  FOR SELECT TO authenticated USING (
    -- despesa foi criada pelo próprio admin
    admin_id = auth.uid()
    OR
    -- despesa foi criada por um motorista do admin
    criado_por_id IN (
      SELECT user_id FROM public.motoristas WHERE admin_id = auth.uid()
    )
    OR
    -- o motorista vê suas próprias despesas
    criado_por_id = auth.uid()
  );

-- 2. Corrigir INSERT de despesas pelo motorista: deixar passar mesmo se admin_id vier do motorista
-- A chave é: o motorista deve conseguir inserir despesas com admin_id do seu admin
DROP POLICY IF EXISTS "Motorista gerencia suas despesas" ON public.despesas;

CREATE POLICY "Motorista gerencia suas despesas" ON public.despesas
  FOR ALL TO authenticated
  USING (criado_por_id = auth.uid())
  WITH CHECK (criado_por_id = auth.uid());

-- 3. Corrigir SELECT de viagens: admin vê viagens dos seus motoristas
DROP POLICY IF EXISTS "Admin vê apenas suas viagens" ON public.viagens;

CREATE POLICY "Admin vê suas viagens e de seus motoristas" ON public.viagens
  FOR SELECT TO authenticated USING (
    -- viagem criada com admin_id do admin
    admin_id = auth.uid()
    OR
    -- viagem é de um motorista do admin
    motorista_id IN (
      SELECT id FROM public.motoristas WHERE admin_id = auth.uid()
    )
    OR
    -- o próprio motorista vê suas viagens
    EXISTS (SELECT 1 FROM public.motoristas WHERE user_id = auth.uid() AND id = motorista_id)
  );

-- 4. Ao encerrar viagem, atualizar o admin_id correto automaticamente via trigger
-- Trigger: quando uma viagem é inserida pelo motorista, preenche o admin_id correto
CREATE OR REPLACE FUNCTION public.preencher_admin_id_viagem()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.admin_id IS NULL THEN
    SELECT admin_id INTO NEW.admin_id
    FROM public.motoristas
    WHERE id = NEW.motorista_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_preencher_admin_id_viagem ON public.viagens;
CREATE TRIGGER trg_preencher_admin_id_viagem
  BEFORE INSERT ON public.viagens
  FOR EACH ROW EXECUTE FUNCTION public.preencher_admin_id_viagem();

-- 5. Ao inserir despesa, preencher o admin_id correto automaticamente
CREATE OR REPLACE FUNCTION public.preencher_admin_id_despesa()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.admin_id IS NULL OR NEW.admin_id = auth.uid() THEN
    -- Tentar via viagem
    IF NEW.viagem_id IS NOT NULL THEN
      SELECT admin_id INTO NEW.admin_id FROM public.viagens WHERE id = NEW.viagem_id;
    END IF;
    -- Tentar via motorista (criado_por_id é o user_id do motorista)
    IF NEW.admin_id IS NULL THEN
      SELECT admin_id INTO NEW.admin_id
      FROM public.motoristas
      WHERE user_id = NEW.criado_por_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_preencher_admin_id_despesa ON public.despesas;
CREATE TRIGGER trg_preencher_admin_id_despesa
  BEFORE INSERT ON public.despesas
  FOR EACH ROW EXECUTE FUNCTION public.preencher_admin_id_despesa();
