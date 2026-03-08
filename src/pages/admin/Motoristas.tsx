import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Users, Plus, Search, Phone, Mail, Truck, Route, TrendingDown, DollarSign, Pencil, Trash2 } from 'lucide-react';
import type { Motorista } from '../../types';
import { formatarKm, formatarMoeda } from '../../utils/formatters';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useCaminhoes } from '@/hooks/useCaminhoes';
import { useViagens } from '@/hooks/useViagens';
import { useDespesas } from '@/hooks/useDespesas';
import { Skeleton } from '@/components/ui/skeleton';

export default function Motoristas() {
  const { motoristas, loading, criarMotorista, atualizarMotorista, excluirMotorista } = useMotoristas();
  const { caminhoes } = useCaminhoes();
  const { viagens } = useViagens();
  const { despesas } = useDespesas();
  const [busca, setBusca] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Motorista | null>(null);
  const [motoristaPraExcluir, setMotoristaPraExcluir] = useState<Motorista | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    caminhaoId: '',
  });

  // Stats por motorista calculados em tempo real cruzando viagens e despesas
  const statsMotorista = useMemo(() => {
    const map: Record<string, { km: number; viagens: number; despesas: number }> = {};
    for (const m of motoristas) {
      const viagensMotorista = viagens.filter(v => v.motoristaId === m.id && v.status === 'concluida');
      const kmTotal = viagensMotorista.reduce((acc, v) => acc + (v.kmTotal || 0), 0);
      const idsViagens = new Set(viagensMotorista.map(v => v.id));
      const despesasMotorista = despesas.filter(d =>
        (d.viagemId && idsViagens.has(d.viagemId)) ||
        (m.caminhaoId && d.caminhaoId === m.caminhaoId)
      );
      const totalDespesas = despesasMotorista.reduce((acc, d) => acc + d.valor, 0);
      map[m.id] = { km: kmTotal, viagens: viagensMotorista.length, despesas: totalDespesas };
    }
    return map;
  }, [motoristas, viagens, despesas]);

  const filtrados = motoristas.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    m.email.toLowerCase().includes(busca.toLowerCase())
  );

  const abrirNovo = () => {
    setEditando(null);
    setForm({ nome: '', email: '', telefone: '', senha: '', caminhaoId: '' });
    setDialogOpen(true);
  };

  const abrirEditar = (mot: Motorista) => {
    setEditando(mot);
    setForm({ nome: mot.nome, email: mot.email, telefone: mot.telefone, senha: '', caminhaoId: mot.caminhaoId || '' });
    setDialogOpen(true);
  };

  const salvar = async () => {
    if (!form.nome || !form.email || !form.telefone) return;
    if (!editando && !form.senha) return;

    setSalvando(true);

    if (editando) {
      await atualizarMotorista(editando.id, {
        nome: form.nome,
        telefone: form.telefone,
        caminhaoId: form.caminhaoId || undefined,
      });
    } else {
      await criarMotorista({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        telefone: form.telefone,
        caminhaoId: form.caminhaoId || undefined,
      });
    }

    setSalvando(false);
    setDialogOpen(false);
  };

  const confirmarExcluir = async () => {
    if (!motoristaPraExcluir) return;
    setExcluindo(true);
    await excluirMotorista(motoristaPraExcluir.id);
    setExcluindo(false);
    setMotoristaPraExcluir(null);
  };

  const getCaminhaoPlaca = (caminhaoId?: string) => {
    if (!caminhaoId) return null;
    return caminhoes.find(c => c.id === caminhaoId)?.placa;
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
          <h1 className="text-2xl font-bold">Motoristas</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie os motoristas da frota</p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Motorista
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtrados.map(mot => {
          const caminhaoPlaca = getCaminhaoPlaca(mot.caminhaoId);
          const initials = mot.nome.split(' ').map(n => n[0]).slice(0, 2).join('');
          const stats = statsMotorista[mot.id] || { km: 0, viagens: 0, despesas: 0 };
          const custoKm = stats.km > 0 ? stats.despesas / stats.km : 0;

          return (
            <Card key={mot.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{mot.nome}</CardTitle>
                      {caminhaoPlaca ? (
                        <Badge variant="outline" className="mt-1 text-xs">
                          <Truck className="w-3 h-3 mr-1" />
                          {caminhaoPlaca}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="mt-1 text-xs">Sem veículo</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                      onClick={() => abrirEditar(mot)}
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                      onClick={() => setMotoristaPraExcluir(mot)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate text-xs">{mot.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-xs">{mot.telefone || '—'}</span>
                  </div>
                </div>

                {/* Stats em tempo real */}
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
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
                    <p className="text-xs text-muted-foreground">KM rodados</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <TrendingDown className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-xs font-bold">
                      {custoKm > 0 ? `R$ ${custoKm.toFixed(2)}` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">Custo/KM</p>
                  </div>
                </div>

                {stats.despesas > 0 && (
                  <div className="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Total despesas:</span>
                    <span className="text-xs font-bold ml-auto">{formatarMoeda(stats.despesas)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtrados.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum motorista encontrado</p>
          <Button className="mt-4" onClick={abrirNovo}>
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar primeiro motorista
          </Button>
        </div>
      )}

      {/* AlertDialog excluir motorista */}
      <AlertDialog open={!!motoristaPraExcluir} onOpenChange={() => setMotoristaPraExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir motorista?</AlertDialogTitle>
            <AlertDialogDescription>
              O motorista <strong>{motoristaPraExcluir?.nome}</strong> será removido permanentemente junto com seu acesso ao sistema.
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Motorista' : 'Novo Motorista'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome completo *</Label>
              <Input
                placeholder="João da Silva"
                value={form.nome}
                onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="joao@email.com"
                  value={form.email}
                  disabled={!!editando}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  placeholder="(11) 98765-4321"
                  value={form.telefone}
                  onChange={(e) => setForm(f => ({ ...f, telefone: e.target.value }))}
                />
              </div>
            </div>
            {!editando && (
              <div className="space-y-2">
                <Label>Senha de acesso *</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.senha}
                  onChange={(e) => setForm(f => ({ ...f, senha: e.target.value }))}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Caminhão associado</Label>
              <Select value={form.caminhaoId || 'nenhum'} onValueChange={(v) => setForm(f => ({ ...f, caminhaoId: v === 'nenhum' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar caminhão (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum</SelectItem>
                  {caminhoes.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.placa} — {c.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
