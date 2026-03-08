-- Criar bucket para comprovantes de despesas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comprovantes',
  'comprovantes',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Política: qualquer usuário autenticado pode fazer upload
CREATE POLICY "Usuários autenticados podem fazer upload de comprovantes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comprovantes');

-- Política: qualquer usuário autenticado pode visualizar comprovantes
CREATE POLICY "Usuários autenticados podem visualizar comprovantes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'comprovantes');

-- Política: acesso público para leitura (URLs públicas)
CREATE POLICY "Comprovantes são públicos para leitura"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'comprovantes');

-- Política: usuário pode deletar seus próprios comprovantes
CREATE POLICY "Usuários podem deletar seus comprovantes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]);
