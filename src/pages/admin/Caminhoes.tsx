import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Truck, Plus, Search, TrendingDown, Route, DollarSign, Pencil, Trash2, TrendingUp, User } from 'lucide-react';
import type { Caminhao } from '../../types';
import { formatarMoeda, formatarKm } from '../../utils/formatters';
import { useCaminhoes } from '@/hooks/useCaminhoes';
import { useViagens } from '@/hooks/useViagens';
import { useDespesas } from '@/hooks/useDespesas';
import { useMotoristas } from '@/hooks/useMotoristas';
import { Skeleton } from '@/components/ui/skeleton';

export default function Caminhoes() {
  const { caminhoes, loading, criarCaminhao, atualizarCaminhao, excluirCaminhao } = useCaminhoes();
  const { viagens } = useViagens();
  const { despesas } = useDespesas();
  const { motoristas } = useMotoristas();
  const [busca, setBusca] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Caminhao | null>(null);
  const [caminhaoParaExcluir, setCaminhaoParaExcluir] = useState<Caminhao | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [form, setForm] = useState({ placa: '', modelo: '', ano: '', capacidade: '', valorDiaria: '' });
  const [salvando, setSalvando] = useState(false);

  // Stats por caminhão calculados em tempo real
  const statsCaminhao = useMemo(() => {
    const map: Record<string, { km: number; viagens: number; despesas: number; motorista: string | null }> = {};
    for (const c of caminhoes) {
      const viagensCaminhao = viagens.filter(v => v.caminhaoId === c.id && v.status === 'concluida');
      const kmTotal = viagensCaminhao.reduce((acc, v) => acc + (v.kmTotal || 0), 0);
      const despesasCaminhao = despesas.filter(d => d.caminhaoId === c.id);
      const totalDespesas = despesasCaminhao.reduce((acc, d) => acc + d.valor, 0);
      const motorista = motoristas.find(m => m.caminhaoId === c.id);
      map[c.id] = {
        km: kmTotal,
        viagens: viagensCaminhao.length,
        despesas: totalDespesas,
        motorista: motorista?.nome || null,
      };
    }
    return map;
  }, [caminhoes, viagens, despesas, motoristas]);

  const filtrados = caminhoes.filter(c =>
    c.placa.toLowerCase().includes(busca.toLowerCase()) ||
    c.modelo.toLowerCase().includes(busca.toLowerCase())
  );

  const abrirNovo = () => {
    setEditando(null);
    setForm({ placa: '', modelo: '', ano: new Date().getFullYear().toString(), capacidade: '', valorDiaria: '' });
    setDialogOpen(true);
  };

  const abrirEditar = (cam: Caminhao) => {
    setEditando(cam);
    setForm({ placa: cam.placa, modelo: cam.modelo, ano: cam.ano.toString(), capacidade: cam.capacidade.toString(), valorDiaria: cam.valorDiaria > 0 ? cam.valorDiaria.toString() : '' });
    setDialogOpen(true);
  };

  const salvar = async () => {
    if (!form.placa || !form.modelo || !form.ano || !form.capacidade) return;
    setSalvando(true);

    if (editando) {
      await atualizarCaminhao(editando.id, {
        placa: form.placa,
        modelo: form.modelo,
        ano: Number(form.ano),
        capacidade: Number(form.capacidade),
        valorDiaria: Number(form.valorDiaria) || 0,
      });
    } else {
      await criarCaminhao({
        placa: form.placa,
        modelo: form.modelo,
        ano: Number(form.ano),
        capacidade: Number(form.capacidade),
        valorDiaria: Number(form.valorDiaria) || 0,
      });
    }

    setSalvando(false);
    setDialogOpen(false);
  };

  const confirmarExcluir = async () => {
    if (!caminhaoParaExcluir) return;
    setExcluindo(true);
    await excluirCaminhao(caminhaoParaExcluir.id);
    setExcluindo(false);
    setCaminhaoParaExcluir(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Caminhões</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie a frota de veículos</p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Caminhão
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por placa ou modelo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cards de caminhões */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtrados.map(cam => {
          const stats = statsCaminhao[cam.id] || { km: 0, viagens: 0, despesas: 0, motorista: null };
          const custoKm = stats.km > 0 ? stats.despesas / stats.km : 0;

          return (
            <Card key={cam.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-xl p-3">
                      <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{cam.modelo}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs font-mono">{cam.placa}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                      onClick={() => abrirEditar(cam)}
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                      onClick={() => setCaminhaoParaExcluir(cam)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Ano</p>
                    <p className="font-medium">{cam.ano}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Capacidade</p>
                    <p className="font-medium">{(cam.capacidade / 1000).toFixed(0)}t</p>
                  </div>
                </div>

                {/* Motorista vinculado */}
                {stats.motorista && (
                  <div className="mt-3 flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-muted-foreground">Motorista:</span>
                    <span className="text-xs font-semibold ml-auto">{stats.motorista}</span>
                  </div>
                )}

                {/* Stats em tempo real */}
                <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Route className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-xs font-bold">{stats.viagens}</p>
                    <p className="text-xs text-muted-foreground">Viagens</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Truck className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-xs font-bold">{formatarKm(stats.km)}</p>
                    <p className="text-xs text-muted-foreground">KM total</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <TrendingDown className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-xs font-bold">{custoKm > 0 ? `R$ ${custoKm.toFixed(2)}` : '—'}</p>
                    <p className="text-xs text-muted-foreground">Custo/KM</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Despesas totais:</span>
                  <span className="text-xs font-bold ml-auto">{formatarMoeda(stats.despesas)}</span>
                </div>
                {cam.valorDiaria > 0 && (
                  <div className="mt-2 flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-muted-foreground">Valor diária:</span>
                    <span className="text-xs font-bold ml-auto text-primary">{formatarMoeda(cam.valorDiaria)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtrados.length === 0 && !loading && (
        <div className="text-center py-12">
          <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum caminhão encontrado</p>
          <Button className="mt-4" onClick={abrirNovo}>
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar primeiro caminhão
          </Button>
        </div>
      )}

      {/* AlertDialog excluir caminhão */}
      <AlertDialog open={!!caminhaoParaExcluir} onOpenChange={() => setCaminhaoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir caminhão?</AlertDialogTitle>
            <AlertDialogDescription>
              O caminhão <strong>{caminhaoParaExcluir?.placa}</strong> ({caminhaoParaExcluir?.modelo}) será removido permanentemente.
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

      {/* Dialog cadastro/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Caminhão' : 'Novo Caminhão'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Placa *</Label>
              <Input
                placeholder="ABC-1234"
                value={form.placa}
                onChange={(e) => setForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Modelo *</Label>
              <Input
                placeholder="Ex: Volvo FH 460"
                value={form.modelo}
                onChange={(e) => setForm(f => ({ ...f, modelo: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ano *</Label>
                <Input
                  type="number"
                  placeholder="2024"
                  value={form.ano}
                  onChange={(e) => setForm(f => ({ ...f, ano: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacidade (kg) *</Label>
                <Input
                  type="number"
                  placeholder="25000"
                  value={form.capacidade}
                  onChange={(e) => setForm(f => ({ ...f, capacidade: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor da diária (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 350,00"
                value={form.valorDiaria}
                onChange={(e) => setForm(f => ({ ...f, valorDiaria: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Usado para calcular o lucro do caminhão</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
