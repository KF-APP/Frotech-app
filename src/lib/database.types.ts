export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    PostgrestVersion: '12';
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string;
          email: string;
          tipo: 'admin' | 'motorista';
          data_criacao: string;
        };
        Insert: {
          id: string;
          nome: string;
          email: string;
          tipo: 'admin' | 'motorista';
          data_criacao?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          tipo?: 'admin' | 'motorista';
          data_criacao?: string;
        };
        Relationships: [];
      };
      caminhoes: {
        Row: {
          id: string;
          placa: string;
          modelo: string;
          ano: number;
          capacidade: number;
          admin_id: string;
          total_km: number;
          total_despesas: number;
          total_viagens: number;
          criado_em: string;
          valor_diaria: number;
        };
        Insert: {
          id?: string;
          placa: string;
          modelo: string;
          ano: number;
          capacidade: number;
          admin_id: string;
          total_km?: number;
          total_despesas?: number;
          total_viagens?: number;
          criado_em?: string;
          valor_diaria?: number;
        };
        Update: {
          id?: string;
          placa?: string;
          modelo?: string;
          ano?: number;
          capacidade?: number;
          admin_id?: string;
          total_km?: number;
          total_despesas?: number;
          total_viagens?: number;
          criado_em?: string;
          valor_diaria?: number;
        };
        Relationships: [];
      };
      motoristas: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          email: string;
          telefone: string | null;
          caminhao_id: string | null;
          admin_id: string | null;
          km_total: number;
          total_viagens: number;
          custo_medio_por_km: number;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          email: string;
          telefone?: string | null;
          caminhao_id?: string | null;
          admin_id?: string | null;
          km_total?: number;
          total_viagens?: number;
          custo_medio_por_km?: number;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          email?: string;
          telefone?: string | null;
          caminhao_id?: string | null;
          admin_id?: string | null;
          km_total?: number;
          total_viagens?: number;
          custo_medio_por_km?: number;
          criado_em?: string;
        };
        Relationships: [];
      };
      viagens: {
        Row: {
          id: string;
          motorista_id: string;
          motorista_nome: string;
          caminhao_id: string;
          caminhao_placa: string;
          data_inicio: string;
          data_fim: string | null;
          tempo_total: number | null;
          km_total: number | null;
          status: 'em_andamento' | 'concluida' | 'cancelada';
          origem: string | null;
          destino: string | null;
          admin_id: string | null;
          criado_em: string;
          valor_frete: number | null;
        };
        Insert: {
          id?: string;
          motorista_id: string;
          motorista_nome: string;
          caminhao_id: string;
          caminhao_placa: string;
          data_inicio?: string;
          data_fim?: string | null;
          tempo_total?: number | null;
          km_total?: number | null;
          status?: 'em_andamento' | 'concluida' | 'cancelada';
          origem?: string | null;
          destino?: string | null;
          admin_id?: string | null;
          criado_em?: string;
          valor_frete?: number | null;
        };
        Update: {
          id?: string;
          motorista_id?: string;
          motorista_nome?: string;
          caminhao_id?: string;
          caminhao_placa?: string;
          data_inicio?: string;
          data_fim?: string | null;
          tempo_total?: number | null;
          km_total?: number | null;
          status?: 'em_andamento' | 'concluida' | 'cancelada';
          origem?: string | null;
          destino?: string | null;
          admin_id?: string | null;
          criado_em?: string;
          valor_frete?: number | null;
        };
        Relationships: [];
      };
      config_pagamentos: {
        Row: {
          id: string;
          admin_id: string;
          porcentagem_motorista: number;
          porcentagem_administrador: number;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          porcentagem_motorista: number;
          porcentagem_administrador: number;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          porcentagem_motorista?: number;
          porcentagem_administrador?: number;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [];
      };
      ciclos_pagamento: {
        Row: {
          id: string;
          admin_id: string;
          motorista_id: string;
          motorista_nome: string;
          caminhao_id: string | null;
          caminhao_placa: string | null;
          semana_inicio: string;
          semana_fim: string;
          data_pagamento: string;
          total_viagens: number;
          total_faturado: number;
          total_despesas: number;
          lucro_total: number;
          porcentagem_motorista: number;
          porcentagem_administrador: number;
          valor_motorista: number;
          valor_administrador: number;
          status: 'pendente' | 'pago';
          data_confirmacao_pagamento: string | null;
          observacoes: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          motorista_id: string;
          motorista_nome: string;
          caminhao_id?: string | null;
          caminhao_placa?: string | null;
          semana_inicio: string;
          semana_fim: string;
          data_pagamento: string;
          total_viagens: number;
          total_faturado: number;
          total_despesas: number;
          lucro_total: number;
          porcentagem_motorista: number;
          porcentagem_administrador: number;
          valor_motorista: number;
          valor_administrador: number;
          status?: 'pendente' | 'pago';
          data_confirmacao_pagamento?: string | null;
          observacoes?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          motorista_id?: string;
          motorista_nome?: string;
          caminhao_id?: string | null;
          caminhao_placa?: string | null;
          semana_inicio?: string;
          semana_fim?: string;
          data_pagamento?: string;
          total_viagens?: number;
          total_faturado?: number;
          total_despesas?: number;
          lucro_total?: number;
          porcentagem_motorista?: number;
          porcentagem_administrador?: number;
          valor_motorista?: number;
          valor_administrador?: number;
          status?: 'pendente' | 'pago';
          data_confirmacao_pagamento?: string | null;
          observacoes?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [];
      };
      codigos_acesso: {
        Row: {
          id: string;
          codigo: string;
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          codigo: string;
          ativo?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          codigo?: string;
          ativo?: boolean;
          criado_em?: string;
        };
        Relationships: [];
      };
      pontos_gps: {
        Row: {
          id: string;
          viagem_id: string;
          lat: number;
          lng: number;
          timestamp: string;
          velocidade: number | null;
          precisao: number | null;
        };
        Insert: {
          id?: string;
          viagem_id: string;
          lat: number;
          lng: number;
          timestamp?: string;
          velocidade?: number | null;
          precisao?: number | null;
        };
        Update: {
          id?: string;
          viagem_id?: string;
          lat?: number;
          lng?: number;
          timestamp?: string;
          velocidade?: number | null;
          precisao?: number | null;
        };
        Relationships: [];
      };
      despesas: {
        Row: {
          id: string;
          tipo_despesa: 'combustivel' | 'pedagio' | 'alimentacao' | 'manutencao' | 'pneu' | 'seguro' | 'licenciamento' | 'ipva' | 'revisao' | 'outros';
          valor: number;
          descricao: string;
          data: string;
          comprovante_url: string | null;
          caminhao_id: string | null;
          viagem_id: string | null;
          criado_por: 'motorista' | 'admin';
          criado_por_id: string | null;
          criado_por_nome: string;
          admin_id: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          tipo_despesa: 'combustivel' | 'pedagio' | 'alimentacao' | 'manutencao' | 'pneu' | 'seguro' | 'licenciamento' | 'ipva' | 'revisao' | 'outros';
          valor: number;
          descricao: string;
          data?: string;
          comprovante_url?: string | null;
          caminhao_id?: string | null;
          viagem_id?: string | null;
          criado_por: 'motorista' | 'admin';
          criado_por_id?: string | null;
          criado_por_nome: string;
          admin_id?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          tipo_despesa?: 'combustivel' | 'pedagio' | 'alimentacao' | 'manutencao' | 'pneu' | 'seguro' | 'licenciamento' | 'ipva' | 'revisao' | 'outros';
          valor?: number;
          descricao?: string;
          data?: string;
          comprovante_url?: string | null;
          caminhao_id?: string | null;
          viagem_id?: string | null;
          criado_por?: 'motorista' | 'admin';
          criado_por_id?: string | null;
          criado_por_nome?: string;
          admin_id?: string | null;
          criado_em?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      update_caminhao_stats: {
        Args: { p_caminhao_id: string };
        Returns: undefined;
      };
      update_motorista_stats: {
        Args: { p_motorista_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
