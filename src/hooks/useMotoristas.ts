import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Motorista } from '@/types';

function dbToMotorista(row: Record<string, unknown>): Motorista {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    nome: row.nome as string,
    email: row.email as string,
    telefone: (row.telefone as string) || '',
    caminhaoId: (row.caminhao_id as string) || undefined,
    kmTotal: Number(row.km_total) || 0,
    totalViagens: Number(row.total_viagens) || 0,
    custoMedioPorKm: Number(row.custo_medio_por_km) || 0,
  };
}

export function useMotoristas() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMotoristas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('motoristas')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar motoristas');
    } else {
      setMotoristas((data || []).map(dbToMotorista));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMotoristas();
  }, [fetchMotoristas]);

  const criarMotorista = async (dados: {
    nome: string;
    email: string;
    senha: string;
    telefone: string;
    caminhaoId?: string;
  }) => {
    // Create auth user via admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: dados.email,
      password: dados.senha,
      email_confirm: true,
      user_metadata: {
        nome: dados.nome,
        tipo: 'motorista',
      },
    });

    if (authError || !authData.user) {
      if (authError?.message?.includes('already')) {
        toast.error('Já existe um usuário com este email');
      } else {
        toast.error('Erro ao criar conta do motorista');
      }
      return { success: false };
    }

    // Create motorista record
    const { error: motError } = await supabase.from('motoristas').insert({
      user_id: authData.user.id,
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      caminhao_id: dados.caminhaoId || null,
    });

    if (motError) {
      toast.error('Erro ao cadastrar motorista');
      return { success: false };
    }

    // Update caminhão if linked
    if (dados.caminhaoId) {
      await supabase
        .from('caminhoes')
        .update({ total_viagens: 0 })
        .eq('id', dados.caminhaoId);
    }

    toast.success('Motorista cadastrado com sucesso!');
    await fetchMotoristas();
    return { success: true };
  };

  const atualizarMotorista = async (id: string, dados: Partial<Motorista>) => {
    const { error } = await supabase
      .from('motoristas')
      .update({
        nome: dados.nome,
        telefone: dados.telefone,
        caminhao_id: dados.caminhaoId || null,
      })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar motorista');
      return { success: false };
    }

    toast.success('Motorista atualizado!');
    await fetchMotoristas();
    return { success: true };
  };

  const excluirMotorista = async (id: string) => {
    // Get user_id before deleting
    const { data: mot } = await supabase
      .from('motoristas')
      .select('user_id')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('motoristas').delete().eq('id', id);

    if (error) {
      toast.error('Erro ao excluir motorista');
      return { success: false };
    }

    // Also delete auth user
    if (mot?.user_id) {
      await supabase.auth.admin.deleteUser(mot.user_id);
    }

    toast.success('Motorista removido!');
    await fetchMotoristas();
    return { success: true };
  };

  return { motoristas, loading, fetchMotoristas, criarMotorista, atualizarMotorista, excluirMotorista };
}
