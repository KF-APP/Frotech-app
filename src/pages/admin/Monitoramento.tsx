import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  MapPin,
  Truck,
  Clock,
  DollarSign,
  Route,
  User,
  CheckCircle2,
  Circle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { useViagens } from '@/hooks/useViagens';
import { useDespesas } from '@/hooks/useDespesas';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useCaminhoes } from '@/hooks/useCaminhoes';
import { formatarMoeda, formatarKm, formatarTempo, formatarData } from '../../utils/formatters';

export default function Monitoramento() {
  const { viagens, loading: loadingViagens } = useViagens();
  const { despesas, loading: loadingDespesas } = useDespesas();
  const { motoristas, loading: loadingMotoristas } = useMotoristas();
  const { caminhoes, loading: loadingCaminhoes } = useCaminhoes();

  const loading = loadingViagens || loadingDespesas || loadingMotoristas || loadingCaminhoes;

  const viagensEmAndamento = useMemo(() => viagens.filter(v => v.status === 'em_andamento'), [viagens]);
  const viagensConcluidas = useMemo(() => viagens.filter(v => v.status === 'concluida'), [viagens]);
  const viagensHoje = useMemo(() => {
    const hoje = new Date().toDateString();
    return viagens.filter(v => new Date(v.dataInicio).toDateString() === hoje);
  }, [viagens]);

  // Despesas por viagem (para mostrar no card de viagem ativa)
  const despesasPorViagem = useMemo(() => {
    const mapa: Record<string, number> = {};
    despesas.forEach(d => {
      if (d.viagemId) {
        mapa[d.viagemId] = (mapa[d.viagemId] || 0) + d.valor;
      }
    });
    return mapa;
  }, [despesas]);

  // Feed de atividade recente (últimas 20 viagens)
  const atividadeRecente = useMemo(() =>
    [...viagens]
      .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())
      .slice(0, 20),
    [viagens]
  );

  // Motoristas disponíveis (sem viagem ativa)
  const motoristasAtivos = useMemo(() => {
    const emViagem = new Set(viagensEmAndamento.map(v => v.motoristaId));
    return motoristas.map(m => ({
      ...m,
      emViagem: emViagem.has(m.id),
      viagemAtual: viagensEmAndamento.find(v => v.motoristaId === m.id),
    }));
  }, [motoristas, viagensEmAndamento]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Monitoramento
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Acompanhe em tempo real a operação da frota</p>
      </div>

      {/* KPIs do dia */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={viagensEmAndamento.length > 0 ? 'border-primary/30 bg-primary/5' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Em Rota Agora</span>
              {viagensEmAndamento.length > 0 && (
                <span className="ml-auto flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-primary">{viagensEmAndamento.length}</p>
            <p className="text-xs text-muted-foreground">viagem(ns) ativa(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Hoje</span>
            </div>
            <p className="text-2xl font-bold">{viagensHoje.length}</p>
            <p className="text-xs text-muted-foreground">viagem(ns) iniciadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Motoristas</span>
            </div>
            <p className="text-2xl font-bold">{motoristasAtivos.filter(m => m.emViagem).length}/{motoristas.length}</p>
            <p className="text-xs text-muted-foreground">em viagem / total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Route className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Viagens</span>
            </div>
            <p className="text-2xl font-bold">{viagensConcluidas.length}</p>
            <p className="text-xs text-muted-foreground">concluídas</p>
          </CardContent>
        </Card>
      </div>

      {/* Viagens em andamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Viagens em Andamento
            {viagensEmAndamento.length > 0 && (
              <Badge className="ml-2">{viagensEmAndamento.length} ao vivo</Badge>
            )}
          </CardTitle>
          <CardDescription>Motoristas atualmente em rota</CardDescription>
        </CardHeader>
        <CardContent>
          {viagensEmAndamento.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma viagem em andamento no momento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {viagensEmAndamento.map(v => {
                const caminhao = caminhoes.find(c => c.id === v.caminhaoId);
                const despesasViagem = despesasPorViagem[v.id] || 0;
                const duracaoMin = Math.floor((Date.now() - new Date(v.dataInicio).getTime()) / 60000);

                return (
                  <div key={v.id} className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                    <div className="bg-primary rounded-full p-2 shrink-0">
                      <Truck className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{v.motoristaNome}</p>
                        <Badge variant="outline" className="font-mono text-xs">{v.caminhaoPlaca}</Badge>
                        <Badge className="text-xs">Em rota</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatarTempo(duracaoMin)} em andamento
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Início: {formatarData(v.dataInicio)}
                        </span>
                        {despesasViagem > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatarMoeda(despesasViagem)} em despesas
                          </span>
                        )}
                        {caminhao?.valorDiaria && caminhao.valorDiaria > 0 && (
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <TrendingUp className="w-3 h-3" />
                            Diária: {formatarMoeda(caminhao.valorDiaria)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">GPS</p>
                      <p className="text-xs font-medium">
                        {v.rota?.length > 0 ? `${v.rota.length} pontos` : 'Aguardando'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status dos motoristas e Feed de atividade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status dos motoristas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Status dos Motoristas
            </CardTitle>
            <CardDescription>Disponibilidade atual</CardDescription>
          </CardHeader>
          <CardContent>
            {motoristasAtivos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum motorista cadastrado</p>
            ) : (
              <div className="space-y-2">
                {motoristasAtivos.map(m => (
                  <div key={m.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {m.nome.charAt(0)}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${m.emViagem ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.nome}</p>
                      {m.emViagem && m.viagemAtual ? (
                        <p className="text-xs text-primary">Em viagem • {m.viagemAtual.caminhaoPlaca}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Disponível</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {m.emViagem ? (
                        <><Circle className="w-2 h-2 fill-primary text-primary" /><span className="text-primary font-medium">Em rota</span></>
                      ) : (
                        <><Circle className="w-2 h-2 fill-muted-foreground/40 text-muted-foreground/40" /><span className="text-muted-foreground">Livre</span></>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feed de atividade recente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Atividade Recente
            </CardTitle>
            <CardDescription>Últimas ações registradas</CardDescription>
          </CardHeader>
          <CardContent>
            {atividadeRecente.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade registrada</p>
            ) : (
              <div className="space-y-0 relative">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
                {atividadeRecente.map((v, idx) => (
                  <div key={v.id} className="flex gap-3 pb-3 relative">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      v.status === 'em_andamento' ? 'bg-primary' :
                      v.status === 'concluida' ? 'bg-chart-2' : 'bg-muted'
                    }`}>
                      {v.status === 'em_andamento' ? (
                        <MapPin className="w-3 h-3 text-white" />
                      ) : v.status === 'concluida' ? (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-medium truncate">{v.motoristaNome}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="font-mono">{v.caminhaoPlaca}</span>
                        <span>•</span>
                        <span>
                          {v.status === 'em_andamento' ? 'Iniciou viagem' :
                           v.status === 'concluida' ? `Concluiu • ${formatarKm(v.kmTotal || 0)}` : 'Cancelou'}
                        </span>
                        <span>•</span>
                        <span>{formatarData(v.dataInicio)}</span>
                      </div>
                      {v.status === 'concluida' && (v.tempoTotal || 0) > 0 && (
                        <p className="text-xs text-muted-foreground">{formatarTempo(v.tempoTotal || 0)} de duração</p>
                      )}
                    </div>
                    {idx === 0 && v.status === 'em_andamento' && (
                      <Badge className="text-xs shrink-0">Ao vivo</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Despesas recentes dos motoristas */}
      {despesas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Últimas Despesas Registradas
            </CardTitle>
            <CardDescription>Gastos lançados pelos motoristas e administradores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...despesas]
                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                .slice(0, 8)
                .map(d => (
                  <div key={d.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.descricao}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{d.criadoPorNome}</span>
                        <span>•</span>
                        <span>{formatarData(d.data)}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs h-4 capitalize">{d.tipoDespesa}</Badge>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm">{formatarMoeda(d.valor)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{d.criadoPor}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
