import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Despesa, TipoDespesa } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

function dbToDespesa(row: Record<string, unknown>): Despesa {
  return {
    id: row.id as string,
    tipoDespesa: row.tipo_despesa as TipoDespesa,
    valor: Number(row.valor),
    descricao: row.descricao as string,
    data: row.data as string,
    comprovanteUrl: (row.comprovante_url as string) || undefined,
    caminhaoId: (row.caminhao_id as string) || undefined,
    viagemId: (row.viagem_id as string) || undefined,
    criadoPor: row.criado_por as 'motorista' | 'admin',
    criadoPorId: (row.criado_por_id as string) || '',
    criadoPorNome: row.criado_por_nome as string,
  };
}

export function useDespesas(viagemId?: string) {
  const { user } = useAuth();
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDespesas = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('despesas')
      .select('*')
      .order('data', { ascending: false });

    if (viagemId) {
      query = query.eq('viagem_id', viagemId);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Erro ao carregar despesas');
    } else {
      setDespesas((data || []).map(dbToDespesa));
    }
    setLoading(false);
  }, [viagemId]);

  useEffect(() => {
    fetchDespesas();
  }, [fetchDespesas]);

  const criarDespesa = async (dados: {
    tipoDespesa: TipoDespesa;
    valor: number;
    descricao: string;
    data: string;
    caminhaoId?: string;
    viagemId?: string;
    criadoPor: 'motorista' | 'admin';
    adminId?: string;
  }) => {
    if (!user) return { success: false };

    const { error } = await supabase.from('despesas').insert({
      tipo_despesa: dados.tipoDespesa,
      valor: dados.valor,
      descricao: dados.descricao,
      data: dados.data,
      caminhao_id: dados.caminhaoId || null,
      viagem_id: dados.viagemId || null,
      criado_por: dados.criadoPor,
      criado_por_id: user.id,
      criado_por_nome: user.nome,
      admin_id: dados.adminId || user.id,
    });

    if (error) {
      toast.error('Erro ao registrar despesa');
      return { success: false };
    }

    toast.success('Despesa registrada!');
    await fetchDespesas();
    return { success: true };
  };

  const atualizarDespesa = async (id: string, dados: Partial<Despesa>) => {
    const { error } = await supabase
      .from('despesas')
      .update({
        tipo_despesa: dados.tipoDespesa,
        valor: dados.valor,
        descricao: dados.descricao,
        data: dados.data,
        caminhao_id: dados.caminhaoId || null,
        viagem_id: dados.viagemId || null,
      })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar despesa');
      return { success: false };
    }

    toast.success('Despesa atualizada!');
    await fetchDespesas();
    return { success: true };
  };

  const excluirDespesa = async (id: string) => {
    const { error } = await supabase.from('despesas').delete().eq('id', id);

    if (error) {
      toast.error('Erro ao excluir despesa');
      return { success: false };
    }

    toast.success('Despesa removida!');
    await fetchDespesas();
    return { success: true };
  };

  return { despesas, loading, fetchDespesas, criarDespesa, atualizarDespesa, excluirDespesa };
}
