import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Caminhao } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

function dbToCaminhao(row: Record<string, unknown>): Caminhao {
  return {
    id: row.id as string,
    placa: row.placa as string,
    modelo: row.modelo as string,
    ano: row.ano as number,
    capacidade: row.capacidade as number,
    adminId: row.admin_id as string,
    totalKm: Number(row.total_km) || 0,
    totalDespesas: Number(row.total_despesas) || 0,
    totalViagens: Number(row.total_viagens) || 0,
  };
}

export function useCaminhoes() {
  const { user } = useAuth();
  const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCaminhoes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('caminhoes')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar caminhões');
    } else {
      setCaminhoes((data || []).map(dbToCaminhao));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCaminhoes();
  }, [fetchCaminhoes]);

  const criarCaminhao = async (dados: Omit<Caminhao, 'id' | 'adminId' | 'totalKm' | 'totalDespesas' | 'totalViagens'>) => {
    if (!user) return { success: false };

    const { error } = await supabase.from('caminhoes').insert({
      placa: dados.placa,
      modelo: dados.modelo,
      ano: dados.ano,
      capacidade: dados.capacidade,
      admin_id: user.id,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('Já existe um caminhão com essa placa');
      } else {
        toast.error('Erro ao cadastrar caminhão');
      }
      return { success: false };
    }

    toast.success('Caminhão cadastrado com sucesso!');
    await fetchCaminhoes();
    return { success: true };
  };

  const atualizarCaminhao = async (id: string, dados: Partial<Caminhao>) => {
    const { error } = await supabase
      .from('caminhoes')
      .update({
        placa: dados.placa,
        modelo: dados.modelo,
        ano: dados.ano,
        capacidade: dados.capacidade,
      })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar caminhão');
      return { success: false };
    }

    toast.success('Caminhão atualizado!');
    await fetchCaminhoes();
    return { success: true };
  };

  const excluirCaminhao = async (id: string) => {
    const { error } = await supabase.from('caminhoes').delete().eq('id', id);

    if (error) {
      toast.error('Erro ao excluir caminhão');
      return { success: false };
    }

    toast.success('Caminhão removido!');
    await fetchCaminhoes();
    return { success: true };
  };

  return { caminhoes, loading, fetchCaminhoes, criarCaminhao, atualizarCaminhao, excluirCaminhao };
}
