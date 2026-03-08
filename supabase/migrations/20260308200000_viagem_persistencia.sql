-- Adiciona campo km_percorrido para persistência do rastreamento ativo
-- Este campo é atualizado periodicamente durante a viagem para que,
-- ao reabrir o app, o motorista retome de onde parou.

ALTER TABLE public.viagens
  ADD COLUMN IF NOT EXISTS km_percorrido NUMERIC DEFAULT 0;

-- Também garante que pontos_gps tenha índice eficiente por viagem
CREATE INDEX IF NOT EXISTS idx_pontos_gps_viagem_id ON public.pontos_gps(viagem_id);
CREATE INDEX IF NOT EXISTS idx_pontos_gps_timestamp ON public.pontos_gps(timestamp);

-- Índice para buscar viagem ativa por motorista rapidamente
CREATE INDEX IF NOT EXISTS idx_viagens_motorista_status ON public.viagens(motorista_id, status);
