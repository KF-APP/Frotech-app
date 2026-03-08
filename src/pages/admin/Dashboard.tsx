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
  Legend,
} from 'recharts';
import {
  Truck,
  Users,
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
import { mockViagens, mockDespesas, mockMotoristas, mockCaminhoes, kmPorDia, despesasPorCategoria, custoPorKmEvol } from '../../data/mockData';
import { formatarMoeda, formatarKm, formatarTempo } from '../../utils/formatters';

const stats = {
  totalViagens: mockViagens.length,
  totalKm: mockViagens.reduce((acc, v) => acc + (v.kmTotal || 0), 0),
  totalDespesas: mockDespesas.reduce((acc, d) => acc + d.valor, 0),
  totalCombustivel: mockDespesas.filter(d => d.tipoDespesa === 'combustivel').reduce((acc, d) => acc + d.valor, 0),
  totalManutencao: mockDespesas.filter(d => ['manutencao', 'pneu', 'revisao'].includes(d.tipoDespesa)).reduce((acc, d) => acc + d.valor, 0),
  tempoMedioMin: mockViagens.filter(v => v.tempoTotal).reduce((acc, v) => acc + (v.tempoTotal || 0), 0) / mockViagens.filter(v => v.tempoTotal).length,
};

const custoKm = stats.totalKm > 0 ? stats.totalDespesas / stats.totalKm : 0;

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];

export default function Dashboard() {
  const viagensEmAndamento = mockViagens.filter(v => v.status === 'em_andamento');

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
          value={stats.totalViagens.toString()}
          icon={Route}
          trend="+8% este mês"
          positive
        />
        <KpiCard
          title="KM Rodados"
          value={formatarKm(stats.totalKm)}
          icon={Truck}
          trend="+12% este mês"
          positive
        />
        <KpiCard
          title="Total Despesas"
          value={formatarMoeda(stats.totalDespesas)}
          icon={DollarSign}
          trend="+5% este mês"
          positive={false}
        />
        <KpiCard
          title="Custo por KM"
          value={`R$ ${custoKm.toFixed(2)}`}
          icon={TrendingDown}
          trend="-3% este mês"
          positive
        />
      </div>

      {/* Segunda linha de KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Combustível"
          value={formatarMoeda(stats.totalCombustivel)}
          icon={Fuel}
          trend="45% do total"
          positive
          small
        />
        <KpiCard
          title="Manutenção"
          value={formatarMoeda(stats.totalManutencao)}
          icon={Wrench}
          trend="27% do total"
          positive={false}
          small
        />
        <KpiCard
          title="Tempo Médio"
          value={formatarTempo(stats.tempoMedioMin)}
          icon={Clock}
          trend="por viagem"
          positive
          small
        />
        <KpiCard
          title="Frota Ativa"
          value={`${mockCaminhoes.length} caminhões`}
          icon={Truck}
          trend={`${mockMotoristas.length} motoristas`}
          positive
          small
        />
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KM por dia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">KM Rodados por Dia</CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={kmPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
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

        {/* Despesas por categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Despesas por Categoria</CardTitle>
            <CardDescription>Distribuição percentual</CardDescription>
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
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução custo por KM */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução do Custo por KM</CardTitle>
          <CardDescription>Tendência dos últimos meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={custoPorKmEvol}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                formatter={(v) => [`R$ ${Number(v).toFixed(2)}/km`, 'Custo/KM']}
              />
              <Line type="monotone" dataKey="custo" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top motoristas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Motoristas por KM</CardTitle>
          <CardDescription>Desempenho acumulado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockMotoristas
              .sort((a, b) => b.kmTotal - a.kmTotal)
              .map((m, idx) => (
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
                        style={{ width: `${(m.kmTotal / mockMotoristas[0].kmTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Custo/KM</p>
                    <p className="text-sm font-medium">R$ {m.custoMedioPorKm.toFixed(2)}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
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

