import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Play,
  Square,
  Plus,
  MapPin,
  Clock,
  Route,
  Fuel,
  ShoppingBag,
  DollarSign,
  LogOut,
  Navigation,
  CheckCircle,
  AlertCircle,
  Camera,
  History,
  Truck,
} from 'lucide-react';
import type { PontoGPS, TipoDespesa } from '../../types';
import { formatarTempo, labelTipoDespesa } from '../../utils/formatters';
import { toast } from 'sonner';

type TelaMotorista = 'home' | 'viagem' | 'historico';

interface DespesaLocal {
  id: string;
  tipoDespesa: TipoDespesa;
  valor: number;
  descricao: string;
  data: string;
}

function calcularDistancia(p1: PontoGPS, p2: PontoGPS): number {
  const R = 6371; // km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function AppMotorista() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tela, setTela] = useState<TelaMotorista>('home');
  const [viagemAtiva, setViagemAtiva] = useState(false);
  const [pontoGPS, setPontoGPS] = useState<PontoGPS[]>([]);
  const [kmPercorrido, setKmPercorrido] = useState(0);
  const [tempoInicio, setTempoInicio] = useState<Date | null>(null);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [localizacaoAtual, setLocalizacaoAtual] = useState<GeolocationPosition | null>(null);
  const [gpsAtivo, setGpsAtivo] = useState(false);
  const [gpsErro, setGpsErro] = useState('');
  const [despesas, setDespesas] = useState<DespesaLocal[]>([]);
  const [dialogDespesa, setDialogDespesa] = useState(false);
  const [dialogEncerrar, setDialogEncerrar] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsWatchRef = useRef<number | null>(null);
  const [formDespesa, setFormDespesa] = useState({
    tipoDespesa: '' as TipoDespesa | '',
    valor: '',
    descricao: '',
  });

  // Timer da viagem
  useEffect(() => {
    if (viagemAtiva && tempoInicio) {
      intervalRef.current = setInterval(() => {
        setTempoDecorrido(Math.floor((Date.now() - tempoInicio.getTime()) / 1000 / 60));
      }, 30000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [viagemAtiva, tempoInicio]);

  const iniciarGPS = () => {
    if (!navigator.geolocation) {
      setGpsErro('GPS não disponível neste dispositivo');
      return;
    }

    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocalizacaoAtual(pos);
        setGpsAtivo(true);
        setGpsErro('');

        const novoPonto: PontoGPS = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: new Date().toISOString(),
          velocidade: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : undefined,
          precisao: pos.coords.accuracy,
        };

        setPontoGPS(prev => {
          const novo = [...prev, novoPonto];
          if (prev.length > 0) {
            const distancia = calcularDistancia(prev[prev.length - 1], novoPonto);
            setKmPercorrido(km => km + distancia);
          }
          return novo;
        });
      },
      (err) => {
        setGpsErro(`Erro GPS: ${err.message}`);
        setGpsAtivo(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  };

  const iniciarViagem = () => {
    setViagemAtiva(true);
    setTempoInicio(new Date());
    setTempoDecorrido(0);
    setKmPercorrido(0);
    setPontoGPS([]);
    setDespesas([]);
    iniciarGPS();
    setTela('viagem');
    toast.success('Viagem iniciada! GPS ativado.');
  };

  const encerrarViagem = () => {
    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setViagemAtiva(false);
    setGpsAtivo(false);
    setDialogEncerrar(false);

    const kmFinal = Math.max(kmPercorrido, pontoGPS.length * 0.5);

    toast.success(`Viagem encerrada! ${kmFinal.toFixed(1)} km percorridos em ${formatarTempo(tempoDecorrido)}`);
    setTela('home');
  };

  const adicionarDespesa = () => {
    if (!formDespesa.tipoDespesa || !formDespesa.valor || !formDespesa.descricao) {
      toast.error('Preencha todos os campos');
      return;
    }

    const nova: DespesaLocal = {
      id: `d-${Date.now()}`,
      tipoDespesa: formDespesa.tipoDespesa as TipoDespesa,
      valor: Number(formDespesa.valor),
      descricao: formDespesa.descricao,
      data: new Date().toISOString(),
    };

    setDespesas(prev => [...prev, nova]);
    toast.success('Despesa registrada!');
    setDialogDespesa(false);
    setFormDespesa({ tipoDespesa: '', valor: '', descricao: '' });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
  const velocidadeAtual = localizacaoAtual?.coords.speed
    ? Math.round(localizacaoAtual.coords.speed * 3.6)
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-sm mx-auto">
      {/* Header */}
      <header className="bg-sidebar text-sidebar-foreground px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="bg-sidebar-primary/20 rounded-xl p-2">
          <Truck className="w-5 h-5 text-sidebar-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">FrotaTech</p>
          <p className="text-xs text-sidebar-foreground/70">Olá, {user?.nome.split(' ')[0]}</p>
        </div>
        {viagemAtiva && (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs animate-pulse">
            Em viagem
          </Badge>
        )}
        <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
          <LogOut className="w-4 h-4 text-sidebar-foreground/70" />
        </button>
      </header>

      {/* Nav tabs */}
      <div className="bg-card border-b border-border flex">
        {[
          { id: 'home', icon: Navigation, label: 'Início' },
          { id: 'viagem', icon: Route, label: 'Viagem', disabled: !viagemAtiva },
          { id: 'historico', icon: History, label: 'Histórico' },
        ].map(tab => (
          <button
            key={tab.id}
            disabled={tab.disabled}
            onClick={() => setTela(tab.id as TelaMotorista)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-medium transition-colors disabled:opacity-40 ${
              tela === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">

        {/* HOME */}
        {tela === 'home' && (
          <>
            {!viagemAtiva ? (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Navigation className="w-12 h-12 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Pronto para rodar?</h2>
                  <p className="text-muted-foreground text-sm mt-1">Inicie uma nova viagem para registrar sua rota</p>
                </div>

                <Button
                  className="w-full h-16 text-lg font-bold"
                  onClick={iniciarViagem}
                >
                  <Play className="w-6 h-6 mr-3" />
                  INICIAR VIAGEM
                </Button>

                {/* Info status GPS */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${navigator.geolocation ? 'bg-green-500' : 'bg-destructive'}`} />
                      <p className="text-sm">
                        {navigator.geolocation ? 'GPS disponível no dispositivo' : 'GPS não disponível'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Viagem em andamento</p>
                  <p className="text-3xl font-bold text-primary mt-1">{formatarTempo(tempoDecorrido)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Route className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-lg font-bold">{kmPercorrido.toFixed(1)} km</p>
                      <p className="text-xs text-muted-foreground">Percorridos</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Navigation className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-lg font-bold">{velocidadeAtual} km/h</p>
                      <p className="text-xs text-muted-foreground">Velocidade</p>
                    </CardContent>
                  </Card>
                </div>

                {/* GPS status */}
                <div className={`flex items-center gap-2 p-3 rounded-lg ${gpsAtivo ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                  <div className={`w-2 h-2 rounded-full ${gpsAtivo ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                  <p className="text-xs">
                    {gpsAtivo ? `GPS ativo · ${pontoGPS.length} pontos registrados` : gpsErro || 'Aguardando GPS...'}
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setTela('viagem')}
                >
                  Ver detalhes da viagem
                </Button>

                <Button
                  variant="destructive"
                  className="w-full h-14 text-base font-bold"
                  onClick={() => setDialogEncerrar(true)}
                >
                  <Square className="w-5 h-5 mr-2" />
                  ENCERRAR VIAGEM
                </Button>
              </div>
            )}
          </>
        )}

        {/* VIAGEM */}
        {tela === 'viagem' && viagemAtiva && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Em Rota</h2>

            {/* Métricas */}
            <div className="grid grid-cols-3 gap-2">
              <Card>
                <CardContent className="pt-3 pb-3 text-center">
                  <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-sm font-bold">{formatarTempo(tempoDecorrido)}</p>
                  <p className="text-xs text-muted-foreground">Tempo</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-3 text-center">
                  <Route className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-sm font-bold">{kmPercorrido.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">KM</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-3 text-center">
                  <DollarSign className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-sm font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(totalDespesas)}
                  </p>
                  <p className="text-xs text-muted-foreground">Despesas</p>
                </CardContent>
              </Card>
            </div>

            {/* Mapa visual simplificado */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Localização atual
                  </p>
                  {gpsAtivo && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                </div>
                {localizacaoAtual ? (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Lat: {localizacaoAtual.coords.latitude.toFixed(6)}</p>
                    <p>Lng: {localizacaoAtual.coords.longitude.toFixed(6)}</p>
                    <p>Precisão: ±{Math.round(localizacaoAtual.coords.accuracy)}m</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {gpsErro || 'Aguardando localização GPS...'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Botão adicionar despesa */}
            <Button className="w-full" onClick={() => setDialogDespesa(true)}>
              <Plus className="w-4 h-4 mr-2" />
              ADICIONAR DESPESA
            </Button>

            {/* Lista de despesas */}
            {despesas.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Despesas registradas</p>
                {despesas.map(d => (
                  <div key={d.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      {d.tipoDespesa === 'combustivel' && <Fuel className="w-4 h-4 text-primary" />}
                      {d.tipoDespesa === 'pedagio' && <MapPin className="w-4 h-4 text-primary" />}
                      {d.tipoDespesa === 'alimentacao' && <ShoppingBag className="w-4 h-4 text-primary" />}
                      {!['combustivel', 'pedagio', 'alimentacao'].includes(d.tipoDespesa) && <DollarSign className="w-4 h-4 text-primary" />}
                      <div>
                        <p className="text-xs font-medium">{d.descricao}</p>
                        <p className="text-xs text-muted-foreground">{labelTipoDespesa(d.tipoDespesa)}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.valor)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="destructive"
              className="w-full h-14 text-base font-bold mt-4"
              onClick={() => setDialogEncerrar(true)}
            >
              <Square className="w-5 h-5 mr-2" />
              ENCERRAR VIAGEM
            </Button>
          </div>
        )}

        {/* HISTÓRICO */}
        {tela === 'historico' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Histórico de Viagens</h2>
            <div className="space-y-3">
              {[
                { data: '20/11/2024', km: 95, tempo: 390, origem: 'São Paulo', destino: 'Campinas' },
                { data: '18/11/2024', km: 180, tempo: 480, origem: 'Campinas', destino: 'Santos' },
                { data: '15/11/2024', km: 120, tempo: 360, origem: 'Santos', destino: 'São Paulo' },
              ].map((v, i) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-600">Concluída</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{v.data}</p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">{v.origem}</span>
                          <span className="text-muted-foreground"> → </span>
                          <span className="font-medium">{v.destino}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{v.km} km</p>
                        <p className="text-xs text-muted-foreground">{formatarTempo(v.tempo)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialog: Adicionar Despesa */}
      <Dialog open={dialogDespesa} onOpenChange={setDialogDespesa}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={formDespesa.tipoDespesa} onValueChange={(v) => setFormDespesa(f => ({ ...f, tipoDespesa: v as TipoDespesa }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combustivel">Combustível</SelectItem>
                  <SelectItem value="pedagio">Pedágio</SelectItem>
                  <SelectItem value="alimentacao">Alimentação</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formDespesa.valor}
                onChange={(e) => setFormDespesa(f => ({ ...f, valor: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Textarea
                placeholder="Descreva a despesa..."
                value={formDespesa.descricao}
                onChange={(e) => setFormDespesa(f => ({ ...f, descricao: e.target.value }))}
                rows={2}
              />
            </div>
            <Button variant="outline" className="w-full" onClick={() => toast.info('Câmera não disponível na versão demo')}>
              <Camera className="w-4 h-4 mr-2" />
              Tirar foto do comprovante
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDespesa(false)}>Cancelar</Button>
            <Button onClick={adicionarDespesa}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar encerrar viagem */}
      <Dialog open={dialogEncerrar} onOpenChange={setDialogEncerrar}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Encerrar Viagem?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Distância</span>
                <span className="font-bold">{kmPercorrido.toFixed(1)} km</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tempo</span>
                <span className="font-bold">{formatarTempo(tempoDecorrido)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Despesas</span>
                <span className="font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesas)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pontos GPS</span>
                <span className="font-bold">{pontoGPS.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className="text-xs text-yellow-700">Após encerrar, os dados serão salvos automaticamente</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEncerrar(false)}>Continuar viagem</Button>
            <Button variant="destructive" onClick={encerrarViagem}>
              <Square className="w-4 h-4 mr-2" />
              Encerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
