import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Viagem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

function dbToViagem(row: Record<string, unknown>): Viagem {
  return {
    id: row.id as string,
    motoristaId: row.motorista_id as string,
    motoristaNome: row.motorista_nome as string,
    caminhaoId: row.caminhao_id as string,
    caminhaoPlaca: row.caminhao_placa as string,
    dataInicio: row.data_inicio as string,
    dataFim: (row.data_fim as string) || undefined,
    tempoTotal: row.tempo_total ? Number(row.tempo_total) : undefined,
    kmTotal: row.km_total ? Number(row.km_total) : undefined,
    rota: [],
    status: row.status as 'em_andamento' | 'concluida' | 'cancelada',
    origem: (row.origem as string) || undefined,
    destino: (row.destino as string) || undefined,
  };
}

export function useViagens(motoristaId?: string) {
  const { user } = useAuth();
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchViagens = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('viagens')
      .select('*')
      .order('data_inicio', { ascending: false });

    if (motoristaId) {
      query = query.eq('motorista_id', motoristaId);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Erro ao carregar viagens');
    } else {
      setViagens((data || []).map(dbToViagem));
    }
    setLoading(false);
  }, [motoristaId]);

  useEffect(() => {
    fetchViagens();
  }, [fetchViagens]);

  const iniciarViagem = async (dados: {
    motoristaId: string;
    motoristaNome: string;
    caminhaoId: string;
    caminhaoPlaca: string;
    origem?: string;
    adminId?: string;
  }) => {
    const { data, error } = await supabase
      .from('viagens')
      .insert({
        motorista_id: dados.motoristaId,
        motorista_nome: dados.motoristaNome,
        caminhao_id: dados.caminhaoId,
        caminhao_placa: dados.caminhaoPlaca,
        origem: dados.origem || null,
        status: 'em_andamento',
        admin_id: dados.adminId || user?.id || null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao iniciar viagem');
      return { success: false };
    }

    toast.success('Viagem iniciada!');
    await fetchViagens();
    return { success: true, viagemId: data.id };
  };

  const finalizarViagem = async (id: string, dados: {
    kmTotal: number;
    tempoTotal: number;
    destino?: string;
  }) => {
    const { error } = await supabase
      .from('viagens')
      .update({
        status: 'concluida',
        data_fim: new Date().toISOString(),
        km_total: dados.kmTotal,
        tempo_total: dados.tempoTotal,
        destino: dados.destino || null,
      })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao finalizar viagem');
      return { success: false };
    }

    toast.success('Viagem finalizada!');
    await fetchViagens();
    return { success: true };
  };

  const salvarPontoGPS = async (viagemId: string, lat: number, lng: number, velocidade?: number, precisao?: number) => {
    await supabase.from('pontos_gps').insert({
      viagem_id: viagemId,
      lat,
      lng,
      velocidade: velocidade || null,
      precisao: precisao || null,
    });
  };

  const buscarPontosGPS = async (viagemId: string) => {
    const { data } = await supabase
      .from('pontos_gps')
      .select('*')
      .eq('viagem_id', viagemId)
      .order('timestamp', { ascending: true });
    return data || [];
  };

  return { viagens, loading, fetchViagens, iniciarViagem, finalizarViagem, salvarPontoGPS, buscarPontosGPS };
}
