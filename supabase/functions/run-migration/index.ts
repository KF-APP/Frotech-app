import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const sql = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('admin', 'motorista')),
      data_criacao TIMESTAMPTZ DEFAULT NOW()
    );

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

    CREATE TABLE IF NOT EXISTS public.pontos_gps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      viagem_id UUID NOT NULL REFERENCES public.viagens(id) ON DELETE CASCADE,
      lat NUMERIC NOT NULL,
      lng NUMERIC NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      velocidade NUMERIC,
      precisao NUMERIC
    );

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
  `

  // Use admin client to run SQL statements
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0)
  const results = []

  for (const stmt of statements) {
    const { error } = await supabaseAdmin.rpc('exec', { sql: stmt }).maybeSingle()
    if (error) {
      // Try alternative approach
      results.push({ stmt: stmt.substring(0, 50), error: error.message })
    } else {
      results.push({ stmt: stmt.substring(0, 50), status: 'ok' })
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
