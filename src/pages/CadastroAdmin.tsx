import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Truck,
  Lock,
  Mail,
  AlertCircle,
  User,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

type Etapa = 'dados' | 'codigo';

export default function CadastroAdmin() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState<Etapa>('dados');
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [mostrarCodigo, setMostrarCodigo] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    codigoAcesso: '',
  });

  const upd = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErro('');
  };

  const handleAvancar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!form.nome.trim()) { setErro('Informe seu nome completo'); return; }
    if (!form.email.trim()) { setErro('Informe seu email'); return; }
    if (form.senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres'); return; }
    if (form.senha !== form.confirmarSenha) { setErro('As senhas não coincidem'); return; }

    setEtapa('codigo');
  };

  const handleFinalizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!form.codigoAcesso.trim()) {
      setErro('Digite o código de acesso');
      return;
    }

    setVerificando(true);

    // 1. Verificar o código de acesso na tabela do banco
    const { data: codigoData, error: codigoError } = await supabase
      .from('codigos_acesso')
      .select('id')
      .eq('codigo', form.codigoAcesso.trim().toUpperCase())
      .eq('ativo', true)
      .single();

    if (codigoError || !codigoData) {
      setErro('Código de acesso incorreto. Verifique e tente novamente.');
      setVerificando(false);
      return;
    }

    setVerificando(false);
    setLoading(true);

    try {
      // 2. Criar conta via signUp (funciona no frontend)
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.senha,
        options: {
          data: {
            nome: form.nome.trim(),
            tipo: 'admin',
          },
        },
      });

      if (error) {
        if (
          error.message?.toLowerCase().includes('already') ||
          error.message?.toLowerCase().includes('registered')
        ) {
          setErro('Já existe uma conta com este email.');
        } else {
          setErro('Erro ao criar conta: ' + error.message);
        }
        setLoading(false);
        return;
      }

      if (!data.user) {
        setErro('Erro ao criar conta. Tente novamente.');
        setLoading(false);
        return;
      }

      // 3. Garantir que o profile foi criado com tipo 'admin'
      //    O trigger handle_new_user já faz isso automaticamente,
      //    mas fazemos upsert para garantir caso o trigger falhe.
      await supabase.from('profiles').upsert({
        id: data.user.id,
        nome: form.nome.trim(),
        email: form.email.trim(),
        tipo: 'admin',
      });

      toast.success('Conta criada com sucesso! Faça login para acessar o painel.');
      navigate('/login');
    } catch {
      setErro('Erro inesperado. Tente novamente.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            <div className="bg-primary rounded-2xl p-4">
              <Truck className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">FrotaTech</h1>
            <p className="text-muted-foreground text-sm mt-1">Sistema de Gestão de Frota</p>
          </div>
        </div>

        {/* Indicador de etapas */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              etapa === 'codigo' ? 'bg-primary/80 text-primary-foreground' : 'bg-primary text-primary-foreground'
            }`}>
              {etapa === 'codigo' ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </div>
            <span className={`text-sm font-medium ${etapa === 'dados' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Seus dados
            </span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              etapa === 'codigo' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <span className={`text-sm font-medium ${etapa === 'codigo' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Código de acesso
            </span>
          </div>
        </div>

        {/* Etapa 1: Dados */}
        {etapa === 'dados' && (
          <Card>
            <CardHeader>
              <CardTitle>Criar conta de administrador</CardTitle>
              <CardDescription>Preencha seus dados para criar a conta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAvancar} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="nome"
                      type="text"
                      placeholder="João Silva"
                      value={form.nome}
                      onChange={upd('nome')}
                      className="pl-10"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={form.email}
                      onChange={upd('email')}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="senha"
                      type={mostrarSenha ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={form.senha}
                      onChange={upd('senha')}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setMostrarSenha(v => !v)}
                    >
                      {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmarSenha"
                      type={mostrarConfirmar ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      value={form.confirmarSenha}
                      onChange={upd('confirmarSenha')}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setMostrarConfirmar(v => !v)}
                    >
                      {mostrarConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {erro && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{erro}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full">
                  Continuar
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Etapa 2: Código de acesso */}
        {etapa === 'codigo' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                Código de acesso
              </CardTitle>
              <CardDescription>
                Insira o código de acesso fornecido pelo responsável do sistema para finalizar o cadastro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFinalizar} className="space-y-4">
                {/* Resumo dos dados */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-0.5 text-sm border border-border">
                  <p className="font-medium">{form.nome}</p>
                  <p className="text-muted-foreground">{form.email}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigoAcesso">Código de acesso</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="codigoAcesso"
                      type={mostrarCodigo ? 'text' : 'password'}
                      placeholder="Digite o código"
                      value={form.codigoAcesso}
                      onChange={upd('codigoAcesso')}
                      className="pl-10 pr-10 tracking-widest text-center font-mono text-lg uppercase"
                      required
                      autoFocus
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setMostrarCodigo(v => !v)}
                    >
                      {mostrarCodigo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Solicite o código ao responsável pela plataforma
                  </p>
                </div>

                {erro && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{erro}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setEtapa('dados'); setErro(''); }}
                    disabled={loading || verificando}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading || verificando}>
                    {verificando ? 'Verificando...' : loading ? 'Criando conta...' : 'Finalizar cadastro'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
