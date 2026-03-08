import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Truck,
  Route,
  DollarSign,
  Fuel,
  Wrench,
  TrendingDown,
  TrendingUp,
  Clock,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  X,
} from 'lucide-react';
import { formatarMoeda, formatarKm, formatarTempo } from '../../utils/formatters';
import { useViagens } from '@/hooks/useViagens';
import { useDespesas } from '@/hooks/useDespesas';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useCaminhoes } from '@/hooks/useCaminhoes';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];

function getDefaultPeriod() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return {
    inicio: inicio.toISOString().slice(0, 10),
    fim: hoje.toISOString().slice(0, 10),
  };
}

export default function Dashboard() {
  const { viagens, loading: loadingViagens } = useViagens();
  const { despesas, loading: loadingDespesas } = useDespesas();
  const { motoristas, loading: loadingMotoristas } = useMotoristas();
  const { caminhoes, loading: loadingCaminhoes } = useCaminhoes();

  const defaultPeriod = getDefaultPeriod();
  const [dataInicio, setDataInicio] = useState(defaultPeriod.inicio);
  const [dataFim, setDataFim] = useState(defaultPeriod.fim);
  const [filtroAtivo, setFiltroAtivo] = useState(true);
  const [filtroCaminhao, setFiltroCaminhao] = useState('todos');
  const [filtroMotorista, setFiltroMotorista] = useState('todos');

  const loading = loadingViagens || loadingDespesas || loadingMotoristas || loadingCaminhoes;

  // Filtrar por período + caminhão + motorista
  const viagensFiltradas = useMemo(() => {
    return viagens.filter(v => {
      const data = v.dataInicio.slice(0, 10);
      const matchPeriodo = !filtroAtivo || (data >= dataInicio && data <= dataFim);
      const matchCaminhao = filtroCaminhao === 'todos' || v.caminhaoId === filtroCaminhao;
      const matchMotorista = filtroMotorista === 'todos' || v.motoristaId === filtroMotorista;
      return matchPeriodo && matchCaminhao && matchMotorista;
    });
  }, [viagens, dataInicio, dataFim, filtroAtivo, filtroCaminhao, filtroMotorista]);

  const despesasFiltradas = useMemo(() => {
    return despesas.filter(d => {
      const data = d.data.slice(0, 10);
      const matchPeriodo = !filtroAtivo || (data >= dataInicio && data <= dataFim);
      const matchCaminhao = filtroCaminhao === 'todos' || d.caminhaoId === filtroCaminhao;
      // despesa de motorista: verificar via viagem associada
      const matchMotorista = filtroMotorista === 'todos' || (() => {
        if (d.viagemId) {
          const viagem = viagens.find(v => v.id === d.viagemId);
          return viagem?.motoristaId === filtroMotorista;
        }
        // sem viagem: verificar se o motorista tem o caminhão desta despesa
        const mot = motoristas.find(m => m.id === filtroMotorista);
        return mot?.caminhaoId === d.caminhaoId;
      })();
      return matchPeriodo && matchCaminhao && matchMotorista;
    });
  }, [despesas, dataInicio, dataFim, filtroAtivo, filtroCaminhao, filtroMotorista, viagens, motoristas]);

  const viagensEmAndamento = viagens.filter(v => v.status === 'em_andamento');
  const viagensConcluidas = viagensFiltradas.filter(v => v.status === 'concluida');

  const totalKm = viagensConcluidas.reduce((acc, v) => acc + (v.kmTotal || 0), 0);
  const totalDespesas = despesasFiltradas.reduce((acc, d) => acc + d.valor, 0);
  const totalCombustivel = despesasFiltradas.filter(d => d.tipoDespesa === 'combustivel').reduce((acc, d) => acc + d.valor, 0);
  const totalManutencao = despesasFiltradas.filter(d => ['manutencao', 'pneu', 'revisao'].includes(d.tipoDespesa)).reduce((acc, d) => acc + d.valor, 0);
  const tempoMedioMin = viagensConcluidas.filter(v => v.tempoTotal).length > 0
    ? viagensConcluidas.filter(v => v.tempoTotal).reduce((acc, v) => acc + (v.tempoTotal || 0), 0) / viagensConcluidas.filter(v => v.tempoTotal).length
    : 0;
  const custoKm = totalKm > 0 ? totalDespesas / totalKm : 0;

  // Lucro: receita (viagens concluídas × valor_diaria do caminhão) - despesas
  const receitaBruta = useMemo(() => {
    return viagensConcluidas.reduce((acc, v) => {
      const caminhao = caminhoes.find(c => c.id === v.caminhaoId);
      return acc + (caminhao?.valorDiaria || 0);
    }, 0);
  }, [viagensConcluidas, caminhoes]);

  const lucro = receitaBruta - totalDespesas;
  const temReceita = caminhoes.some(c => c.valorDiaria > 0);

  // Despesas por categoria para gráfico de pizza
  const despesasPorCategoria = [
    { name: 'Combustível', value: totalCombustivel, fill: 'var(--color-chart-1)' },
    { name: 'Manutenção', value: totalManutencao, fill: 'var(--color-chart-2)' },
    { name: 'Pedágio', value: despesasFiltradas.filter(d => d.tipoDespesa === 'pedagio').reduce((a, d) => a + d.valor, 0), fill: 'var(--color-chart-3)' },
    { name: 'Alimentação', value: despesasFiltradas.filter(d => d.tipoDespesa === 'alimentacao').reduce((a, d) => a + d.valor, 0), fill: 'var(--color-chart-4)' },
    { name: 'Outros', value: despesasFiltradas.filter(d => ['seguro', 'licenciamento', 'ipva', 'outros'].includes(d.tipoDespesa)).reduce((a, d) => a + d.valor, 0), fill: 'var(--color-chart-5)' },
  ].filter(d => d.value > 0);

  const temFiltroExtra = filtroCaminhao !== 'todos' || filtroMotorista !== 'todos';

  const limparFiltro = () => {
    const p = getDefaultPeriod();
    setDataInicio(p.inicio);
    setDataFim(p.fim);
    setFiltroAtivo(true);
    setFiltroCaminhao('todos');
    setFiltroMotorista('todos');
  };

  const aplicarTodoHistorico = () => {
    setFiltroAtivo(false);
  };

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

      {/* Filtros — 2 linhas slim */}
      <div className="bg-card border border-border rounded-xl px-4 py-2.5 space-y-2">
        {/* Linha 1: período + limpar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={filtroAtivo && dataInicio === getDefaultPeriod().inicio ? 'secondary' : 'ghost'}
              onClick={() => {
                const hoje = new Date();
                setDataInicio(new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10));
                setDataFim(hoje.toISOString().slice(0, 10));
                setFiltroAtivo(true);
              }}
              className="h-7 text-xs px-2.5"
            >
              Este mês
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const hoje = new Date();
                const inicioSemana = new Date(hoje);
                inicioSemana.setDate(hoje.getDate() - hoje.getDay());
                setDataInicio(inicioSemana.toISOString().slice(0, 10));
                setDataFim(hoje.toISOString().slice(0, 10));
                setFiltroAtivo(true);
              }}
              className="h-7 text-xs px-2.5"
            >
              Esta semana
            </Button>
            <Button
              size="sm"
              variant={!filtroAtivo ? 'secondary' : 'ghost'}
              onClick={aplicarTodoHistorico}
              className="h-7 text-xs px-2.5"
            >
              Tudo
            </Button>
          </div>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={dataInicio}
              onChange={e => { setDataInicio(e.target.value); setFiltroAtivo(true); }}
              className="h-7 text-xs w-32 px-2"
            />
            <span className="text-muted-foreground text-xs">→</span>
            <Input
              type="date"
              value={dataFim}
              onChange={e => { setDataFim(e.target.value); setFiltroAtivo(true); }}
              className="h-7 text-xs w-32 px-2"
            />
          </div>
          {(filtroAtivo || temFiltroExtra) && (
            <>
              <div className="w-px h-5 bg-border" />
              <Button size="sm" variant="ghost" onClick={limparFiltro} className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            </>
          )}
          <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
            {viagensFiltradas.length} viag. · {despesasFiltradas.length} desp.
          </span>
        </div>

        {/* Linha 2: caminhão + motorista lado a lado */}
        <div className="flex items-center gap-2">
          <Select value={filtroCaminhao} onValueChange={setFiltroCaminhao}>
            <SelectTrigger className="h-7 text-xs w-48 px-2">
              <Truck className="w-3 h-3 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Todos os caminhões" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os caminhões</SelectItem>
              {caminhoes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.placa} — {c.modelo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroMotorista} onValueChange={setFiltroMotorista}>
            <SelectTrigger className="h-7 text-xs w-48 px-2">
              <Route className="w-3 h-3 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Todos os motoristas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os motoristas</SelectItem>
              {motoristas.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {temFiltroExtra && (
            <span className="text-xs text-primary font-medium">Filtro ativo</span>
          )}
        </div>
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
          value={viagensFiltradas.length.toString()}
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
          trend={`${despesasFiltradas.length} lançamentos`}
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

      {/* Card de Lucro */}
      {temReceita && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className={cn(lucro >= 0 ? "border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20" : "border-destructive/30 bg-destructive/5")}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className={cn("rounded-lg p-2", lucro >= 0 ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-destructive/10")}>
                  <TrendingUp className={cn("w-5 h-5", lucro >= 0 ? "text-emerald-600" : "text-destructive")} />
                </div>
                <span className={cn("text-xs font-medium", lucro >= 0 ? "text-emerald-600" : "text-destructive")}>
                  {lucro >= 0 ? "Positivo" : "Negativo"}
                </span>
              </div>
              <div className="mt-3">
                <p className={cn("text-2xl font-bold", lucro >= 0 ? "text-emerald-600" : "text-destructive")}>
                  {formatarMoeda(Math.abs(lucro))}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Lucro do período</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="bg-primary/10 rounded-lg p-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-emerald-600">Bruto</span>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">{formatarMoeda(receitaBruta)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Receita bruta ({viagensConcluidas.length} viag.)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="bg-destructive/10 rounded-lg p-2">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                </div>
                <span className="text-xs font-medium text-destructive">Custos</span>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">{formatarMoeda(totalDespesas)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total de despesas no período</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
              <CardDescription>Distribuição dos gastos no período</CardDescription>
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
        {viagensFiltradas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Viagens do Período</CardTitle>
              <CardDescription>Status das viagens no período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { status: 'Em andamento', qtd: viagensFiltradas.filter(v => v.status === 'em_andamento').length, fill: 'var(--color-chart-1)' },
                  { status: 'Concluídas', qtd: viagensConcluidas.length, fill: 'var(--color-chart-2)' },
                  { status: 'Canceladas', qtd: viagensFiltradas.filter(v => v.status === 'cancelada').length, fill: 'var(--color-chart-5)' },
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

      {/* Ranking de motoristas */}
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

      {/* Evolução de despesas */}
      {despesasFiltradas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução de Despesas</CardTitle>
            <CardDescription>Últimas despesas no período</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={despesasFiltradas.slice(0, 20).reverse().map((d, i) => ({ idx: i + 1, valor: d.valor }))}>
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
