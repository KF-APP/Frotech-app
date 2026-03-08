import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Receipt, Plus, Search, Truck, Calendar, User, Filter, Trash2, Upload, ImagePlus, X, Pencil } from 'lucide-react';
import type { TipoDespesa, Despesa } from '../../types';
import { formatarMoeda, formatarData, labelTipoDespesa } from '../../utils/formatters';
import { useDespesas } from '@/hooks/useDespesas';
import { useCaminhoes } from '@/hooks/useCaminhoes';
import { useViagens } from '@/hooks/useViagens';
import { Skeleton } from '@/components/ui/skeleton';

const TIPOS_DESPESA: TipoDespesa[] = [
  'combustivel', 'pedagio', 'alimentacao', 'manutencao',
  'pneu', 'seguro', 'licenciamento', 'ipva', 'revisao', 'outros'
];

const TIPO_CORES: Record<string, string> = {
  combustivel: 'bg-chart-1/10 text-chart-1',
  pedagio: 'bg-chart-2/10 text-chart-2',
  alimentacao: 'bg-chart-3/10 text-chart-3',
  manutencao: 'bg-chart-4/10 text-chart-4',
  pneu: 'bg-chart-5/10 text-chart-5',
  seguro: 'bg-primary/10 text-primary',
  licenciamento: 'bg-primary/10 text-primary',
  ipva: 'bg-primary/10 text-primary',
  revisao: 'bg-chart-4/10 text-chart-4',
  outros: 'bg-muted text-muted-foreground',
};

export default function Despesas() {
  const { despesas, loading, criarDespesa, atualizarDespesa, excluirDespesa } = useDespesas();
  const { caminhoes } = useCaminhoes();
  const { viagens } = useViagens();
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCaminhao, setFiltroCaminhao] = useState('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    tipoDespesa: '' as TipoDespesa | '',
    valor: '',
    descricao: '',
    data: new Date().toISOString().split('T')[0],
    caminhaoId: '',
    viagemId: '',
  });
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [comprovantePreview, setComprovantePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edição de despesa
  const [despesaParaEditar, setDespesaParaEditar] = useState<Despesa | null>(null);
  const [formEditar, setFormEditar] = useState({
    tipoDespesa: '' as TipoDespesa | '',
    valor: '',
    descricao: '',
    data: '',
    caminhaoId: '',
    viagemId: '',
  });

  // Exclusão com confirmação
  const [despesaParaExcluir, setDespesaParaExcluir] = useState<Despesa | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const abrirEditar = (d: Despesa) => {
    setDespesaParaEditar(d);
    setFormEditar({
      tipoDespesa: d.tipoDespesa,
      valor: d.valor.toString(),
      descricao: d.descricao,
      data: d.data.split('T')[0],
      caminhaoId: d.caminhaoId || '',
      viagemId: d.viagemId || '',
    });
  };

  const salvarEdicao = async () => {
    if (!despesaParaEditar || !formEditar.tipoDespesa || !formEditar.valor || !formEditar.descricao) return;
    setSalvando(true);
    await atualizarDespesa(despesaParaEditar.id, {
      tipoDespesa: formEditar.tipoDespesa as TipoDespesa,
      valor: Number(formEditar.valor),
      descricao: formEditar.descricao,
      data: new Date(formEditar.data + 'T12:00:00').toISOString(),
      caminhaoId: formEditar.caminhaoId || undefined,
      viagemId: formEditar.viagemId || undefined,
    });
    setSalvando(false);
    setDespesaParaEditar(null);
  };

  const confirmarExcluir = async () => {
    if (!despesaParaExcluir) return;
    setExcluindo(true);
    await excluirDespesa(despesaParaExcluir.id);
    setExcluindo(false);
    setDespesaParaExcluir(null);
  };

  const filtradas = despesas.filter(d => {
    const matchBusca = d.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      d.criadoPorNome.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filtroTipo === 'todos' || d.tipoDespesa === filtroTipo;
    const matchCaminhao = filtroCaminhao === 'todos' || d.caminhaoId === filtroCaminhao;
    return matchBusca && matchTipo && matchCaminhao;
  });

  const totalFiltrado = filtradas.reduce((acc, d) => acc + d.valor, 0);

  const salvar = async () => {
    if (!form.tipoDespesa || !form.valor || !form.descricao || !form.data || !form.caminhaoId) return;
    setSalvando(true);

    await criarDespesa({
      tipoDespesa: form.tipoDespesa as TipoDespesa,
      valor: Number(form.valor),
      descricao: form.descricao,
      data: new Date(form.data + 'T12:00:00').toISOString(),
      caminhaoId: form.caminhaoId,
      viagemId: form.viagemId || undefined,
      criadoPor: 'admin',
      comprovanteFile: comprovanteFile,
    });

    setSalvando(false);
    setDialogOpen(false);
    setForm({ tipoDespesa: '', valor: '', descricao: '', data: new Date().toISOString().split('T')[0], caminhaoId: '', viagemId: '' });
    setComprovanteFile(null);
    if (comprovantePreview) URL.revokeObjectURL(comprovantePreview);
    setComprovantePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getCaminhaoPlaca = (id?: string) => caminhoes.find(c => c.id === id)?.placa || '';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Despesas</h1>
          <p className="text-muted-foreground text-sm mt-1">Controle todos os gastos da frota</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Resumo por categoria */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {['combustivel', 'manutencao', 'pedagio', 'outros'].map(tipo => {
          const total = despesas.filter(d => {
            if (tipo === 'outros') return !['combustivel', 'manutencao', 'pedagio'].includes(d.tipoDespesa);
            return d.tipoDespesa === tipo;
          }).reduce((acc, d) => acc + d.valor, 0);

          return (
            <Card key={tipo}>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground capitalize">{labelTipoDespesa(tipo)}</p>
                <p className="text-lg font-bold mt-1">{formatarMoeda(total)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar despesas..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {TIPOS_DESPESA.map(t => (
              <SelectItem key={t} value={t}>{labelTipoDespesa(t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroCaminhao} onValueChange={setFiltroCaminhao}>
          <SelectTrigger className="w-full sm:w-44">
            <Truck className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Todos os caminhões" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os caminhões</SelectItem>
            {caminhoes.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.placa} — {c.modelo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
        <span className="text-sm text-muted-foreground">{filtradas.length} despesa(s) encontrada(s)</span>
        <span className="font-bold">{formatarMoeda(totalFiltrado)}</span>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtradas.map(d => (
          <Card key={d.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${TIPO_CORES[d.tipoDespesa] || TIPO_CORES.outros}`}>
                    {labelTipoDespesa(d.tipoDespesa)}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{d.descricao}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatarData(d.data)}
                      </span>
                      {d.caminhaoId && (
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {getCaminhaoPlaca(d.caminhaoId)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {d.criadoPorNome}
                      </span>
                      <Badge variant={d.criadoPor === 'admin' ? 'default' : 'secondary'} className="text-xs h-4">
                        {d.criadoPor === 'admin' ? 'Admin' : 'Motorista'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="font-bold">{formatarMoeda(d.valor)}</p>
                    {d.comprovanteUrl && (
                      <a
                        href={d.comprovanteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center gap-1 justify-end hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        <Upload className="w-3 h-3" />
                        Ver comprovante
                      </a>
                    )}
                  </div>
                  <button
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                    title="Editar despesa"
                    onClick={() => abrirEditar(d)}
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                    title="Excluir despesa"
                    onClick={() => setDespesaParaExcluir(d)}
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
          <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma despesa encontrada</p>
        </div>
      )}

      {/* AlertDialog confirmar exclusão */}
      <AlertDialog open={!!despesaParaExcluir} onOpenChange={() => setDespesaParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              A despesa <strong>{despesaParaExcluir?.descricao}</strong> de{' '}
              <strong>{despesaParaExcluir ? formatarMoeda(despesaParaExcluir.valor) : ''}</strong> será excluída permanentemente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExcluir}
              disabled={excluindo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluindo ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog editar despesa */}
      <Dialog open={!!despesaParaEditar} onOpenChange={() => setDespesaParaEditar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipo de despesa *</Label>
              <Select value={formEditar.tipoDespesa} onValueChange={(v) => setFormEditar(f => ({ ...f, tipoDespesa: v as TipoDespesa }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_DESPESA.map(t => (
                    <SelectItem key={t} value={t}>{labelTipoDespesa(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formEditar.valor}
                  onChange={(e) => setFormEditar(f => ({ ...f, valor: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={formEditar.data}
                  onChange={(e) => setFormEditar(f => ({ ...f, data: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                placeholder="Descreva a despesa..."
                value={formEditar.descricao}
                onChange={(e) => setFormEditar(f => ({ ...f, descricao: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Caminhão</Label>
              <Select value={formEditar.caminhaoId || 'nenhum'} onValueChange={(v) => setFormEditar(f => ({ ...f, caminhaoId: v === 'nenhum' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum</SelectItem>
                  {caminhoes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.placa} — {c.modelo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Viagem relacionada</Label>
              <Select value={formEditar.viagemId || 'nenhuma'} onValueChange={(v) => setFormEditar(f => ({ ...f, viagemId: v === 'nenhuma' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Nenhuma</SelectItem>
                  {viagens.filter(v => v.status === 'concluida').map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.motoristaNome} — {formatarData(v.dataInicio)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDespesaParaEditar(null)}>Cancelar</Button>
            <Button onClick={salvarEdicao} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog nova despesa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Despesa Administrativa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipo de despesa *</Label>
              <Select value={form.tipoDespesa} onValueChange={(v) => setForm(f => ({ ...f, tipoDespesa: v as TipoDespesa }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DESPESA.map(t => (
                    <SelectItem key={t} value={t}>{labelTipoDespesa(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.valor}
                  onChange={(e) => setForm(f => ({ ...f, valor: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm(f => ({ ...f, data: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                placeholder="Descreva a despesa..."
                value={form.descricao}
                onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Caminhão *</Label>
              <Select value={form.caminhaoId} onValueChange={(v) => setForm(f => ({ ...f, caminhaoId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar caminhão" />
                </SelectTrigger>
                <SelectContent>
                  {caminhoes.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.placa} — {c.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Viagem relacionada (opcional)</Label>
              <Select value={form.viagemId || 'nenhuma'} onValueChange={(v) => setForm(f => ({ ...f, viagemId: v === 'nenhuma' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma viagem específica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Nenhuma</SelectItem>
                  {viagens.filter(v => v.status === 'concluida').map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.motoristaNome} — {formatarData(v.dataInicio)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Upload comprovante */}
            <div className="space-y-2">
              <Label>Comprovante (opcional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) return;
                  setComprovanteFile(file);
                  setComprovantePreview(URL.createObjectURL(file));
                }}
              />
              {comprovantePreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={comprovantePreview} alt="Comprovante" className="w-full h-32 object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setComprovanteFile(null);
                      if (comprovantePreview) URL.revokeObjectURL(comprovantePreview);
                      setComprovantePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus className="w-4 h-4 mr-2" />
                  Anexar foto do comprovante
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Registrar despesa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
