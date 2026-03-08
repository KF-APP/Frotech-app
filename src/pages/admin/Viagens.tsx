import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
} from 'lucide-react';
import { mockViagens, mockDespesas } from '../../data/mockData';
import type { Viagem } from '../../types';
import { formatarKm, formatarTempo, formatarDataHora, labelStatusViagem, formatarMoeda } from '../../utils/formatters';

// Componente visual do mapa simulado
function MapaRota({ viagem }: { viagem: Viagem }) {
  const temRota = viagem.rota && viagem.rota.length > 1;

  return (
    <div className="bg-accent/30 rounded-xl border border-border overflow-hidden">
      <div className="relative h-56 flex items-center justify-center">
        {temRota ? (
          <svg viewBox="0 0 400 200" className="w-full h-full opacity-80">
            {/* Fundo mapa simplificado */}
            <rect width="400" height="200" fill="var(--color-muted)" rx="8" />
            {/* Grade */}
            {[50,100,150].map(y => (
              <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="var(--color-border)" strokeWidth="0.5" />
            ))}
            {[100,200,300].map(x => (
              <line key={x} x1={x} y1="0" x2={x} y2="200" stroke="var(--color-border)" strokeWidth="0.5" />
            ))}
            {/* Rota */}
            <polyline
              points={viagem.rota.map((_p, i) => {
                const x = 30 + (i / (viagem.rota.length - 1)) * 340;
                const y = 100 + Math.sin(i * 0.8) * 30;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Ponto inicio */}
            <circle cx="30" cy="100" r="8" fill="var(--color-chart-2)" />
            <text x="30" y="128" textAnchor="middle" fontSize="9" fill="var(--color-foreground)">Início</text>
            {/* Ponto fim */}
            <circle
              cx="370"
              cy={100 + Math.sin((viagem.rota.length - 1) * 0.8) * 30}
              r="8"
              fill={viagem.status === 'em_andamento' ? 'var(--color-chart-3)' : 'var(--color-chart-5)'}
            />
            <text x="370" y={100 + Math.sin((viagem.rota.length - 1) * 0.8) * 30 + 18} textAnchor="middle" fontSize="9" fill="var(--color-foreground)">
              {viagem.status === 'em_andamento' ? 'Atual' : 'Fim'}
            </text>
            {/* Pontos de GPS */}
            {viagem.rota.slice(1, -1).map((_, i) => {
              const x = 30 + ((i + 1) / (viagem.rota.length - 1)) * 340;
              const y = 100 + Math.sin((i + 1) * 0.8) * 30;
              return (
                <circle key={i} cx={x} cy={y} r="3" fill="var(--color-primary)" opacity="0.6" />
              );
            })}
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

export default function Viagens() {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [viagemSelecionada, setViagemSelecionada] = useState<Viagem | null>(null);

  const filtradas = mockViagens.filter(v => {
    const matchBusca = v.motoristaNome.toLowerCase().includes(busca.toLowerCase()) ||
      v.caminhaoPlaca.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || v.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const despesasDaViagem = viagemSelecionada
    ? mockDespesas.filter(d => d.viagemId === viagemSelecionada.id)
    : [];

  const getStatusColor = (status: string) => {
    if (status === 'em_andamento') return 'default';
    if (status === 'concluida') return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Viagens</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitore todas as viagens da frota</p>
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
        <div className="flex gap-2">
          {['todos', 'em_andamento', 'concluida'].map(s => (
            <Button
              key={s}
              variant={filtroStatus === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus(s)}
            >
              {s === 'todos' ? 'Todas' : s === 'em_andamento' ? 'Em andamento' : 'Concluídas'}
            </Button>
          ))}
        </div>
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
                      <Badge variant={getStatusColor(viagem.status) as 'default' | 'secondary' | 'destructive' | 'outline'} className="text-xs">
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
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
                      {viagem.origem && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {viagem.origem}
                          {viagem.destino && <> → {viagem.destino}</>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {viagem.kmTotal && (
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold">{formatarKm(viagem.kmTotal)}</p>
                      <p className="text-xs text-muted-foreground">percorridos</p>
                    </div>
                  )}
                  {viagem.tempoTotal && (
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold">{formatarTempo(viagem.tempoTotal)}</p>
                      <p className="text-xs text-muted-foreground">duração</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViagemSelecionada(viagem)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtradas.length === 0 && (
        <div className="text-center py-12">
          <Route className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma viagem encontrada</p>
        </div>
      )}

      {/* Dialog detalhes da viagem */}
      <Dialog open={!!viagemSelecionada} onOpenChange={() => setViagemSelecionada(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Viagem</DialogTitle>
          </DialogHeader>

          {viagemSelecionada && (
            <div className="space-y-4">
              {/* Info básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />Motorista
                  </p>
                  <p className="font-medium text-sm">{viagemSelecionada.motoristaNome}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Truck className="w-3 h-3" />Caminhão
                  </p>
                  <p className="font-medium text-sm">{viagemSelecionada.caminhaoPlaca}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />Início
                  </p>
                  <p className="font-medium text-sm">{formatarDataHora(viagemSelecionada.dataInicio)}</p>
                </div>
                {viagemSelecionada.dataFim && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />Encerramento
                    </p>
                    <p className="font-medium text-sm">{formatarDataHora(viagemSelecionada.dataFim)}</p>
                  </div>
                )}
                {viagemSelecionada.kmTotal && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Route className="w-3 h-3" />Distância
                    </p>
                    <p className="font-medium text-sm">{formatarKm(viagemSelecionada.kmTotal)}</p>
                  </div>
                )}
                {viagemSelecionada.tempoTotal && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />Duração
                    </p>
                    <p className="font-medium text-sm">{formatarTempo(viagemSelecionada.tempoTotal)}</p>
                  </div>
                )}
              </div>

              {/* Mapa da rota */}
              <MapaRota viagem={viagemSelecionada} />

              {/* Despesas da viagem */}
              {despesasDaViagem.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Fuel className="w-4 h-4" />
                    Despesas da Viagem
                  </h3>
                  <div className="space-y-2">
                    {despesasDaViagem.map(d => (
                      <div key={d.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{d.descricao}</p>
                          <p className="text-xs text-muted-foreground">{d.tipoDespesa}</p>
                        </div>
                        <p className="font-bold text-sm">{formatarMoeda(d.valor)}</p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-border pt-2 mt-2">
                      <p className="text-sm font-semibold">Total</p>
                      <p className="font-bold">{formatarMoeda(despesasDaViagem.reduce((acc, d) => acc + d.valor, 0))}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
