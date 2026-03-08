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
  History,
  Truck,
  ImagePlus,
  X,
} from 'lucide-react';
import type { PontoGPS, TipoDespesa } from '../../types';
import { formatarTempo, formatarData, formatarKm } from '../../utils/formatters';
import { toast } from 'sonner';
import { useViagens } from '@/hooks/useViagens';
import { useDespesas } from '@/hooks/useDespesas';
import { supabase } from '@/lib/supabase';

type TelaMotorista = 'home' | 'viagem' | 'historico';

interface DespesaLocal {
  id: string;
  tipoDespesa: TipoDespesa;
  valor: number;
  descricao: string;
  data: string;
  comprovanteFile?: File | null;
  comprovantePreview?: string | null;
}

function calcularDistancia(p1: PontoGPS, p2: PontoGPS): number {
  const R = 6371;
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
  const { user, logout, motoristaId } = useAuth();
  const navigate = useNavigate();
  const [tela, setTela] = useState<TelaMotorista>('home');
  const [viagemAtiva, setViagemAtiva] = useState(false);
  const [viagemAtivaId, setViagemAtivaId] = useState<string | null>(null);
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
  const [salvandoViagem, setSalvandoViagem] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsWatchRef = useRef<number | null>(null);
  const [formDespesa, setFormDespesa] = useState({
    tipoDespesa: '' as TipoDespesa | '',
    valor: '',
    descricao: '',
  });
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [comprovantePreview, setComprovantePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get motorista data to find caminhao and admin_id
  const [motoristaData, setMotoristaData] = useState<{
    nome: string;
    caminhao_id: string | null;
    caminhao_placa: string | null;
    admin_id: string | null;
  } | null>(null);

  useEffect(() => {
    if (motoristaId) {
      supabase
        .from('motoristas')
        .select('nome, caminhao_id, admin_id')
        .eq('id', motoristaId)
        .single()
        .then(async ({ data }) => {
          if (data) {
            let placa: string | null = null;
            if (data.caminhao_id) {
              const { data: cam } = await supabase
                .from('caminhoes')
                .select('placa')
                .eq('id', data.caminhao_id)
                .single();
              placa = cam?.placa || null;
            }
            setMotoristaData({
              nome: data.nome,
              caminhao_id: data.caminhao_id,
              caminhao_placa: placa,
              admin_id: (data as Record<string, unknown>).admin_id as string | null,
            });
          }
        });
    }
  }, [motoristaId]);

  const { viagens, iniciarViagem: iniciarViagemBanco, finalizarViagem, salvarPontoGPS } = useViagens(motoristaId);
  const { criarDespesa } = useDespesas();

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

  const iniciarGPS = (viagemId: string) => {
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

        // Save GPS point to database every 5 points
        salvarPontoGPS(
          viagemId,
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : undefined,
          pos.coords.accuracy
        );
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

  const handleIniciarViagem = async () => {
    if (!motoristaId || !user) {
      toast.error('Dados do motorista não encontrados');
      return;
    }

    if (!motoristaData?.caminhao_id) {
      toast.error('Você não tem um caminhão associado. Fale com o administrador.');
      return;
    }

    const result = await iniciarViagemBanco({
      motoristaId,
      motoristaNome: user.nome,
      caminhaoId: motoristaData.caminhao_id,
      caminhaoPlaca: motoristaData.caminhao_placa || '',
      adminId: motoristaData.admin_id || undefined,
    });

    if (result.success && result.viagemId) {
      setViagemAtivaId(result.viagemId);
      setViagemAtiva(true);
      setTempoInicio(new Date());
      setTempoDecorrido(0);
      setKmPercorrido(0);
      setPontoGPS([]);
      setDespesas([]);
      iniciarGPS(result.viagemId);
      setTela('viagem');
    }
  };

  const handleEncerrarViagem = async () => {
    if (!viagemAtivaId) return;

    setSalvandoViagem(true);

    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
    }
    if (intervalRef.current) clearInterval(intervalRef.current);

    const kmFinal = Math.max(kmPercorrido, 0);

    await finalizarViagem(viagemAtivaId, {
      kmTotal: kmFinal,
      tempoTotal: tempoDecorrido,
    });

    // Save all local despesas to database (including comprovante photos)
    for (const d of despesas) {
      await criarDespesa({
        tipoDespesa: d.tipoDespesa,
        valor: d.valor,
        descricao: d.descricao,
        data: d.data,
        caminhaoId: motoristaData?.caminhao_id || undefined,
        viagemId: viagemAtivaId,
        criadoPor: 'motorista',
        comprovanteFile: d.comprovanteFile || null,
        adminId: motoristaData?.admin_id || undefined,
      });
    }

    setViagemAtiva(false);
    setViagemAtivaId(null);
    setGpsAtivo(false);
    setDialogEncerrar(false);
    setSalvandoViagem(false);

    toast.success(`Viagem salva! ${kmFinal.toFixed(2)} km percorridos em ${formatarTempo(tempoDecorrido)}`);
    setTela('home');
  };

  const handleComprovanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    setComprovanteFile(file);
    const url = URL.createObjectURL(file);
    setComprovantePreview(url);
  };

  const removerComprovante = () => {
    setComprovanteFile(null);
    if (comprovantePreview) URL.revokeObjectURL(comprovantePreview);
    setComprovantePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      comprovanteFile: comprovanteFile,
      comprovantePreview: comprovantePreview,
    };

    setDespesas(prev => [...prev, nova]);
    toast.success('Despesa registrada! Será salva ao encerrar a viagem.');
    setDialogDespesa(false);
    setFormDespesa({ tipoDespesa: '', valor: '', descricao: '' });
    setComprovanteFile(null);
    setComprovantePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
  const velocidadeAtual = localizacaoAtual?.coords.speed
    ? Math.round(localizacaoAtual.coords.speed * 3.6)
    : 0;

  const historico = viagens.filter(v => v.status === 'concluida');

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-sm mx-auto">
      {/* Header */}
      <header className="bg-sidebar text-sidebar-foreground px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="bg-sidebar-primary/20 rounded-xl p-2">
          <Truck className="w-5 h-5 text-sidebar-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">FrotaTech</p>
          <p className="text-xs text-sidebar-foreground/70">
            Olá, {user?.nome.split(' ')[0]}
            {motoristaData?.caminhao_placa && ` · ${motoristaData.caminhao_placa}`}
          </p>
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
          { id: 'historico', icon: History, label: 'Hist��rico' },
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

                {!motoristaData?.caminhao_id && (
                  <Card className="border-yellow-500/30 bg-yellow-500/5">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <p className="text-xs text-yellow-700">Você não tem caminhão associado. Fale com o administrador.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button
                  className="w-full h-16 text-lg font-bold"
                  onClick={handleIniciarViagem}
                  disabled={!motoristaData?.caminhao_id}
                >
                  <Play className="w-6 h-6 mr-3" />
                  INICIAR VIAGEM
                </Button>

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
                      <p className="text-lg font-bold">{kmPercorrido.toFixed(2)} km</p>
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
                  <p className="text-sm font-bold">{kmPercorrido.toFixed(2)}</p>
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
                    {gpsErro || 'Aguardando localiza��ão GPS...'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => setDialogDespesa(true)}>
              <Plus className="w-4 h-4 mr-2" />
              ADICIONAR DESPESA
            </Button>

            {despesas.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Despesas desta viagem</p>
                {despesas.map(d => (
                  <div key={d.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      {d.tipoDespesa === 'combustivel' && <Fuel className="w-4 h-4 text-primary" />}
                      {d.tipoDespesa === 'pedagio' && <MapPin className="w-4 h-4 text-primary" />}
                      {d.tipoDespesa === 'alimentacao' && <ShoppingBag className="w-4 h-4 text-primary" />}
                      {!['combustivel', 'pedagio', 'alimentacao'].includes(d.tipoDespesa) && <DollarSign className="w-4 h-4 text-primary" />}
                      <div>
                        <p className="text-xs font-medium">{d.descricao}</p>
                        <p className="text-xs text-muted-foreground">{d.tipoDespesa}</p>
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
            {historico.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhuma viagem concluída ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historico.map(v => (
                  <Card key={v.id}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600">Concluída</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatarData(v.dataInicio)}</p>
                          {(v.origem || v.destino) && (
                            <p className="text-sm mt-1">
                              {v.origem && <span className="font-medium">{v.origem}</span>}
                              {v.origem && v.destino && <span className="text-muted-foreground"> → </span>}
                              {v.destino && <span className="font-medium">{v.destino}</span>}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{v.kmTotal ? formatarKm(v.kmTotal) : '—'}</p>
                          <p className="text-xs text-muted-foreground">
                            {v.tempoTotal ? formatarTempo(v.tempoTotal) : '—'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
            {/* Upload de comprovante */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleComprovanteChange}
              />
              {comprovantePreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={comprovantePreview}
                    alt="Comprovante"
                    className="w-full h-36 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removerComprovante}
                    className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background"
                  >
                    <X className="w-4 h-4 text-foreground" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-background/70 text-xs text-center py-1 text-foreground">
                    Comprovante adicionado
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="w-4 h-4 mr-2" />
                  Foto do comprovante (opcional)
                </Button>
              )}
            </div>
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
                <span className="font-bold">{kmPercorrido.toFixed(2)} km</span>
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
              <p className="text-xs text-yellow-700">Todos os dados serão salvos no sistema</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEncerrar(false)} disabled={salvandoViagem}>
              Continuar viagem
            </Button>
            <Button variant="destructive" onClick={handleEncerrarViagem} disabled={salvandoViagem}>
              <Square className="w-4 h-4 mr-2" />
              {salvandoViagem ? 'Salvando...' : 'Encerrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
