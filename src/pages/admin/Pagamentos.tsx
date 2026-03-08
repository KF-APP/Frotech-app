import { useState, useMemo } from 'react';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useCaminhoes } from '@/hooks/useCaminhoes';
import { formatarMoeda, formatarData } from '@/utils/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Truck,
  RotateCcw,
  Trash2,
  FileText,
} from 'lucide-react';
import type { CicloPagamento } from '@/types';

// Componente de card de indicador
function IndicadorCard({
  titulo,
  valor,
  subtitulo,
  icon: Icon,
  corIcon,
}: {
  titulo: string;
  valor: string;
  subtitulo?: string;
  icon: React.ComponentType<{ className?: string }>;
  corIcon: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{titulo}</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{valor}</p>
            {subtitulo && <p className="text-xs text-muted-foreground mt-1">{subtitulo}</p>}
          </div>
          <div className={`p-2.5 rounded-lg ${corIcon} shrink-0 ml-3`}>
            <Icon className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Badge de status
function StatusBadge({ status }: { status: 'pendente' | 'pago' }) {
  if (status === 'pago') {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Pago
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
      <Clock className="w-3 h-3 mr-1" />
      Pendente
    </Badge>
  );
}

export default function Pagamentos() {
  const { ciclos, config, loading, loadingConfig, salvarConfig, gerarCiclos, marcarComoPago, reverterParaPendente, excluirCiclo } = usePagamentos();
  const { motoristas } = useMotoristas();
  const { caminhoes } = useCaminhoes();

  // Filtros
  const [filtroMotorista, setFiltroMotorista] = useState('todos');
  const [filtroCaminhao, setFiltroCaminhao] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'pago'>('todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  // Estado de modais
  const [modalConfig, setModalConfig] = useState(false);
  const [modalGerar, setModalGerar] = useState(false);
  const [modalPagar, setModalPagar] = useState<CicloPagamento | null>(null);
  const [modalDetalhe, setModalDetalhe] = useState<CicloPagamento | null>(null);
  const [modalExcluir, setModalExcluir] = useState<CicloPagamento | null>(null);

  // Estado de formulários
  const [porcMotorista, setPorcMotorista] = useState(config?.porcentagemMotorista ?? 30);
  const [gerarDataInicio, setGerarDataInicio] = useState('');
  const [gerarDataFim, setGerarDataFim] = useState('');
  const [observacaoPagamento, setObservacaoPagamento] = useState('');

  // Loading de ações
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [gerandoCiclos, setGerandoCiclos] = useState(false);
  const [confirindoPagamento, setConfirmandoPagamento] = useState(false);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  // Quando o modal de config abre, sincroniza o valor
  const abrirModalConfig = () => {
    setPorcMotorista(config?.porcentagemMotorista ?? 30);
    setModalConfig(true);
  };

  const handleSalvarConfig = async () => {
    setSalvandoConfig(true);
    await salvarConfig(porcMotorista);
    setSalvandoConfig(false);
    setModalConfig(false);
  };

  const handleGerarCiclos = async () => {
    if (!gerarDataInicio || !gerarDataFim) return;
    setGerandoCiclos(true);
    await gerarCiclos(gerarDataInicio, gerarDataFim);
    setGerandoCiclos(false);
    setModalGerar(false);
    setGerarDataInicio('');
    setGerarDataFim('');
  };

  const handleMarcarPago = async () => {
    if (!modalPagar) return;
    setConfirmandoPagamento(true);
    await marcarComoPago(modalPagar.id, observacaoPagamento);
    setConfirmandoPagamento(false);
    setModalPagar(null);
    setObservacaoPagamento('');
  };

  const toggleExpandir = (id: string) => {
    setExpandidos(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  };

  // Filtragem dos ciclos
  const ciclosFiltrados = useMemo(() => {
    return ciclos.filter(c => {
      if (filtroMotorista !== 'todos' && c.motoristaId !== filtroMotorista) return false;
      if (filtroCaminhao !== 'todos' && c.caminhaoId !== filtroCaminhao) return false;
      if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false;
      if (filtroDataInicio && c.semanaInicio < filtroDataInicio) return false;
      if (filtroDataFim && c.semanaFim > filtroDataFim) return false;
      return true;
    });
  }, [ciclos, filtroMotorista, filtroCaminhao, filtroStatus, filtroDataInicio, filtroDataFim]);

  // Indicadores do dashboard
  const totalFaturado = ciclosFiltrados.reduce((s, c) => s + c.totalFaturado, 0);
  const totalDespesas = ciclosFiltrados.reduce((s, c) => s + c.totalDespesas, 0);
  const lucroTotal = ciclosFiltrados.reduce((s, c) => s + c.lucroTotal, 0);
  const totalMotoristas = ciclosFiltrados.reduce((s, c) => s + c.valorMotorista, 0);
  const totalAdmin = ciclosFiltrados.reduce((s, c) => s + c.valorAdministrador, 0);
  const totalPendentes = ciclosFiltrados.filter(c => c.status === 'pendente').length;
  const totalPagos = ciclosFiltrados.filter(c => c.status === 'pago').length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pagamentos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Controle financeiro de viagens e pagamentos aos motoristas
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={abrirModalConfig}>
            <Settings className="w-4 h-4 mr-2" />
            Configurar Divisão
          </Button>
          <Button size="sm" onClick={() => setModalGerar(true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Gerar Ciclos
          </Button>
        </div>
      </div>

      {/* Configuração atual */}
      {!loadingConfig && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-5 flex flex-wrap items-center gap-x-6 gap-y-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Divisão atual:</span>
            </div>
            <span className="text-sm">
              Motorista: <strong className="text-primary">{config?.porcentagemMotorista ?? 30}%</strong>
            </span>
            <span className="text-sm">
              Administrador: <strong className="text-primary">{config?.porcentagemAdministrador ?? 70}%</strong>
            </span>
            <span className="text-xs text-muted-foreground">
              Pagamentos todo <strong>sábado → sexta-feira</strong>
            </span>
          </CardContent>
        </Card>
      )}

      {/* Dashboard - Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <IndicadorCard
          titulo="Total Faturado"
          valor={formatarMoeda(totalFaturado)}
          icon={DollarSign}
          corIcon="bg-primary"
        />
        <IndicadorCard
          titulo="Total Despesas"
          valor={formatarMoeda(totalDespesas)}
          icon={TrendingDown}
          corIcon="bg-destructive"
        />
        <IndicadorCard
          titulo="Lucro Total"
          valor={formatarMoeda(lucroTotal)}
          icon={TrendingUp}
          corIcon="bg-primary"
        />
        <IndicadorCard
          titulo="Pago Motoristas"
          valor={formatarMoeda(totalMotoristas)}
          subtitulo={`${config?.porcentagemMotorista ?? 30}% do lucro`}
          icon={Users}
          corIcon="bg-primary"
        />
        <IndicadorCard
          titulo="Lucro Administrador"
          valor={formatarMoeda(totalAdmin)}
          subtitulo={`${config?.porcentagemAdministrador ?? 70}% do lucro`}
          icon={Truck}
          corIcon="bg-primary"
        />
      </div>

      {/* Contadores de status */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 text-orange-500" />
          <span><strong className="text-orange-600">{totalPendentes}</strong> pendentes</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span><strong className="text-green-600">{totalPagos}</strong> pagos</span>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Motorista</Label>
              <Select value={filtroMotorista} onValueChange={setFiltroMotorista}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {motoristas.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Caminhão</Label>
              <Select value={filtroCaminhao} onValueChange={setFiltroCaminhao}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {caminhoes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.placa} - {c.modelo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Status</Label>
              <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as typeof filtroStatus)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">De</Label>
              <Input
                type="date"
                value={filtroDataInicio}
                onChange={e => setFiltroDataInicio(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Até</Label>
              <Input
                type="date"
                value={filtroDataFim}
                onChange={e => setFiltroDataFim(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de ciclos de pagamento */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))
        ) : ciclosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Nenhum pagamento encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em <strong>Gerar Ciclos</strong> para calcular os pagamentos das viagens
              </p>
            </CardContent>
          </Card>
        ) : (
          ciclosFiltrados.map(ciclo => {
            const expandido = expandidos.has(ciclo.id);
            return (
              <Card key={ciclo.id} className={ciclo.status === 'pago' ? 'opacity-85' : ''}>
                <CardContent className="p-0">
                  {/* Linha principal */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 cursor-pointer"
                    onClick={() => toggleExpandir(ciclo.id)}
                  >
                    {/* Semana e motorista */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={ciclo.status} />
                        <span className="font-semibold text-foreground">{ciclo.motoristaNome}</span>
                        {ciclo.caminhaoPlaca && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {ciclo.caminhaoPlaca}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Semana: {formatarData(ciclo.semanaInicio)} até {formatarData(ciclo.semanaFim)}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          Pagamento: {formatarData(ciclo.dataPagamento)}
                        </span>
                      </div>
                    </div>

                    {/* Valores resumo */}
                    <div className="flex gap-4 text-right sm:text-left flex-wrap">
                      <div>
                        <p className="text-xs text-muted-foreground">Viagens</p>
                        <p className="font-bold text-foreground">{ciclo.totalViagens}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Faturado</p>
                        <p className="font-bold text-foreground">{formatarMoeda(ciclo.totalFaturado)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lucro</p>
                        <p className="font-bold text-foreground">{formatarMoeda(ciclo.lucroTotal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Motorista recebe</p>
                        <p className="font-bold text-primary">{formatarMoeda(ciclo.valorMotorista)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Admin recebe</p>
                        <p className="font-bold text-foreground">{formatarMoeda(ciclo.valorAdministrador)}</p>
                      </div>
                    </div>

                    {/* Ações e toggle */}
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      {ciclo.status === 'pendente' ? (
                        <Button
                          size="sm"
                          onClick={() => { setModalPagar(ciclo); setObservacaoPagamento(''); }}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          Pagar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reverterParaPendente(ciclo.id)}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                          Reverter
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setModalDetalhe(ciclo)}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                      {ciclo.status === 'pendente' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setModalExcluir(ciclo)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <button className="p-1 hover:bg-accent rounded">
                        {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expansão - detalhes */}
                  {expandido && (
                    <>
                      <Separator />
                      <div className="p-4 bg-muted/30">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs mb-0.5">Total Faturado</p>
                            <p className="font-semibold">{formatarMoeda(ciclo.totalFaturado)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-0.5">Total Despesas</p>
                            <p className="font-semibold text-destructive">{formatarMoeda(ciclo.totalDespesas)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-0.5">Lucro Líquido</p>
                            <p className="font-semibold">{formatarMoeda(ciclo.lucroTotal)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-0.5">Divisão</p>
                            <p className="font-semibold">{ciclo.porcentagemMotorista}% / {ciclo.porcentagemAdministrador}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-0.5">Valor Motorista ({ciclo.porcentagemMotorista}%)</p>
                            <p className="font-bold text-primary text-base">{formatarMoeda(ciclo.valorMotorista)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-0.5">Valor Administrador ({ciclo.porcentagemAdministrador}%)</p>
                            <p className="font-bold text-base">{formatarMoeda(ciclo.valorAdministrador)}</p>
                          </div>
                          {ciclo.status === 'pago' && ciclo.dataConfirmacaoPagamento && (
                            <div>
                              <p className="text-muted-foreground text-xs mb-0.5">Data da Confirmação</p>
                              <p className="font-semibold text-green-600">{formatarData(ciclo.dataConfirmacaoPagamento)}</p>
                            </div>
                          )}
                          {ciclo.observacoes && (
                            <div className="col-span-2">
                              <p className="text-muted-foreground text-xs mb-0.5">Observações</p>
                              <p className="text-sm">{ciclo.observacoes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Histórico - tabela compacta */}
      {ciclosFiltrados.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Histórico Consolidado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Semana</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Caminhão</TableHead>
                    <TableHead className="text-right">Viagens</TableHead>
                    <TableHead className="text-right">Faturado</TableHead>
                    <TableHead className="text-right">Despesas</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                    <TableHead className="text-right">Motorista</TableHead>
                    <TableHead className="text-right">Admin</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ciclosFiltrados.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatarData(c.semanaInicio)} – {formatarData(c.semanaFim)}
                      </TableCell>
                      <TableCell className="font-medium">{c.motoristaNome}</TableCell>
                      <TableCell>{c.caminhaoPlaca || '—'}</TableCell>
                      <TableCell className="text-right">{c.totalViagens}</TableCell>
                      <TableCell className="text-right">{formatarMoeda(c.totalFaturado)}</TableCell>
                      <TableCell className="text-right text-destructive">{formatarMoeda(c.totalDespesas)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatarMoeda(c.lucroTotal)}</TableCell>
                      <TableCell className="text-right text-primary font-bold">{formatarMoeda(c.valorMotorista)}</TableCell>
                      <TableCell className="text-right font-bold">{formatarMoeda(c.valorAdministrador)}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                    </TableRow>
                  ))}
                  {/* Totais */}
                  <TableRow className="bg-muted/40 font-bold">
                    <TableCell colSpan={4}>Total</TableCell>
                    <TableCell className="text-right">{formatarMoeda(totalFaturado)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatarMoeda(totalDespesas)}</TableCell>
                    <TableCell className="text-right">{formatarMoeda(lucroTotal)}</TableCell>
                    <TableCell className="text-right text-primary">{formatarMoeda(totalMotoristas)}</TableCell>
                    <TableCell className="text-right">{formatarMoeda(totalAdmin)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal: Configurar divisão */}
      <Dialog open={modalConfig} onOpenChange={setModalConfig}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Divisão de Lucro</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <p className="text-sm text-muted-foreground">
              Defina como o lucro líquido de cada viagem será dividido entre o motorista e o administrador.
            </p>
            <div>
              <Label>Porcentagem do Motorista: <strong className="text-primary">{porcMotorista}%</strong></Label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={porcMotorista}
                onChange={e => setPorcMotorista(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="p-3 text-center">
                  <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Motorista recebe</p>
                  <p className="text-2xl font-bold text-primary">{porcMotorista}%</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-center">
                  <Truck className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Administrador recebe</p>
                  <p className="text-2xl font-bold">{100 - porcMotorista}%</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[[20, 80], [30, 70], [40, 60], [50, 50]].map(([m, a]) => (
                <Button
                  key={m}
                  variant={porcMotorista === m ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPorcMotorista(m)}
                >
                  {m}/{a}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Exemplo:</strong> Se o lucro da semana for R$ 5.000,
              o motorista recebe <strong>{formatarMoeda((5000 * porcMotorista) / 100)}</strong> e
              o administrador fica com <strong>{formatarMoeda((5000 * (100 - porcMotorista)) / 100)}</strong>.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalConfig(false)}>Cancelar</Button>
            <Button onClick={handleSalvarConfig} disabled={salvandoConfig}>
              {salvandoConfig ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Gerar ciclos */}
      <Dialog open={modalGerar} onOpenChange={setModalGerar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Ciclos de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              O sistema irá buscar todas as viagens concluídas no período selecionado,
              calcular os lucros e criar os ciclos de pagamento semanais automaticamente.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={gerarDataInicio}
                  onChange={e => setGerarDataInicio(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={gerarDataFim}
                  onChange={e => setGerarDataFim(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
              <p className="font-medium text-primary mb-1">Como funciona:</p>
              <ul className="text-muted-foreground space-y-1 text-xs list-disc list-inside">
                <li>Semanas vão de <strong>sábado a sexta-feira</strong></li>
                <li>Pagamentos são realizados na <strong>sexta-feira</strong> de cada semana</li>
                <li>Divisão atual: motorista <strong>{config?.porcentagemMotorista ?? 30}%</strong> / admin <strong>{config?.porcentagemAdministrador ?? 70}%</strong></li>
                <li>Ciclos já pagos <strong>não são reprocessados</strong></li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalGerar(false)}>Cancelar</Button>
            <Button
              onClick={handleGerarCiclos}
              disabled={gerandoCiclos || !gerarDataInicio || !gerarDataFim}
            >
              {gerandoCiclos ? 'Gerando...' : 'Gerar Ciclos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar pagamento */}
      <Dialog open={!!modalPagar} onOpenChange={() => setModalPagar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          {modalPagar && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Motorista:</span>
                  <strong>{modalPagar.motoristaNome}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Semana:</span>
                  <span>{formatarData(modalPagar.semanaInicio)} até {formatarData(modalPagar.semanaFim)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de viagens:</span>
                  <span>{modalPagar.totalViagens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lucro total:</span>
                  <span>{formatarMoeda(modalPagar.lucroTotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground font-medium">Valor a pagar ao motorista:</span>
                  <strong className="text-primary text-lg">{formatarMoeda(modalPagar.valorMotorista)}</strong>
                </div>
              </div>
              <div>
                <Label>Observações (opcional)</Label>
                <Input
                  value={observacaoPagamento}
                  onChange={e => setObservacaoPagamento(e.target.value)}
                  placeholder="PIX, transferência, dinheiro..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPagar(null)}>Cancelar</Button>
            <Button onClick={handleMarcarPago} disabled={confirindoPagamento}>
              {confirindoPagamento ? 'Confirmando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Detalhe do ciclo */}
      <Dialog open={!!modalDetalhe} onOpenChange={() => setModalDetalhe(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Ciclo de Pagamento</DialogTitle>
          </DialogHeader>
          {modalDetalhe && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{modalDetalhe.motoristaNome}</p>
                  {modalDetalhe.caminhaoPlaca && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Truck className="w-3 h-3" />{modalDetalhe.caminhaoPlaca}
                    </p>
                  )}
                </div>
                <StatusBadge status={modalDetalhe.status} />
              </div>
              <div className="bg-muted/30 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Semana Início</p>
                  <p className="font-semibold">{formatarData(modalDetalhe.semanaInicio)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Semana Fim</p>
                  <p className="font-semibold">{formatarData(modalDetalhe.semanaFim)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Data de Pagamento</p>
                  <p className="font-semibold">{formatarData(modalDetalhe.dataPagamento)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total de Viagens</p>
                  <p className="font-semibold">{modalDetalhe.totalViagens}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm p-2 bg-muted/20 rounded">
                  <span>Total Faturado</span>
                  <span className="font-semibold">{formatarMoeda(modalDetalhe.totalFaturado)}</span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-red-50 rounded">
                  <span className="text-destructive">(-) Despesas</span>
                  <span className="font-semibold text-destructive">{formatarMoeda(modalDetalhe.totalDespesas)}</span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-muted/40 rounded font-bold">
                  <span>(=) Lucro Total</span>
                  <span>{formatarMoeda(modalDetalhe.lucroTotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm p-2 bg-primary/10 rounded">
                  <span className="text-primary">Motorista ({modalDetalhe.porcentagemMotorista}%)</span>
                  <span className="font-bold text-primary text-base">{formatarMoeda(modalDetalhe.valorMotorista)}</span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                  <span>Administrador ({modalDetalhe.porcentagemAdministrador}%)</span>
                  <span className="font-bold text-base">{formatarMoeda(modalDetalhe.valorAdministrador)}</span>
                </div>
              </div>
              {modalDetalhe.status === 'pago' && modalDetalhe.dataConfirmacaoPagamento && (
                <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  Pago em {formatarData(modalDetalhe.dataConfirmacaoPagamento)}
                  {modalDetalhe.observacoes && ` • ${modalDetalhe.observacoes}`}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalDetalhe(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar exclusão */}
      <Dialog open={!!modalExcluir} onOpenChange={() => setModalExcluir(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover Ciclo de Pagamento</DialogTitle>
          </DialogHeader>
          {modalExcluir && (
            <div className="py-2">
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja remover o ciclo de pagamento de <strong>{modalExcluir.motoristaNome}</strong> da
                semana {formatarData(modalExcluir.semanaInicio)} até {formatarData(modalExcluir.semanaFim)}?
                Esta ação não pode ser desfeita.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalExcluir(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (modalExcluir) {
                  await excluirCiclo(modalExcluir.id);
                  setModalExcluir(null);
                }
              }}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
