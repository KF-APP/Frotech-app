import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  UserCog,
  Plus,
  Search,
  Trash2,
  Shield,
  Mail,
  Calendar,
  Truck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AdminData {
  id: string;
  nome: string;
  email: string;
  dataCriacao: string;
  totalMotoristas: number;
  totalCaminhoes: number;
}

export default function Admins() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [dialogAberto, setDialogAberto] = useState(false);
  const [adminParaExcluir, setAdminParaExcluir] = useState<AdminData | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('tipo', 'admin')
      .order('data_criacao', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar administradores');
      setLoading(false);
      return;
    }

    // Para cada admin, buscar contagem de motoristas e caminhões
    const adminsComStats = await Promise.all((data || []).map(async (profile) => {
      const [{ count: totalMotoristas }, { count: totalCaminhoes }] = await Promise.all([
        supabase.from('motoristas').select('*', { count: 'exact', head: true }).eq('admin_id', profile.id),
        supabase.from('caminhoes').select('*', { count: 'exact', head: true }).eq('admin_id', profile.id),
      ]);

      return {
        id: profile.id,
        nome: profile.nome,
        email: profile.email,
        dataCriacao: profile.data_criacao,
        totalMotoristas: totalMotoristas || 0,
        totalCaminhoes: totalCaminhoes || 0,
      };
    }));

    setAdmins(adminsComStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const filtrados = admins.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.email.toLowerCase().includes(busca.toLowerCase())
  );

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.senha !== form.confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (form.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSalvando(true);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: form.email,
      password: form.senha,
      email_confirm: true,
      user_metadata: {
        nome: form.nome,
        tipo: 'admin',
      },
    });

    if (authError || !authData.user) {
      if (authError?.message?.includes('already')) {
        toast.error('Já existe um usuário com este email');
      } else {
        toast.error('Erro ao criar administrador');
      }
      setSalvando(false);
      return;
    }

    toast.success('Administrador criado com sucesso!');
    setDialogAberto(false);
    setForm({ nome: '', email: '', senha: '', confirmarSenha: '' });
    await fetchAdmins();
    setSalvando(false);
  };

  const handleExcluir = async () => {
    if (!adminParaExcluir) return;
    if (adminParaExcluir.id === user?.id) {
      toast.error('Você não pode excluir sua própria conta');
      setAdminParaExcluir(null);
      return;
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(adminParaExcluir.id);
    if (error) {
      toast.error('Erro ao excluir administrador');
    } else {
      toast.success('Administrador removido!');
      await fetchAdmins();
    }
    setAdminParaExcluir(null);
  };

  const initials = (nome: string) => nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Administradores</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie os administradores do sistema</p>
        </div>
        <Button onClick={() => setDialogAberto(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Admin
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar administrador..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      )}

      {/* Grid de admins */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(admin => (
            <Card key={admin.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-11 h-11">
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                        {initials(admin.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{admin.nome}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Shield className="w-3 h-3 text-primary" />
                        <Badge variant="secondary" className="text-xs h-4 px-1.5">Admin</Badge>
                        {admin.id === user?.id && (
                          <Badge variant="outline" className="text-xs h-4 px-1.5">Você</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {admin.id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setAdminParaExcluir(admin)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{admin.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Desde {new Date(admin.dataCriacao).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-xs">Motoristas</span>
                    </div>
                    <p className="text-xl font-bold">{admin.totalMotoristas}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Truck className="w-3.5 h-3.5" />
                      <span className="text-xs">Caminhões</span>
                    </div>
                    <p className="text-xl font-bold">{admin.totalCaminhoes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filtrados.length === 0 && (
        <div className="text-center py-12">
          <UserCog className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum administrador encontrado</p>
        </div>
      )}

      {/* Dialog criar admin */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Novo Administrador
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCriar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                placeholder="João Silva"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@empresa.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.senha}
                onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                placeholder="Repita a senha"
                value={form.confirmarSenha}
                onChange={e => setForm(f => ({ ...f, confirmarSenha: e.target.value }))}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Criando...' : 'Criar Administrador'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert de exclusão */}
      <AlertDialog open={!!adminParaExcluir} onOpenChange={() => setAdminParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Administrador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{adminParaExcluir?.nome}</strong>? 
              Todos os motoristas e dados vinculados a este admin serão afetados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleExcluir}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
