import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { mockViagens, mockDespesas, mockMotoristas, mockCaminhoes, kmPorDia, despesasPorCategoria, custoPorKmEvol } from '../../data/mockData';
import { formatarMoeda, formatarKm, labelTipoDespesa } from '../../utils/formatters';
import { toast } from 'sonner';

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];

const motoristasKm = mockMotoristas.map(m => ({
  nome: m.nome.split(' ')[0],
  km: m.kmTotal,
}));

const gastosPorCaminhao = mockCaminhoes.map(c => ({
  placa: c.placa,
  despesas: c.totalDespesas,
}));

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('mensal');

  const totalKm = mockViagens.reduce((acc, v) => acc + (v.kmTotal || 0), 0);
  const totalDespesas = mockDespesas.reduce((acc, d) => acc + d.valor, 0);
  const custoKm = totalKm > 0 ? totalDespesas / totalKm : 0;

  const despesasPorTipo = Object.entries(
    mockDespesas.reduce<Record<string, number>>((acc, d) => {
      acc[d.tipoDespesa] = (acc[d.tipoDespesa] || 0) + d.valor;
      return acc;
    }, {})
  ).map(([tipo, valor]) => ({ tipo: labelTipoDespesa(tipo), valor }));

  const exportarPDF = () => {
    toast.info('Exportação para PDF disponível na versão completa com backend');
  };

  const exportarExcel = () => {
    toast.info('Exportação para Excel disponível na versão completa com backend');
  };

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

      {/* Filtro de período */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <Label>Período:</Label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diario">Diário</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resumo do período */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Route className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Viagens</span>
            </div>
            <p className="text-2xl font-bold">{mockViagens.length}</p>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">KM Rodados</span>
            </div>
            <p className="text-2xl font-bold">{formatarKm(totalKm)}</p>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Despesas</span>
            </div>
            <p className="text-2xl font-bold">{formatarMoeda(totalDespesas)}</p>
            <p className="text-xs text-muted-foreground">no período</p>
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

      {/* Gráfico KM por dia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            KM Rodados por Dia
          </CardTitle>
          <CardDescription>Últimos 7 dias do período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Despesas por tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Despesas por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={despesasPorCategoria}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {despesasPorCategoria.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatarMoeda(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top motoristas KM */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Motoristas por KM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={motoristasKm} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={50} />
                <Tooltip formatter={(v) => [`${v} km`, 'KM']} />
                <Bar dataKey="km" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
        </CardContent>
      </Card>

      {/* Evolução custo KM */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução Custo por KM</CardTitle>
          <CardDescription>Tendência ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={custoPorKmEvol}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v) => [`R$ ${Number(v).toFixed(2)}/km`, 'Custo/KM']} />
              <Line type="monotone" dataKey="custo" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 5, fill: 'var(--color-chart-1)' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela resumo despesas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {despesasPorTipo.sort((a, b) => b.valor - a.valor).map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-32 shrink-0">{d.tipo}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(d.valor / totalDespesas) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-24 text-right">{formatarMoeda(d.valor)}</span>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {((d.valor / totalDespesas) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
