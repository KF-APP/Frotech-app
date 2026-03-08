import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { BarChart3, Download, FileText, TrendingDown, Route, DollarSign, Truck, Users } from 'lucide-react';
import { useViagens } from '@/hooks/useViagens';
import { useDespesas } from '@/hooks/useDespesas';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useCaminhoes } from '@/hooks/useCaminhoes';
import { formatarMoeda, formatarKm, labelTipoDespesa } from '../../utils/formatters';
import { toast } from 'sonner';

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];

export default function Relatorios() {
  const { viagens, loading: loadingViagens } = useViagens();
  const { despesas, loading: loadingDespesas } = useDespesas();
  const { motoristas, loading: loadingMotoristas } = useMotoristas();
  const { caminhoes, loading: loadingCaminhoes } = useCaminhoes();

  const loading = loadingViagens || loadingDespesas || loadingMotoristas || loadingCaminhoes;

  // KPIs calculados
  const totalKm = useMemo(() => viagens.reduce((acc, v) => acc + (v.kmTotal || 0), 0), [viagens]);
  const totalDespesas = useMemo(() => despesas.reduce((acc, d) => acc + d.valor, 0), [despesas]);
  const custoKm = totalKm > 0 ? totalDespesas / totalKm : 0;

  // Despesas agrupadas por tipo (para pie chart)
  const despesasPorTipo = useMemo(() => {
    const mapa = despesas.reduce<Record<string, number>>((acc, d) => {
      acc[d.tipoDespesa] = (acc[d.tipoDespesa] || 0) + d.valor;
      return acc;
    }, {});
    return Object.entries(mapa).map(([tipo, valor]) => ({
      name: labelTipoDespesa(tipo),
      value: valor,
    }));
  }, [despesas]);

  // KM por dia (últimos 7 dias)
  const kmPorDia = useMemo(() => {
    const dias: Record<string, number> = {};
    const hoje = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      dias[key] = 0;
    }
    viagens.forEach(v => {
      if (!v.kmTotal) return;
      const d = new Date(v.dataInicio);
      const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (key in dias) dias[key] += v.kmTotal;
    });
    return Object.entries(dias).map(([data, km]) => ({ data, km }));
  }, [viagens]);

  // Motoristas por KM
  const motoristasKm = useMemo(() =>
    motoristas
      .filter(m => m.kmTotal > 0)
      .sort((a, b) => b.kmTotal - a.kmTotal)
      .slice(0, 5)
      .map(m => ({ nome: m.nome.split(' ')[0], km: m.kmTotal })),
    [motoristas]
  );

  // Gastos por caminhão
  const gastosPorCaminhao = useMemo(() =>
    caminhoes
      .filter(c => c.totalDespesas > 0)
      .map(c => ({ placa: c.placa, despesas: c.totalDespesas })),
    [caminhoes]
  );

  // Evolução custo/km por mês (últimos 6 meses)
  const custoPorKmEvol = useMemo(() => {
    const meses: Record<string, { km: number; custo: number }> = {};
    const hoje = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const key = d.toLocaleDateString('pt-BR', { month: 'short' });
      meses[key] = { km: 0, custo: 0 };
    }

    viagens.forEach(v => {
      if (!v.kmTotal) return;
      const d = new Date(v.dataInicio);
      const key = d.toLocaleDateString('pt-BR', { month: 'short' });
      if (key in meses) meses[key].km += v.kmTotal;
    });

    despesas.forEach(d => {
      const dt = new Date(d.data);
      const key = dt.toLocaleDateString('pt-BR', { month: 'short' });
      if (key in meses) meses[key].custo += d.valor;
    });

    return Object.entries(meses).map(([mes, val]) => ({
      mes,
      custo: val.km > 0 ? parseFloat((val.custo / val.km).toFixed(2)) : 0,
    }));
  }, [viagens, despesas]);

  // Despesas por categoria ordenadas (para tabela)
  const despesasPorCategoria = useMemo(() =>
    [...despesasPorTipo].sort((a, b) => b.value - a.value),
    [despesasPorTipo]
  );

  const exportarPDF = () => toast.info('Exportação para PDF disponível na versão completa com backend');
  const exportarExcel = () => toast.info('Exporta��ão para Excel disponível na versão completa com backend');

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">An��lise detalhada da operação</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">Análise detalhada da operação</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportarPDF}>
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportarExcel}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Route className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Viagens</span>
            </div>
            <p className="text-2xl font-bold">{viagens.length}</p>
            <p className="text-xs text-muted-foreground">total registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">KM Rodados</span>
            </div>
            <p className="text-2xl font-bold">{formatarKm(totalKm)}</p>
            <p className="text-xs text-muted-foreground">total geral</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Despesas</span>
            </div>
            <p className="text-2xl font-bold">{formatarMoeda(totalDespesas)}</p>
            <p className="text-xs text-muted-foreground">total geral</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Custo/KM</span>
            </div>
            <p className="text-2xl font-bold">R$ {custoKm.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">médio</p>
          </CardContent>
        </Card>
      </div>

      {/* KM por dia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            KM Rodados por Dia
          </CardTitle>
          <CardDescription>Últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          {kmPorDia.some(d => d.km > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
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
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
              Sem dados de viagens nos últimos 7 dias
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pie + Motoristas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Despesas por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {despesasPorTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={despesasPorTipo}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {despesasPorTipo.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatarMoeda(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                Sem despesas registradas
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Motoristas por KM
            </CardTitle>
          </CardHeader>
          <CardContent>
            {motoristasKm.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={motoristasKm} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={50} />
                  <Tooltip formatter={(v) => [`${v} km`, 'KM']} />
                  <Bar dataKey="km" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                Sem dados de KM por motorista
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gastos por caminhão */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Gastos por Caminhão
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gastosPorCaminhao.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gastosPorCaminhao}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="placa" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                  formatter={(v) => [formatarMoeda(Number(v)), 'Despesas']}
                />
                <Bar dataKey="despesas" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              Sem gastos registrados por caminhão
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evolução custo/KM */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução Custo por KM</CardTitle>
          <CardDescription>Tendência dos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          {custoPorKmEvol.some(d => d.custo > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={custoPorKmEvol}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v) => [`R$ ${Number(v).toFixed(2)}/km`, 'Custo/KM']} />
                <Line type="monotone" dataKey="custo" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 5, fill: 'var(--color-chart-1)' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              Dados insuficientes para calcular evolução
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela resumo despesas */}
      {despesasPorCategoria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {despesasPorCategoria.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-32 shrink-0">{d.name}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${totalDespesas > 0 ? (d.value / totalDespesas) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-24 text-right">{formatarMoeda(d.value)}</span>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {totalDespesas > 0 ? ((d.value / totalDespesas) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
