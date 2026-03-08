import { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Plus, Search, Phone, Mail, Truck, Route, TrendingDown, Pencil, Trash2 } from 'lucide-react';
import { mockMotoristas as initialMotoristas, mockCaminhoes } from '../../data/mockData';
import type { Motorista } from '../../types';
import { formatarKm } from '../../utils/formatters';
import { toast } from 'sonner';

export default function Motoristas() {
  const [motoristas, setMotoristas] = useState<Motorista[]>(initialMotoristas);
  const [busca, setBusca] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Motorista | null>(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    caminhaoId: '',
  });

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

  const salvar = () => {
    if (!form.nome || !form.email || !form.telefone) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (editando) {
      setMotoristas(prev => prev.map(m => m.id === editando.id
        ? { ...m, nome: form.nome, email: form.email, telefone: form.telefone, caminhaoId: form.caminhaoId || undefined }
        : m
      ));
      toast.success('Motorista atualizado com sucesso!');
    } else {
      if (!form.senha) {
        toast.error('Informe a senha para o motorista');
        return;
      }
      const novo: Motorista = {
        id: `mot-${Date.now()}`,
        userId: `user-mot-${Date.now()}`,
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        caminhaoId: form.caminhaoId || undefined,
        kmTotal: 0,
        totalViagens: 0,
        custoMedioPorKm: 0,
      };
      setMotoristas(prev => [...prev, novo]);
      toast.success('Motorista cadastrado com sucesso!');
    }
    setDialogOpen(false);
  };

  const excluir = (id: string) => {
    setMotoristas(prev => prev.filter(m => m.id !== id));
    toast.success('Motorista removido');
  };

  const getCaminhaoPlaca = (caminhaoId?: string) => {
    if (!caminhaoId) return null;
    return mockCaminhoes.find(c => c.id === caminhaoId)?.placa;
  };

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
                      onClick={() => excluir(mot.id)}
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
                    <span className="text-xs">{mot.telefone}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Route className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-xs font-bold">{mot.totalViagens}</p>
                    <p className="text-xs text-muted-foreground">Viagens</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Truck className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-xs font-bold">{formatarKm(mot.kmTotal)}</p>
                    <p className="text-xs text-muted-foreground">KM rodados</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <TrendingDown className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-xs font-bold">
                      {mot.custoMedioPorKm > 0 ? `R$ ${mot.custoMedioPorKm.toFixed(2)}` : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">Custo/KM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum motorista encontrado</p>
          <Button className="mt-4" onClick={abrirNovo}>
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar primeiro motorista
          </Button>
        </div>
      )}

      {/* Dialog */}
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
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
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
                  placeholder="••••••••"
                  value={form.senha}
                  onChange={(e) => setForm(f => ({ ...f, senha: e.target.value }))}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Caminh��o associado</Label>
              <Select value={form.caminhaoId} onValueChange={(v) => setForm(f => ({ ...f, caminhaoId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar caminhão (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {mockCaminhoes.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.placa} - {c.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>
              {editando ? 'Salvar alterações' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
