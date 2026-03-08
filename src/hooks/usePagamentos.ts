import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { CicloPagamento, ConfigPagamento } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

// Converte registro do DB para ConfigPagamento
function dbToConfig(row: Record<string, unknown>): ConfigPagamento {
  return {
    id: row.id as string,
    adminId: row.admin_id as string,
    porcentagemMotorista: Number(row.porcentagem_motorista),
    porcentagemAdministrador: Number(row.porcentagem_administrador),
    criadoEm: row.criado_em as string,
    atualizadoEm: row.atualizado_em as string,
  };
}

// Converte registro do DB para CicloPagamento
function dbToCiclo(row: Record<string, unknown>): CicloPagamento {
  return {
    id: row.id as string,
    adminId: row.admin_id as string,
    motoristaId: row.motorista_id as string,
    motoristaNome: row.motorista_nome as string,
    caminhaoId: (row.caminhao_id as string) || undefined,
    caminhaoPlaca: (row.caminhao_placa as string) || undefined,
    semanaInicio: row.semana_inicio as string,
    semanaFim: row.semana_fim as string,
    dataPagamento: row.data_pagamento as string,
    totalViagens: Number(row.total_viagens),
    totalFaturado: Number(row.total_faturado),
    totalDespesas: Number(row.total_despesas),
    lucroTotal: Number(row.lucro_total),
    porcentagemMotorista: Number(row.porcentagem_motorista),
    porcentagemAdministrador: Number(row.porcentagem_administrador),
    valorMotorista: Number(row.valor_motorista),
    valorAdministrador: Number(row.valor_administrador),
    status: row.status as 'pendente' | 'pago',
    dataConfirmacaoPagamento: (row.data_confirmacao_pagamento as string) || undefined,
    observacoes: (row.observacoes as string) || undefined,
    criadoEm: row.criado_em as string,
    atualizadoEm: row.atualizado_em as string,
  };
}

// Calcula a data da sexta-feira de uma semana dado um dia qualquer
export function getSextaFeira(data: Date): Date {
  const d = new Date(data);
  const diaSemana = d.getDay(); // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
  // Sexta-feira = 5
  const diasAteSexta = (5 - diaSemana + 7) % 7;
  d.setDate(d.getDate() + diasAteSexta);
  return d;
}

// Calcula o sábado que inicia a semana (semana vai de sábado a sexta)
export function getSabadoInicio(data: Date): Date {
  const d = new Date(data);
  const diaSemana = d.getDay(); // 0=Dom, 1=Seg, ..., 6=Sab
  // Sábado = 6; queremos o sábado anterior
  const diasAteSabado = (diaSemana - 6 + 7) % 7;
  d.setDate(d.getDate() - diasAteSabado);
  return d;
}

// Formata uma data para string YYYY-MM-DD
export function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function usePagamentos() {
  const { user } = useAuth();
  const [ciclos, setCiclos] = useState<CicloPagamento[]>([]);
  const [config, setConfig] = useState<ConfigPagamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Busca configuração de pagamento do admin
  const fetchConfig = useCallback(async () => {
    if (!user?.id) return;
    setLoadingConfig(true);
    const { data, error } = await supabase
      .from('config_pagamentos')
      .select('*')
      .eq('admin_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, que é normal se não tiver config
      console.error('fetchConfig error:', error);
    }
    setConfig(data ? dbToConfig(data as Record<string, unknown>) : null);
    setLoadingConfig(false);
  }, [user?.id]);

  // Salva ou atualiza a configuração de divisão de lucro
  const salvarConfig = async (porcentagemMotorista: number) => {
    if (!user?.id) return { success: false };
    const porcentagemAdministrador = 100 - porcentagemMotorista;

    if (config?.id) {
      // Atualiza existente
      const { error } = await supabase
        .from('config_pagamentos')
        .update({
          porcentagem_motorista: porcentagemMotorista,
          porcentagem_administrador: porcentagemAdministrador,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', config.id);

      if (error) {
        toast.error('Erro ao salvar configuração');
        return { success: false };
      }
    } else {
      // Cria nova
      const { error } = await supabase
        .from('config_pagamentos')
        .insert({
          admin_id: user.id,
          porcentagem_motorista: porcentagemMotorista,
          porcentagem_administrador: porcentagemAdministrador,
        });

      if (error) {
        toast.error('Erro ao salvar configuração');
        return { success: false };
      }
    }

    toast.success('Configuração de divisão salva!');
    await fetchConfig();
    return { success: true };
  };

  // Busca ciclos de pagamento
  const fetchCiclos = useCallback(async (filtros?: {
    motoristaId?: string;
    caminhaoId?: string;
    dataInicio?: string;
    dataFim?: string;
    status?: 'pendente' | 'pago';
  }) => {
    if (!user?.id) return;
    setLoading(true);

    let query = supabase
      .from('ciclos_pagamento')
      .select('*')
      .eq('admin_id', user.id)
      .order('semana_inicio', { ascending: false });

    if (filtros?.motoristaId) query = query.eq('motorista_id', filtros.motoristaId);
    if (filtros?.caminhaoId) query = query.eq('caminhao_id', filtros.caminhaoId);
    if (filtros?.status) query = query.eq('status', filtros.status);
    if (filtros?.dataInicio) query = query.gte('semana_inicio', filtros.dataInicio);
    if (filtros?.dataFim) query = query.lte('semana_fim', filtros.dataFim);

    const { data, error } = await query;

    if (error) {
      toast.error('Erro ao carregar pagamentos');
    } else {
      setCiclos((data || []).map(row => dbToCiclo(row as Record<string, unknown>)));
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchConfig();
    fetchCiclos();
  }, [fetchConfig, fetchCiclos]);

  // Gera ciclos de pagamento a partir das viagens e despesas de um período
  const gerarCiclos = async (dataInicio: string, dataFim: string) => {
    if (!user?.id) return { success: false };

    const porcentagemMotorista = config?.porcentagemMotorista ?? 30;
    const porcentagemAdministrador = 100 - porcentagemMotorista;

    // Busca viagens concluídas no período
    const { data: viagens, error: erroViagens } = await supabase
      .from('viagens')
      .select('*')
      .eq('status', 'concluida')
      .gte('data_inicio', dataInicio)
      .lte('data_inicio', dataFim + 'T23:59:59Z');

    if (erroViagens) {
      toast.error('Erro ao buscar viagens para gerar ciclos');
      return { success: false };
    }

    if (!viagens || viagens.length === 0) {
      toast.info('Nenhuma viagem concluída encontrada no período');
      return { success: false, semCiclos: true };
    }

    // Busca caminhões para obter valor_diaria (igual ao cálculo do Dashboard)
    const { data: caminhoes } = await supabase
      .from('caminhoes')
      .select('id, valor_diaria')
      .eq('admin_id', user.id);

    const valorDiariaPorCaminhao: Record<string, number> = {};
    for (const c of (caminhoes || [])) {
      valorDiariaPorCaminhao[c.id] = Number(c.valor_diaria) || 0;
    }

    // Busca despesas no período vinculadas a viagens
    const viagemIds = viagens.map(v => v.id);
    const { data: despesas } = await supabase
      .from('despesas')
      .select('*')
      .in('viagem_id', viagemIds);

    // Agrupa despesas por viagem
    const despesasPorViagem: Record<string, number> = {};
    for (const d of (despesas || [])) {
      const vid = d.viagem_id as string;
      if (!vid) continue;
      despesasPorViagem[vid] = (despesasPorViagem[vid] || 0) + Number(d.valor);
    }

    // Agrupa viagens por motorista e semana (sábado a sexta)
    type GrupoKey = string; // `${motoristaId}_${semanaInicio}`
    type Grupo = {
      motoristaId: string;
      motoristaNome: string;
      caminhaoId: string;
      caminhaoPlaca: string;
      semanaInicio: string;
      semanaFim: string;
      dataPagamento: string;
      viagens: typeof viagens;
    };

    const grupos: Map<GrupoKey, Grupo> = new Map();

    for (const v of viagens) {
      const dataViagem = new Date(v.data_inicio as string);
      const sabadoInicio = getSabadoInicio(dataViagem);
      const sextaFim = new Date(sabadoInicio);
      sextaFim.setDate(sextaFim.getDate() + 6); // sábado + 6 dias = sexta
      const sextaPagamento = sextaFim; // sexta-feira é o dia de pagamento

      const semanaInicioStr = toDateString(sabadoInicio);
      const semanaFimStr = toDateString(sextaFim);
      const dataPagamentoStr = toDateString(sextaPagamento);

      const key: GrupoKey = `${v.motorista_id}_${semanaInicioStr}`;

      if (!grupos.has(key)) {
        grupos.set(key, {
          motoristaId: v.motorista_id as string,
          motoristaNome: v.motorista_nome as string,
          caminhaoId: v.caminhao_id as string,
          caminhaoPlaca: v.caminhao_placa as string,
          semanaInicio: semanaInicioStr,
          semanaFim: semanaFimStr,
          dataPagamento: dataPagamentoStr,
          viagens: [],
        });
      }
      grupos.get(key)!.viagens.push(v);
    }

    // Para cada grupo, calcula os valores e insere/atualiza no banco
    let ciclosCriados = 0;
    let ciclosAtualizados = 0;

    for (const [, grupo] of grupos) {
      // Faturamento = valor_diaria do caminhão × número de viagens (igual ao Dashboard)
      const totalFaturado = grupo.viagens.reduce((sum, v) => {
        const diaria = valorDiariaPorCaminhao[v.caminhao_id as string] || 0;
        return sum + diaria;
      }, 0);
      const totalDespesas = grupo.viagens.reduce((sum, v) => sum + (despesasPorViagem[v.id] || 0), 0);
      const lucroTotal = totalFaturado - totalDespesas;
      const valorMotorista = (lucroTotal * porcentagemMotorista) / 100;
      const valorAdministrador = (lucroTotal * porcentagemAdministrador) / 100;

      // Verifica se já existe ciclo para esse motorista/semana
      const { data: existente } = await supabase
        .from('ciclos_pagamento')
        .select('id, status')
        .eq('admin_id', user.id)
        .eq('motorista_id', grupo.motoristaId)
        .eq('semana_inicio', grupo.semanaInicio)
        .single();

      if (existente && (existente as { id: string; status: string }).status === 'pago') {
        // Não reprocessa ciclos já pagos
        continue;
      }

      const dadosCiclo = {
        admin_id: user.id,
        motorista_id: grupo.motoristaId,
        motorista_nome: grupo.motoristaNome,
        caminhao_id: grupo.caminhaoId || null,
        caminhao_placa: grupo.caminhaoPlaca || null,
        semana_inicio: grupo.semanaInicio,
        semana_fim: grupo.semanaFim,
        data_pagamento: grupo.dataPagamento,
        total_viagens: grupo.viagens.length,
        total_faturado: totalFaturado,
        total_despesas: totalDespesas,
        lucro_total: lucroTotal,
        porcentagem_motorista: porcentagemMotorista,
        porcentagem_administrador: porcentagemAdministrador,
        valor_motorista: valorMotorista,
        valor_administrador: valorAdministrador,
        status: 'pendente' as const,
        atualizado_em: new Date().toISOString(),
      };

      if (existente) {
        const existenteId = (existente as { id: string; status: string }).id;
        await supabase
          .from('ciclos_pagamento')
          .update(dadosCiclo)
          .eq('id', existenteId);
        ciclosAtualizados++;
      } else {
        await supabase.from('ciclos_pagamento').insert([dadosCiclo]);
        ciclosCriados++;
      }
    }

    toast.success(`Ciclos gerados: ${ciclosCriados} novos, ${ciclosAtualizados} atualizados`);
    await fetchCiclos();
    return { success: true };
  };

  // Marca um ciclo como pago
  const marcarComoPago = async (cicloId: string, observacoes?: string) => {
    const { error } = await supabase
      .from('ciclos_pagamento')
      .update({
        status: 'pago',
        data_confirmacao_pagamento: new Date().toISOString(),
        observacoes: observacoes || null,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', cicloId);

    if (error) {
      toast.error('Erro ao confirmar pagamento');
      return { success: false };
    }

    toast.success('Pagamento confirmado!');
    await fetchCiclos();
    return { success: true };
  };

  // Reverte status para pendente
  const reverterParaPendente = async (cicloId: string) => {
    const { error } = await supabase
      .from('ciclos_pagamento')
      .update({
        status: 'pendente',
        data_confirmacao_pagamento: null,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', cicloId);

    if (error) {
      toast.error('Erro ao reverter pagamento');
      return { success: false };
    }

    toast.success('Pagamento revertido para pendente');
    await fetchCiclos();
    return { success: true };
  };

  // Exclui um ciclo pendente
  const excluirCiclo = async (cicloId: string) => {
    const { error } = await supabase
      .from('ciclos_pagamento')
      .delete()
      .eq('id', cicloId);

    if (error) {
      toast.error('Erro ao excluir ciclo de pagamento');
      return { success: false };
    }

    toast.success('Ciclo removido');
    await fetchCiclos();
    return { success: true };
  };

  return {
    ciclos,
    config,
    loading,
    loadingConfig,
    fetchCiclos,
    fetchConfig,
    salvarConfig,
    gerarCiclos,
    marcarComoPago,
    reverterParaPendente,
    excluirCiclo,
  };
}
