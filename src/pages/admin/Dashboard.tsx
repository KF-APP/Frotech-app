import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Truck,
  Route,
  DollarSign,
  Fuel,
  Wrench,
  TrendingDown,
  Clock,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatarMoeda, formatarKm, formatarTempo } from '../../utils/formatters';
import { useViagens } from '@/hooks/useViagens';
import { useDespesas } from '@/hooks/useDespesas';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useCaminhoes } from '@/hooks/useCaminhoes';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];

export default function Dashboard() {
  const { viagens, loading: loadingViagens } = useViagens();
  const { despesas, loading: loadingDespesas } = useDespesas();
  const { motoristas, loading: loadingMotoristas } = useMotoristas();
  const { caminhoes, loading: loadingCaminhoes } = useCaminhoes();

  const loading = loadingViagens || loadingDespesas || loadingMotoristas || loadingCaminhoes;

  const viagensEmAndamento = viagens.filter(v => v.status === 'em_andamento');
  const viagensConcluidas = viagens.filter(v => v.status === 'concluida');

  const totalKm = viagensConcluidas.reduce((acc, v) => acc + (v.kmTotal || 0), 0);
  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
  const totalCombustivel = despesas.filter(d => d.tipoDespesa === 'combustivel').reduce((acc, d) => acc + d.valor, 0);
  const totalManutencao = despesas.filter(d => ['manutencao', 'pneu', 'revisao'].includes(d.tipoDespesa)).reduce((acc, d) => acc + d.valor, 0);
  const tempoMedioMin = viagensConcluidas.filter(v => v.tempoTotal).length > 0
    ? viagensConcluidas.filter(v => v.tempoTotal).reduce((acc, v) => acc + (v.tempoTotal || 0), 0) / viagensConcluidas.filter(v => v.tempoTotal).length
    : 0;
  const custoKm = totalKm > 0 ? totalDespesas / totalKm : 0;

  // Group despesas by category for pie chart
  const despesasPorCategoria = [
    { name: 'Combustível', value: totalCombustivel, fill: 'var(--color-chart-1)' },
    { name: 'Manutenção', value: totalManutencao, fill: 'var(--color-chart-2)' },
    { name: 'Pedágio', value: despesas.filter(d => d.tipoDespesa === 'pedagio').reduce((a, d) => a + d.valor, 0), fill: 'var(--color-chart-3)' },
    { name: 'Alimentação', value: despesas.filter(d => d.tipoDespesa === 'alimentacao').reduce((a, d) => a + d.valor, 0), fill: 'var(--color-chart-4)' },
    { name: 'Outros', value: despesas.filter(d => ['seguro', 'licenciamento', 'ipva', 'outros'].includes(d.tipoDespesa)).reduce((a, d) => a + d.valor, 0), fill: 'var(--color-chart-5)' },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral da operação da frota</p>
      </div>

      {/* Alerta viagens em andamento */}
      {viagensEmAndamento.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{viagensEmAndamento.length} viagem(ns) em andamento</p>
                <p className="text-xs text-muted-foreground">
                  {viagensEmAndamento.map(v => v.motoristaNome).join(', ')} em rota agora
                </p>
              </div>
              <Badge className="ml-auto">Ao vivo</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total de Viagens"
          value={viagens.length.toString()}
          icon={Route}
          trend={`${viagensConcluidas.length} concluídas`}
          positive
        />
        <KpiCard
          title="KM Rodados"
          value={formatarKm(totalKm)}
          icon={Truck}
          trend="viagens concluídas"
          positive
        />
        <KpiCard
          title="Total Despesas"
          value={formatarMoeda(totalDespesas)}
          icon={DollarSign}
          trend={`${despesas.length} lançamentos`}
          positive={false}
        />
        <KpiCard
          title="Custo por KM"
          value={totalKm > 0 ? `R$ ${custoKm.toFixed(2)}` : '—'}
          icon={TrendingDown}
          trend="média da frota"
          positive
        />
      </div>

      {/* Segunda linha de KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Combustível"
          value={formatarMoeda(totalCombustivel)}
          icon={Fuel}
          trend={totalDespesas > 0 ? `${((totalCombustivel / totalDespesas) * 100).toFixed(0)}% do total` : '0%'}
          positive
          small
        />
        <KpiCard
          title="Manutenção"
          value={formatarMoeda(totalManutencao)}
          icon={Wrench}
          trend={totalDespesas > 0 ? `${((totalManutencao / totalDespesas) * 100).toFixed(0)}% do total` : '0%'}
          positive={false}
          small
        />
        <KpiCard
          title="Tempo Médio"
          value={tempoMedioMin > 0 ? formatarTempo(tempoMedioMin) : '—'}
          icon={Clock}
          trend="por viagem"
          positive
          small
        />
        <KpiCard
          title="Frota Ativa"
          value={`${caminhoes.length} caminhões`}
          icon={Truck}
          trend={`${motoristas.length} motoristas`}
          positive
          small
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Despesas por categoria */}
        {despesasPorCategoria.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Despesas por Categoria</CardTitle>
              <CardDescription>Distribuição dos gastos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={despesasPorCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {despesasPorCategoria.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                      formatter={(v) => [formatarMoeda(Number(v)), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1">
                {despesasPorCategoria.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground truncate">{d.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Viagens por status */}
        {viagens.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimas Viagens</CardTitle>
              <CardDescription>Status das viagens recentes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { status: 'Em andamento', qtd: viagensEmAndamento.length, fill: 'var(--color-chart-1)' },
                  { status: 'Concluídas', qtd: viagensConcluidas.length, fill: 'var(--color-chart-2)' },
                  { status: 'Canceladas', qtd: viagens.filter(v => v.status === 'cancelada').length, fill: 'var(--color-chart-5)' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                    formatter={(v) => [`${v} viagem(ns)`, '']}
                  />
                  <Bar dataKey="qtd" radius={[4, 4, 0, 0]}>
                    {[{ fill: 'var(--color-chart-1)' }, { fill: 'var(--color-chart-2)' }, { fill: 'var(--color-chart-5)' }].map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Custo por KM por motorista */}
      {motoristas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desempenho por Motorista</CardTitle>
            <CardDescription>KM rodados por motorista</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={motoristas.slice(0, 8).map(m => ({ nome: m.nome.split(' ')[0], km: m.kmTotal }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                  formatter={(v) => [`${v} km`, 'KM']}
                />
                <Bar dataKey="km" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Custo por KM evolução (static placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custo Médio por KM</CardTitle>
          <CardDescription>Comparativo entre motoristas</CardDescription>
        </CardHeader>
        <CardContent>
          {motoristas.length > 0 ? (
            <div className="space-y-3">
              {motoristas
                .filter(m => m.kmTotal > 0)
                .sort((a, b) => b.kmTotal - a.kmTotal)
                .map((m, idx) => {
                  const maxKm = Math.max(...motoristas.map(x => x.kmTotal), 1);
                  return (
                    <div key={m.id} className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{m.nome}</span>
                          <span className="text-sm text-muted-foreground ml-2">{formatarKm(m.kmTotal)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(m.kmTotal / maxKm) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">Custo/KM</p>
                        <p className="text-sm font-medium">
                          {m.custoMedioPorKm > 0 ? `R$ ${m.custoMedioPorKm.toFixed(2)}` : '—'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              {motoristas.every(m => m.kmTotal === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma viagem concluída ainda. Os dados aparecerão aqui quando os motoristas completarem viagens.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum motorista cadastrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Linha de custo placeholder */}
      {despesas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução de Despesas</CardTitle>
            <CardDescription>Últimas 6 despesas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={despesas.slice(0, 6).reverse().map((d, i) => ({ idx: i + 1, valor: d.valor }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="idx" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                  formatter={(v) => [formatarMoeda(Number(v)), 'Valor']}
                />
                <Line type="monotone" dataKey="valor" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  positive: boolean;
  small?: boolean;
}

function KpiCard({ title, value, icon: Icon, trend, positive, small }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="bg-primary/10 rounded-lg p-2">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          {!small && (
            <span className={cn('flex items-center text-xs font-medium', positive ? 'text-emerald-600' : 'text-destructive')}>
              {positive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
              {trend}
            </span>
          )}
        </div>
        <div className="mt-3">
          <p className={cn('font-bold text-foreground', small ? 'text-lg' : 'text-2xl')}>{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
          {small && <p className="text-xs text-muted-foreground mt-0.5">{trend}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
