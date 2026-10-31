import React, { useEffect, useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  ChevronRight,
  CalendarDays,
  Phone,
  Mail,
  CheckCircle2,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchDashboardData,
  getOrCreateNutricionistaId,
  type DashboardStats,
} from '@/lib/db';
import { Button } from '@/components/ui/button';

interface DashboardScreenProps {
  onNavigateToPacientes: () => void;
  onSelectPaciente: (pacienteId: string) => void;
  onToggleMenu?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToPacientes,
  onSelectPaciente,
  onToggleMenu,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Resolve the actual nutricionista ID
      const nutriId = await getOrCreateNutricionistaId(
        user.id,
        user.email,
        user.name
      );

      const data = await fetchDashboardData(nutriId);
      setStats(data);
      setLastRefreshed(new Date());
    } catch (err: unknown) {
      console.error('Erro ao carregar dados do dashboard:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Não foi possível sincronizar os dados em tempo real.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Real-time polling every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [user?.id, user?.email]);
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70 dark:bg-slate-950 overflow-y-auto">
      {/* Top Header Bar */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-emerald-100/70 dark:border-slate-800 px-4 sm:px-8 py-3.5 sm:py-4 sticky top-0 z-20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onToggleMenu && (
            <button
              type="button"
              onClick={onToggleMenu}
              className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-colors lg:hidden shrink-0"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2 truncate">
              <span>Dashboard</span>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800 shrink-0">
                Tempo Real
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate hidden sm:block">
              Acompanhe a atividade clínica e retenção de pacientes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-[11px] text-slate-400 hidden md:inline">
            Atualizado às {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-emerald-200 dark:border-slate-700 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 h-8 sm:h-9 px-2.5 sm:px-3 gap-1.5 cursor-pointer text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/10">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 to-transparent pointer-events-none" />
          
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium text-emerald-50">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              Painel NutricaAi
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Olá, {user?.name || 'Nutricionista'}! 👋
            </h2>
            <p className="text-emerald-100 text-sm max-w-xl font-normal leading-relaxed">
              Aqui está o panorama atual dos seus atendimentos e acompanhamento de pacientes cadastrados.
            </p>
          </div>
        </div>

        {/* Error notification if sync fails */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="border-rose-200 text-rose-800 hover:bg-rose-100/60"
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {/* 3 Main Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 — Total de pacientes ativos */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-emerald-100/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800/60 dark:text-emerald-400/80">
                  Card 1
                </span>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mt-0.5">
                  Total de pacientes ativos
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Pacientes cadastrados sob seus cuidados
                </p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-6 flex items-baseline justify-between">
              <div>
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {loading ? (
                    <span className="inline-block w-12 h-9 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                  ) : (
                    stats.totalPacientes
                  )}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-2">
                  pacientes
                </span>
              </div>

              <button
                type="button"
                onClick={onNavigateToPacientes}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Ver lista</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2 — Consultas da semana */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-teal-100/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800/60 dark:text-teal-400/80">
                  Card 2
                </span>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mt-0.5">
                  Consultas da semana
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Consultas registradas na semana corrente
                </p>
              </div>
              <div className="p-3 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-6 flex items-baseline justify-between">
              <div>
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {loading ? (
                    <span className="inline-block w-12 h-9 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                  ) : (
                    stats.consultasSemana
                  )}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-2">
                  nesta semana
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-300 font-medium bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-100/60 dark:border-teal-800">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Semana Atual</span>
              </div>
            </div>
          </div>

          {/* Card 3 Summary Counter / Indicator */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-amber-100/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800/60 dark:text-amber-400/80">
                  Card 3
                </span>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mt-0.5">
                  Pacientes sem retorno
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  &gt; 30 dias sem nova consulta agendada
                </p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-6 flex items-baseline justify-between">
              <div>
                <span className="text-4xl font-extrabold text-amber-700 dark:text-amber-400 tracking-tight">
                  {loading ? (
                    <span className="inline-block w-12 h-9 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                  ) : (
                    stats.pacientesSemRetorno.length
                  )}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-2">
                  precisam de contato
                </span>
              </div>

              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                stats.pacientesSemRetorno.length > 0 
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800' 
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
              }`}>
                {stats.pacientesSemRetorno.length > 0 ? 'Atenção' : 'Em dia'}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Section: Card 3 — Pacientes sem retorno */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/90 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Pacientes sem retorno (&gt; 30 dias)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pacientes cuja última consulta ocorreu há mais de 30 dias e não possuem retorno agendado
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-700">
              {stats.pacientesSemRetorno.length} pendente(s)
            </span>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : stats.pacientesSemRetorno.length === 0 ? (
              /* Message when no overdue patients */
              <div className="text-center py-12 px-4 max-w-md mx-auto space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-white">
                  Nenhum paciente sem retorno no momento
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Parabéns! Todos os seus pacientes tiveram consultas recentes ou já estão com retorno agendado.
                </p>
              </div>
            ) : (
              /* Clickable list of patients */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {stats.pacientesSemRetorno.map((paciente) => (
                  <button
                    key={paciente.id}
                    type="button"
                    onClick={() => onSelectPaciente(paciente.id)}
                    className="w-full text-left p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600 bg-white dark:bg-slate-850 dark:bg-slate-800/80 hover:bg-emerald-50/30 dark:hover:bg-slate-800 transition-all duration-200 shadow-xs hover:shadow-md group flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-1.5 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors text-sm truncate">
                          {paciente.nome}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800 shrink-0">
                          {paciente.dias_desde_ultima} dias atrás
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          Última: {paciente.ultima_consulta ? new Date(paciente.ultima_consulta).toLocaleDateString('pt-BR') : 'Sem registro'}
                        </span>

                        {paciente.whatsapp && (
                          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                            <Phone className="w-3 h-3" />
                            {paciente.whatsapp}
                          </span>
                        )}

                        {paciente.email && !paciente.whatsapp && (
                          <span className="flex items-center gap-1 text-slate-500 truncate max-w-[180px]">
                            <Mail className="w-3 h-3" />
                            {paciente.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-700/60 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-slate-400 dark:text-slate-300 shrink-0 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
