import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  TrendingDown,
  TrendingUp,
  X,
  Clock,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createConsulta, type Consulta } from '@/lib/db';

interface ConsultasSectionProps {
  pacienteId: string;
  consultas: Consulta[];
  pesoInicial?: number;
  onConsultaCreated: (novaConsulta: Consulta) => void;
}

export const ConsultasSection: React.FC<ConsultasSectionProps> = ({
  pacienteId,
  consultas,
  pesoInicial,
  onConsultaCreated,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Form states
  const hoje = new Date().toISOString().split('T')[0];
  const [dataConsulta, setDataConsulta] = useState(hoje);
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [quadril, setQuadril] = useState('');
  const [percentualGordura, setPercentualGordura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [proximoRetorno, setProximoRetorno] = useState('');

  // Sincronizar dados para o gráfico de evolução de peso
  // Ordenar cronologicamente ascendente para a linha do tempo (passado -> presente)
  const cronologicalConsultas = [...consultas]
    .filter((c) => c.peso !== undefined && c.peso !== null && Number(c.peso) > 0)
    .sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime());

  // Preparar pontos do gráfico
  const pontosGrafico = cronologicalConsultas.map((c) => ({
    data: new Date(c.data_consulta).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    peso: Number(c.peso),
    dataCompleta: c.data_consulta,
  }));

  const minPeso = pontosGrafico.length > 0 ? Math.min(...pontosGrafico.map((p) => p.peso)) - 2 : 50;
  const maxPeso = pontosGrafico.length > 0 ? Math.max(...pontosGrafico.map((p) => p.peso)) + 2 : 100;
  const amplitude = maxPeso - minPeso || 1;

  // Cálculo de evolução geral (primeira vs última)
  const primeiroPeso = pontosGrafico[0]?.peso || pesoInicial;
  const ultimoPeso = pontosGrafico[pontosGrafico.length - 1]?.peso || primeiroPeso;
  const diferencaPeso = primeiroPeso && ultimoPeso ? (ultimoPeso - primeiroPeso).toFixed(1) : null;

  const handleSalvarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!dataConsulta) {
      setErro('A data da consulta é obrigatória.');
      return;
    }

    if (!peso) {
      setErro('O peso atual em kg é obrigatório.');
      return;
    }

    setSalvando(true);
    try {
      const parsedPeso = parseFloat(peso.replace(',', '.'));
      const parsedCintura = cintura ? parseFloat(cintura.replace(',', '.')) : null;
      const parsedQuadril = quadril ? parseFloat(quadril.replace(',', '.')) : null;
      const parsedGordura = percentualGordura ? parseFloat(percentualGordura.replace(',', '.')) : null;

      const nova = await createConsulta({
        paciente_id: pacienteId,
        data_consulta: dataConsulta,
        peso: parsedPeso,
        cintura: parsedCintura,
        quadril: parsedQuadril,
        percentual_gordura: parsedGordura,
        observacoes: observacoes.trim() || null,
        proximo_retorno: proximoRetorno || null,
      });

      onConsultaCreated(nova);
      setModalOpen(false);
      // Reset form
      setPeso('');
      setCintura('');
      setQuadril('');
      setPercentualGordura('');
      setObservacoes('');
      setProximoRetorno('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar consulta.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-emerald-100 dark:border-slate-800 shadow-xs space-y-6">
      {/* Header and Nova Consulta Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Seção 2 — Consultas & Evolução</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800">
                {consultas.length} consulta(s)
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acompanhe o gráfico de peso corporal e o histórico clínico de atendimentos
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold px-4 h-9 text-xs shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Consulta</span>
        </Button>
      </div>

      {/* GRÁFICO DE EVOLUÇÃO DE PESO */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Gráfico de Evolução do Peso (kg)
            </h4>
            {diferencaPeso !== null && pontosGrafico.length > 1 && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  Number(diferencaPeso) < 0
                    ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {Number(diferencaPeso) < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                {diferencaPeso} kg total
              </span>
            )}
          </div>
        </div>

        {pontosGrafico.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Nenhuma consulta registrada ainda
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Cadastre a primeira consulta clicando no botão "Nova Consulta" para visualizar a linha de evolução.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
            {/* SVG Interactive Line Chart */}
            <div className="w-full overflow-x-auto">
              <div className="min-w-[320px] h-48 relative">
                <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
                  {/* Subtle Grid Lines */}
                  {[0.25, 0.5, 0.75, 1].map((pct, idx) => (
                    <line
                      key={idx}
                      x1="30"
                      y1={140 - pct * 110}
                      x2="480"
                      y2={140 - pct * 110}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-700"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* SVG Path line calculation */}
                  {(() => {
                    const stepX = (480 - 40) / Math.max(pontosGrafico.length - 1, 1);
                    const coords = pontosGrafico.map((pt, i) => {
                      const x = 40 + i * stepX;
                      const y = 140 - ((pt.peso - minPeso) / amplitude) * 110;
                      return { x, y, pt };
                    });

                    const dPath = coords.reduce(
                      (acc, cur, i) => (i === 0 ? `M ${cur.x} ${cur.y}` : `${acc} L ${cur.x} ${cur.y}`),
                      ''
                    );

                    const areaPath = `${dPath} L ${coords[coords.length - 1].x} 140 L ${coords[0].x} 140 Z`;

                    return (
                      <>
                        {/* Area gradient under line */}
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d={areaPath} fill="url(#chartGrad)" />

                        {/* Stroke Line */}
                        <path
                          d={dPath}
                          fill="none"
                          stroke="#059669"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Point Circles and Value Badges */}
                        {coords.map(({ x, y, pt }, idx) => (
                          <g key={idx} className="group cursor-pointer">
                            <circle
                              cx={x}
                              cy={y}
                              r="5"
                              className="fill-white stroke-emerald-600 stroke-[3] hover:r-7 transition-all"
                            />
                            {/* Value label */}
                            <text
                              x={x}
                              y={y - 10}
                              textAnchor="middle"
                              className="text-[10px] font-bold fill-slate-800 dark:fill-slate-100"
                            >
                              {pt.peso}kg
                            </text>
                            {/* Date label */}
                            <text
                              x={x}
                              y="155"
                              textAnchor="middle"
                              className="text-[9px] font-medium fill-slate-400"
                            >
                              {pt.data}
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LISTA DE CONSULTAS EM ORDEM CRONOLÓGICA DECRESCENTE */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Histórico de Consultas ({consultas.length})</span>
        </h4>

        {consultas.length === 0 ? (
          <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              Nenhuma consulta registrada para este paciente ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {consultas.map((c) => (
              <div
                key={c.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-emerald-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      {new Date(c.data_consulta).toLocaleDateString('pt-BR')}
                    </span>

                    {c.proximo_retorno && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold border border-teal-200/60 dark:border-teal-800">
                        Próximo retorno: {new Date(c.proximo_retorno).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>

                  {c.observacoes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {c.observacoes}
                    </p>
                  )}
                </div>

                {/* Metrics chips */}
                <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
                  {c.peso && (
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 rounded-xl font-bold border border-emerald-100 dark:border-emerald-800">
                      Peso: {c.peso} kg
                    </span>
                  )}
                  {c.cintura && (
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium">
                      Cintura: {c.cintura} cm
                    </span>
                  )}
                  {c.quadril && (
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium">
                      Quadril: {c.quadril} cm
                    </span>
                  )}
                  {c.percentual_gordura && (
                    <span className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 rounded-xl font-medium border border-teal-100 dark:border-teal-800">
                      Gordura: {c.percentual_gordura}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL NOVA CONSULTA */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-emerald-100 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Registrar Nova Consulta
                  </h4>
                  <p className="text-xs text-slate-500">
                    Insira as medições antropométricas e notas clínicas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erro && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleSalvarConsulta} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Data da Consulta *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataConsulta}
                    onChange={(e) => setDataConsulta(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Peso Atual (kg) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 72.4"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cintura (cm) <span className="font-normal text-slate-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 78"
                    value={cintura}
                    onChange={(e) => setCintura(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Quadril (cm) <span className="font-normal text-slate-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 98"
                    value={quadril}
                    onChange={(e) => setQuadril(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    % de Gordura <span className="font-normal text-slate-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 22.5"
                    value={percentualGordura}
                    onChange={(e) => setPercentualGordura(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Próximo Retorno
                  </label>
                  <input
                    type="date"
                    value={proximoRetorno}
                    onChange={(e) => setProximoRetorno(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Observações da Consulta
                </label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Evolução do paciente, adesão à dieta, queixas..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="text-xs h-9"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={salvando}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 font-bold"
                >
                  {salvando ? 'Salvando...' : 'Salvar consulta'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
