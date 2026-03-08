export type UserType = 'admin' | 'motorista';

export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: UserType;
  dataCriacao: string;
}

export interface Caminhao {
  id: string;
  placa: string;
  modelo: string;
  ano: number;
  capacidade: number;
  adminId: string;
  totalKm: number;
  totalDespesas: number;
  totalViagens: number;
  valorDiaria: number;
}

export interface Motorista {
  id: string;
  userId: string;
  nome: string;
  email: string;
  telefone: string;
  caminhaoId?: string;
  kmTotal: number;
  totalViagens: number;
  custoMedioPorKm: number;
}

export type StatusViagem = 'em_andamento' | 'concluida' | 'cancelada';

export interface PontoGPS {
  lat: number;
  lng: number;
  timestamp: string;
  velocidade?: number;
  precisao?: number;
}

export interface Viagem {
  id: string;
  motoristaId: string;
  motoristaNome: string;
  caminhaoId: string;
  caminhaoPlaca: string;
  dataInicio: string;
  dataFim?: string;
  tempoTotal?: number; // em minutos
  kmTotal?: number;
  rota: PontoGPS[];
  status: StatusViagem;
  origem?: string;
  destino?: string;
  valorFrete?: number; // valor do frete/viagem para cálculo de pagamento
}

export type TipoDespesa = 'combustivel' | 'pedagio' | 'alimentacao' | 'manutencao' | 'pneu' | 'seguro' | 'licenciamento' | 'ipva' | 'revisao' | 'outros';

export interface Despesa {
  id: string;
  tipoDespesa: TipoDespesa;
  valor: number;
  descricao: string;
  data: string;
  comprovanteUrl?: string;
  caminhaoId?: string;
  viagemId?: string;
  criadoPor: 'motorista' | 'admin';
  criadoPorId: string;
  criadoPorNome: string;
}

export interface DashboardStats {
  totalViagens: number;
  totalKm: number;
  totalDespesas: number;
  custoMedioPorKm: number;
  totalCombustivel: number;
  totalManutencao: number;
  tempoMedioViagens: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// --- Pagamentos ---

export interface ConfigPagamento {
  id: string;
  adminId: string;
  porcentagemMotorista: number;
  porcentagemAdministrador: number;
  criadoEm: string;
  atualizadoEm: string;
}

export type StatusPagamento = 'pendente' | 'pago';

export interface CicloPagamento {
  id: string;
  adminId: string;
  motoristaId: string;
  motoristaNome: string;
  caminhaoId?: string;
  caminhaoPlaca?: string;
  semanaInicio: string;
  semanaFim: string;
  dataPagamento: string;
  totalViagens: number;
  totalFaturado: number;
  totalDespesas: number;
  lucroTotal: number;
  porcentagemMotorista: number;
  porcentagemAdministrador: number;
  valorMotorista: number;
  valorAdministrador: number;
  status: StatusPagamento;
  dataConfirmacaoPagamento?: string;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}
