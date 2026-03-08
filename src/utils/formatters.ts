export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function formatarKm(km: number): string {
  if (km >= 1000) {
    return `${(km / 1000).toFixed(1).replace('.', ',')} mil km`;
  }
  return `${km} km`;
}

export function formatarTempo(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function formatarData(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatarDataHora(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function labelTipoDespesa(tipo: string): string {
  const labels: Record<string, string> = {
    combustivel: 'Combustível',
    pedagio: 'Pedágio',
    alimentacao: 'Alimentação',
    manutencao: 'Manutenção',
    pneu: 'Pneu',
    seguro: 'Seguro',
    licenciamento: 'Licenciamento',
    ipva: 'IPVA',
    revisao: 'Revisão',
    outros: 'Outros',
  };
  return labels[tipo] || tipo;
}

export function labelStatusViagem(status: string): string {
  const labels: Record<string, string> = {
    em_andamento: 'Em andamento',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
  };
  return labels[status] || status;
}
