import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MapPin,
  Clock,
  Route,
  Truck,
  User,
  Search,
  Eye,
  Calendar,
  Navigation,
  Fuel,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useViagens } from '@/hooks/useViagens';
import { useDespesas } from '@/hooks/useDespesas';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useCaminhoes } from '@/hooks/useCaminhoes';
import type { Viagem } from '../../types';
import { formatarKm, formatarTempo, formatarDataHora, formatarData, labelStatusViagem, formatarMoeda } from '../../utils/formatters';

function MapaRota({ viagem }: { viagem: Viagem }) {
  const temRota = viagem.rota && viagem.rota.length > 1;
  return (
    <div className="bg-accent/30 rounded-xl border border-border overflow-hidden">
      <div className="relative h-48 flex items-center justify-center">
        {temRota ? (
          <svg viewBox="0 0 400 200" className="w-full h-full opacity-80">
            <rect width="400" height="200" fill="var(--color-muted)" rx="8" />
            {[50,100,150].map(y => (
              <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="var(--color-border)" strokeWidth="0.5" />
            ))}
            {[100,200,300].map(x => (
              <line key={x} x1={x} y1="0" x2={x} y2="200" stroke="var(--color-border)" strokeWidth="0.5" />
            ))}
            <polyline
              points={viagem.rota.map((_pt, i) => {
                const x = 30 + (i / (viagem.rota.length - 1)) * 340;
                const y = 100 + Math.sin(i * 0.8) * 30;
                return `${x},${y}`;
              }).join(' ')}
              fill="none" stroke="var(--color-primary)" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round"
            />
            <circle cx="30" cy="100" r="8" fill="var(--color-chart-2)" />
            <text x="30" y="128" textAnchor="middle" fontSize="9" fill="var(--color-foreground)">Início</text>
            <circle cx="370" cy={100 + Math.sin((viagem.rota.length - 1) * 0.8) * 30} r="8"
              fill={viagem.status === 'em_andamento' ? 'var(--color-chart-3)' : 'var(--color-chart-5)'} />
            <text x="370" y={100 + Math.sin((viagem.rota.length - 1) * 0.8) * 30 + 18}
              textAnchor="middle" fontSize="9" fill="var(--color-foreground)">
              {viagem.status === 'em_andamento' ? 'Atual' : 'Fim'}
            </text>
          </svg>
        ) : (
          <div className="text-center">
            <Navigation className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Sem pontos de rota registrados</p>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-medium">
          {viagem.rota.length} pontos GPS
        </div>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2 text-sm border-t border-border">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-chart-2" />
          <div>
            <p className="text-xs text-muted-foreground">Origem</p>
            <p className="font-medium text-xs">{viagem.origem || 'Não informado'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-destructive" />
          <div>
            <p className="text-xs text-muted-foreground">Destino</p>
            <p className="font-medium text-xs">{viagem.destino || (viagem.status === 'em_andamento' ? 'Em rota...' : 'Não informado')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DespesasViagem({ viagemId }: { viagemId: string }) {
  const { despesas, loading } = useDespesas(viagemId);
  if (loading) return <div className="text-sm text-muted-foreground">Carregando despesas...</div>;
  if (despesas.length === 0) return null;
  const total = despesas.reduce((acc, d) => acc + d.valor, 0);
  return (
    <div>
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Fuel className="w-4 h-4" />
        Despesas da Viagem
      </h3>
      <div className="space-y-2">
        {despesas.map(d => (
          <div key={d.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
            <div>
              <p className="text-sm font-medium">{d.descricao}</p>
              <p className="text-xs text-muted-foreground capitalize">{d.tipoDespesa}</p>
            </div>
            <p className="font-bold text-sm">{formatarMoeda(d.valor)}</p>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-border pt-2 mt-2">
          <p className="text-sm font-semibold">Total</p>
          <p className="font-bold">{formatarMoeda(total)}</p>
        </div>
      </div>
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
];

export default function Viagens() {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [viagemSelecionada, setViagemSelecionada] = useState<Viagem | null>(null);
  const [viagemParaExcluir, setViagemParaExcluir] = useState<Viagem | null>(null);
  const [viagemParaEditar, setViagemParaEditar] = useState<Viagem | null>(null);
  const [dialogNova, setDialogNova] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const { viagens, loading, excluirViagem, atualizarViagem, criarViagemManual } = useViagens();
  const { motoristas } = useMotoristas();
  const { caminhoes } = useCaminhoes();

  // Form para editar viagem
  const [formEditar, setFormEditar] = useState({
    kmTotal: '',
    tempoTotal: '',
    origem: '',
    destino: '',
    status: '' as Viagem['status'] | '',
  });

  // Form para nova viagem
  const [formNova, setFormNova] = useState({
    motoristaId: '',
    caminhaoId: '',
    kmTotal: '',
    tempoTotal: '',
    origem: '',
    destino: '',
    status: 'concluida' as 'concluida' | 'cancelada',
    dataInicio: new Date().toISOString().slice(0, 16),
  });

  const filtradas = viagens.filter(v => {
    const matchBusca = v.motoristaNome.toLowerCase().includes(busca.toLowerCase()) ||
      v.caminhaoPlaca.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || v.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const getStatusVariant = (status: string) => {
    if (status === 'em_andamento') return 'default';
    if (status === 'concluida') return 'secondary';
    return 'destructive';
  };

  const abrirEditar = (v: Viagem) => {
    setViagemParaEditar(v);
    setFormEditar({
      kmTotal: v.kmTotal?.toString() || '',
      tempoTotal: v.tempoTotal?.toString() || '',
      origem: v.origem || '',
      destino: v.destino || '',
      status: v.status,
    });
  };

  const salvarEdicao = async () => {
    if (!viagemParaEditar) return;
    setSalvando(true);
    await atualizarViagem(viagemParaEditar.id, {
      kmTotal: formEditar.kmTotal ? Number(formEditar.kmTotal) : undefined,
      tempoTotal: formEditar.tempoTotal ? Number(formEditar.tempoTotal) : undefined,
      origem: formEditar.origem || undefined,
      destino: formEditar.destino || undefined,
      status: formEditar.status as Viagem['status'],
    });
    setSalvando(false);
    setViagemParaEditar(null);
  };

  const salvarNova = async () => {
    if (!formNova.motoristaId || !formNova.caminhaoId) return;
    setSalvando(true);
    const motorista = motoristas.find(m => m.id === formNova.motoristaId);
    const caminhao = caminhoes.find(c => c.id === formNova.caminhaoId);
    if (!motorista || !caminhao) { setSalvando(false); return; }

    await criarViagemManual({
      motoristaId: motorista.id,
      motoristaNome: motorista.nome,
      caminhaoId: caminhao.id,
      caminhaoPlaca: caminhao.placa,
      kmTotal: formNova.kmTotal ? Number(formNova.kmTotal) : undefined,
      tempoTotal: formNova.tempoTotal ? Number(formNova.tempoTotal) : undefined,
      origem: formNova.origem || undefined,
      destino: formNova.destino || undefined,
      status: formNova.status,
      dataInicio: new Date(formNova.dataInicio).toISOString(),
    });

    setSalvando(false);
    setDialogNova(false);
    setFormNova({ motoristaId: '', caminhaoId: '', kmTotal: '', tempoTotal: '', origem: '', destino: '', status: 'concluida', dataInicio: new Date().toISOString().slice(0, 16) });
  };

  const confirmarExcluir = async () => {
    if (!viagemParaExcluir) return;
    await excluirViagem(viagemParaExcluir.id);
    setViagemParaExcluir(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Viagens</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie todas as viagens da frota</p>
        </div>
        <Button onClick={() => setDialogNova(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Viagem
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por motorista ou placa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['todos', 'em_andamento', 'concluida', 'cancelada'].map(s => (
            <Button
              key={s}
              variant={filtroStatus === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus(s)}
            >
              {s === 'todos' ? 'Todas' : labelStatusViagem(s)}
            </Button>
          ))}
        </div>
      </div>

      {/* Contagem */}
      <div className="text-sm text-muted-foreground">
        {filtradas.length} viagem(ns) encontrada(s)
      </div>

      {/* Lista de viagens */}
      <div className="space-y-3">
        {filtradas.map(viagem => (
          <Card key={viagem.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-xl p-2.5 shrink-0">
                    <Route className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{viagem.motoristaNome}</span>
                      <Badge variant={getStatusVariant(viagem.status) as 'default' | 'secondary' | 'destructive' | 'outline'} className="text-xs">
                        {labelStatusViagem(viagem.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        {viagem.caminhaoPlaca}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatarDataHora(viagem.dataInicio)}
                      </span>
                      {viagem.kmTotal && (
                        <span className="flex items-center gap-1">
                          <Route className="w-3 h-3" />
                          {formatarKm(viagem.kmTotal)}
                        </span>
                      )}
                      {viagem.tempoTotal && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatarTempo(viagem.tempoTotal)}
                        </span>
                      )}
                    </div>
                    {(viagem.origem || viagem.destino) && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {viagem.origem && viagem.destino
                          ? `${viagem.origem} → ${viagem.destino}`
                          : viagem.origem || viagem.destino}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                    title="Ver detalhes"
                    onClick={() => setViagemSelecionada(viagem)}
                  >
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                    title="Editar viagem"
                    onClick={() => abrirEditar(viagem)}
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                    title="Excluir viagem"
                    onClick={() => setViagemParaExcluir(viagem)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtradas.length === 0 && (
        <div className="text-center py-12">
          <Route className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {viagens.length === 0 ? 'Nenhuma viagem registrada ainda' : 'Nenhuma viagem encontrada para os filtros selecionados'}
          </p>
          <Button className="mt-4" onClick={() => setDialogNova(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar viagem
          </Button>
        </div>
      )}

      {/* Dialog detalhes */}
      <Dialog open={!!viagemSelecionada} onOpenChange={() => setViagemSelecionada(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Viagem</DialogTitle>
          </DialogHeader>
          {viagemSelecionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />Motorista</p>
                  <p className="font-medium text-sm">{viagemSelecionada.motoristaNome}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="w-3 h-3" />Caminhão</p>
                  <p className="font-medium text-sm">{viagemSelecionada.caminhaoPlaca}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />Início</p>
                  <p className="font-medium text-sm">{formatarDataHora(viagemSelecionada.dataInicio)}</p>
                </div>
                {viagemSelecionada.dataFim && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />Encerramento</p>
                    <p className="font-medium text-sm">{formatarDataHora(viagemSelecionada.dataFim)}</p>
                  </div>
                )}
                {viagemSelecionada.kmTotal && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Route className="w-3 h-3" />Distância</p>
                    <p className="font-medium text-sm">{formatarKm(viagemSelecionada.kmTotal)}</p>
                  </div>
                )}
                {viagemSelecionada.tempoTotal && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />Duração</p>
                    <p className="font-medium text-sm">{formatarTempo(viagemSelecionada.tempoTotal)}</p>
                  </div>
                )}
              </div>
              <MapaRota viagem={viagemSelecionada} />
              <DespesasViagem viagemId={viagemSelecionada.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog editar viagem */}
      <Dialog open={!!viagemParaEditar} onOpenChange={() => setViagemParaEditar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Viagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {viagemParaEditar && (
              <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm">
                <span className="font-medium">{viagemParaEditar.motoristaNome}</span>
                <span className="text-muted-foreground ml-2">• {viagemParaEditar.caminhaoPlaca}</span>
                <span className="text-muted-foreground ml-2">• {formatarData(viagemParaEditar.dataInicio)}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formEditar.status} onValueChange={(v) => setFormEditar(f => ({ ...f, status: v as Viagem['status'] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>KM percorridos</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 350"
                  value={formEditar.kmTotal}
                  onChange={(e) => setFormEditar(f => ({ ...f, kmTotal: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (minutos)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 240"
                  value={formEditar.tempoTotal}
                  onChange={(e) => setFormEditar(f => ({ ...f, tempoTotal: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origem</Label>
                <Input
                  placeholder="Cidade de origem"
                  value={formEditar.origem}
                  onChange={(e) => setFormEditar(f => ({ ...f, origem: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Destino</Label>
                <Input
                  placeholder="Cidade de destino"
                  value={formEditar.destino}
                  onChange={(e) => setFormEditar(f => ({ ...f, destino: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViagemParaEditar(null)}>Cancelar</Button>
            <Button onClick={salvarEdicao} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog nova viagem */}
      <Dialog open={dialogNova} onOpenChange={setDialogNova}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Viagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Motorista *</Label>
              <Select value={formNova.motoristaId} onValueChange={(v) => setFormNova(f => ({ ...f, motoristaId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar motorista" />
                </SelectTrigger>
                <SelectContent>
                  {motoristas.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Caminh��o *</Label>
              <Select value={formNova.caminhaoId} onValueChange={(v) => setFormNova(f => ({ ...f, caminhaoId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar caminhão" />
                </SelectTrigger>
                <SelectContent>
                  {caminhoes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.placa} — {c.modelo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formNova.status} onValueChange={(v) => setFormNova(f => ({ ...f, status: v as 'concluida' | 'cancelada' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data e hora de início *</Label>
              <Input
                type="datetime-local"
                value={formNova.dataInicio}
                onChange={(e) => setFormNova(f => ({ ...f, dataInicio: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>KM percorridos</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 350"
                  value={formNova.kmTotal}
                  onChange={(e) => setFormNova(f => ({ ...f, kmTotal: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (minutos)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 240"
                  value={formNova.tempoTotal}
                  onChange={(e) => setFormNova(f => ({ ...f, tempoTotal: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origem</Label>
                <Input
                  placeholder="Cidade de origem"
                  value={formNova.origem}
                  onChange={(e) => setFormNova(f => ({ ...f, origem: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Destino</Label>
                <Input
                  placeholder="Cidade de destino"
                  value={formNova.destino}
                  onChange={(e) => setFormNova(f => ({ ...f, destino: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogNova(false)}>Cancelar</Button>
            <Button onClick={salvarNova} disabled={salvando || !formNova.motoristaId || !formNova.caminhaoId}>
              {salvando ? 'Salvando...' : 'Registrar viagem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <AlertDialog open={!!viagemParaExcluir} onOpenChange={() => setViagemParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir viagem?</AlertDialogTitle>
            <AlertDialogDescription>
              A viagem de <strong>{viagemParaExcluir?.motoristaNome}</strong> em{' '}
              <strong>{viagemParaExcluir ? formatarData(viagemParaExcluir.dataInicio) : ''}</strong> será excluída permanentemente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExcluir} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
