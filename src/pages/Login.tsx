import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, Lock, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, senha);

    if (result.success) {
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } else {
      setError(result.error || 'Erro ao fazer login');
    }

    setLoading(false);
  };

  const preencherAdmin = () => {
    setEmail('admin@frotatech.com');
    setSenha('admin123');
  };

  const preencherMotorista = () => {
    setEmail('joao@frotatech.com');
    setSenha('moto123');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Header */}
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

        {/* Card de Login */}
        <Card>
          <CardHeader>
            <CardTitle>Entrar no sistema</CardTitle>
            <CardDescription>Use suas credenciais para acessar o painel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Atalhos de demo */}
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-3 text-center font-medium">Acesso rápido para demonstração</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={preencherAdmin} className="text-xs">
                Entrar como Admin
              </Button>
              <Button variant="outline" size="sm" onClick={preencherMotorista} className="text-xs">
                Entrar como Motorista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
