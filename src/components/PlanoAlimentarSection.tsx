import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  Clock,
  Utensils,
  PlusCircle,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Apple,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type Paciente,
  type PlanoAlimentar,
  type ConteudoPlanoAlimentar,
  type DiaPlano,
  fetchPlanosAlimentares,
  createPlanoAlimentar,
} from '@/lib/db';

interface PlanoAlimentarSectionProps {
  paciente: Paciente;
}

const DIAS_PADRAO = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

const REFEICOES_KEYS = [
  { key: 'cafe_da_manha', label: 'Café da Manhã', icon: Coffee, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  { key: 'lanche_manha', label: 'Lanche da Manhã', icon: Apple, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  { key: 'almoco', label: 'Almoço', icon: Sun, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40' },
  { key: 'lanche_tarde', label: 'Lanche da Tarde', icon: Sunset, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
  { key: 'jantar', label: 'Jantar', icon: Moon, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
] as const;

// Fallback manual structure builder
function buildEmptyPlanoManual(_paciente: Paciente): ConteudoPlanoAlimentar {
  return {
    plano_semanal: DIAS_PADRAO.map((dia) => ({
      dia,
      refeicoes: {
        cafe_da_manha: [
          'Ovos mexidos com azeite de oliva e orégano',
          'Pão 100% integral ou tapioca com queijo branco',
          'Mamão papaia com sementes de chia ou aveia',
          'Café preto ou chá sem açúcar adicionado',
          '1 copo de água (250ml)',
        ],
        lanche_manha: [
          '1 porção de frutas frescas (maçã, pera ou banana)',
          'Mix de castanhas do Pará e nozes (30g)',
          'Iogurte natural desnatado ou kefir',
          'Sementes de abóbora tostadas',
          '1 copo de água',
        ],
        almoco: [
          'Filé de frango grelhado ou peixe assado com ervas',
          'Arroz integral ou batata-doce cozida (3 a 4 colheres)',
          'Feijão carioca ou lentilha temperada (1 concha)',
          'Salada crua abundante: alface, rúcula, tomate e cenoura',
          'Azeite extravirgem (1 colher de sobremesa) e limão',
        ],
        lanche_tarde: [
          'Vitamina de frutas com leite desnatado ou vegetal',
          'Torradas integrais com pasta de amendoim integral',
          'Omelete de claras com espinafre',
          'Frutas secas com lascas de coco natural',
          'Água ou chá verde gelado',
        ],
        jantar: [
          'Sopa nutritiva de legumes com pedaços de carne magra',
          'Omelete recheado com legumes variados e queijo minas',
          'Salada de folhas verdes com atum sólido ao natural',
          'Purê de abóbora cabotiá com frango desfiado',
          'Chá de camomila ou melissa morno antes de dormir',
        ],
      },
    })),
  };
}

export const PlanoAlimentarSection: React.FC<PlanoAlimentarSectionProps> = ({ paciente }) => {
  const [historico, setHistorico] = useState<PlanoAlimentar[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);

  // Active generating / editing plan state
  const [planoAtual, setPlanoAtual] = useState<ConteudoPlanoAlimentar | null>(null);
  const [activeDiaIndex, setActiveDiaIndex] = useState(0);
  const [loadingIA, setLoadingIA] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [saving, setSaving] = useState(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Viewing an old plan from history
  const [visualizandoPlano, setVisualizandoPlano] = useState<PlanoAlimentar | null>(null);
  const [diaHistoricoIndex, setDiaHistoricoIndex] = useState(0);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 6000);
  };

  const carregarHistorico = async () => {
    setLoadingHistorico(true);
    try {
      const data = await fetchPlanosAlimentares(paciente.id);
      setHistorico(data);
    } catch (err) {
      console.error('Erro ao buscar planos alimentares:', err);
    } finally {
      setLoadingHistorico(false);
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, [paciente.id]);

  // Handle generation via IA
  const handleGerarComIA = async () => {
    setLoadingIA(true);
    setLoadingStep('Buscando dados e metas do paciente...');

    const stepTimer1 = setTimeout(() => {
      setLoadingStep('IA calculando macronutrientes e cardápio brasileiro...');
    }, 1800);

    const stepTimer2 = setTimeout(() => {
      setLoadingStep('Estruturando opções e ajustando restrições alimentares...');
    }, 4500);

    try {
      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paciente }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro no servidor ao contatar IA.');
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.plano_semanal) || data.plano_semanal.length === 0) {
        throw new Error('Formato retornado inválido pela IA.');
      }

      setPlanoAtual(data);
      setActiveDiaIndex(0);
      setVisualizandoPlano(null);
      showToast('✨ Plano alimentar gerado com sucesso pela IA! Você pode editá-lo antes de salvar.', 'success');
    } catch (err: unknown) {
      console.warn('Falha na IA:', err);
      showToast(
        'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?',
        'warning'
      );
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoadingIA(false);
      setLoadingStep('');
    }
  };

  // Generate manual default plan
  const handleCriarPlanoManual = () => {
    const planoManual = buildEmptyPlanoManual(paciente);
    setPlanoAtual(planoManual);
    setActiveDiaIndex(0);
    setVisualizandoPlano(null);
    showToast('Plano manual criado! Preencha ou personalize as opções das refeições.', 'success');
  };

  // Update specific meal option input in editing mode
  const handleOptionChange = (
    diaIdx: number,
    refeicaoKey: keyof DiaPlano['refeicoes'],
    optionIdx: number,
    value: string
  ) => {
    if (!planoAtual) return;
    const novoPlano = { ...planoAtual };
    const dias = [...novoPlano.plano_semanal];
    const diaAlvo = { ...dias[diaIdx] };
    const refeicoes = { ...diaAlvo.refeicoes };
    const opcoes = [...refeicoes[refeicaoKey]];

    opcoes[optionIdx] = value;
    refeicoes[refeicaoKey] = opcoes;
    diaAlvo.refeicoes = refeicoes;
    dias[diaIdx] = diaAlvo;
    novoPlano.plano_semanal = dias;

    setPlanoAtual(novoPlano);
  };

  // Save current plan into PostgreSQL
  const handleSalvarPlano = async () => {
    if (!planoAtual) return;
    setSaving(true);
    try {
      await createPlanoAlimentar(paciente.id, planoAtual);
      showToast('Plano alimentar salvo com sucesso no histórico do paciente!', 'success');
      setPlanoAtual(null);
      await carregarHistorico();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar no banco de dados.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const diaAtivo = planoAtual?.plano_semanal[activeDiaIndex];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-emerald-100 dark:border-slate-800 shadow-xs space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between gap-3 animate-in fade-in duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span className="font-medium">{toastMessage.text}</span>
          </div>

          {toastMessage.type === 'warning' && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleGerarComIA}
                className="text-xs h-7 border-amber-300 text-amber-900 hover:bg-amber-100"
              >
                Tentar novamente
              </Button>
              <Button
                size="sm"
                onClick={handleCriarPlanoManual}
                className="text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Plano Manual
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Planos Alimentares Semanais</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800">
                IA & Personalizado
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gere cardápios automatizados com IA adaptados aos objetivos de {paciente.nome}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCriarPlanoManual}
            disabled={loadingIA || saving}
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 h-9 px-3 text-xs font-semibold gap-1.5 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Plano Manual</span>
            <span className="sm:hidden">Manual</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleGerarComIA}
            disabled={loadingIA || saving}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-9 px-4 text-xs font-bold gap-2 shadow-md shadow-emerald-600/20 cursor-pointer shrink-0"
          >
            {loadingIA ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
            )}
            <span>{loadingIA ? 'Gerando...' : '✨ Gerar Plano com IA'}</span>
          </Button>
        </div>
      </div>

      {/* Loading state visual indicator */}
      {loadingIA && (
        <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-50 dark:from-slate-900 dark:to-emerald-950/30 border border-emerald-200/80 text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30 animate-bounce">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-emerald-950 dark:text-emerald-200">
              Gerando Plano Alimentar com Inteligência Artificial
            </h4>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400 mt-1 font-medium animate-pulse">
              {loadingStep || 'Processando perfil clínico...'}
            </p>
          </div>
        </div>
      )}

      {/* ACTIVE PLAN EDITOR INTERFACE */}
      {planoAtual && !loadingIA && (
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10 p-5 space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Plano em Edição (Não salvo)
              </span>
              <h4 className="text-base font-bold text-slate-800 dark:text-white">
                Personalize as 5 opções de cada refeição antes de salvar
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPlanoAtual(null)}
                className="h-9 px-3 text-xs border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Descartar
              </Button>

              <Button
                size="sm"
                onClick={handleSalvarPlano}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 text-xs font-bold gap-2 shadow-sm cursor-pointer"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Salvar Plano Alimentar</span>
              </Button>
            </div>
          </div>

          {/* Day of Week Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            {planoAtual.plano_semanal.map((diaItem, idx) => (
              <button
                key={diaItem.dia}
                type="button"
                onClick={() => setActiveDiaIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeDiaIndex === idx
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {diaItem.dia}
              </button>
            ))}
          </div>

          {/* Meals of active day */}
          {diaAtivo && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Cardápio para {diaAtivo.dia}</span>
                </h5>
                <span className="text-[11px] text-slate-400">
                  5 opções por refeição • Totalmente editável
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {REFEICOES_KEYS.map(({ key, label, icon: MealIcon, color }) => {
                  const options = diaAtivo.refeicoes[key] || [];
                  return (
                    <div
                      key={key}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${color}`}>
                          <MealIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-white">
                          {label}
                        </span>
                      </div>

                      {/* 5 editable input options */}
                      <div className="space-y-2">
                        {[0, 1, 2, 3, 4].map((optIdx) => (
                          <div key={optIdx} className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700/60 dark:text-emerald-400/60 select-none">
                              {optIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={options[optIdx] || ''}
                              onChange={(e) =>
                                handleOptionChange(activeDiaIndex, key, optIdx, e.target.value)
                              }
                              placeholder={`Opção ${optIdx + 1}...`}
                              className="w-full pl-6 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEWING PREVIOUS PLAN FROM HISTORY */}
      {visualizandoPlano && !planoAtual && (
        <div className="rounded-2xl border border-teal-200 dark:border-slate-700 bg-teal-50/20 dark:bg-slate-800/40 p-5 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-teal-100 dark:border-slate-700">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Visualizando Plano do Histórico
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Salvo em {visualizandoPlano.created_at}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisualizandoPlano(null)}
              className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Fechar Visualização
            </Button>
          </div>

          {/* Days tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {visualizandoPlano.conteudo.plano_semanal.map((diaItem, idx) => (
              <button
                key={diaItem.dia}
                type="button"
                onClick={() => setDiaHistoricoIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  diaHistoricoIndex === idx
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {diaItem.dia}
              </button>
            ))}
          </div>

          {/* Meals of active historic day */}
          {visualizandoPlano.conteudo.plano_semanal[diaHistoricoIndex] && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {REFEICOES_KEYS.map(({ key, label, icon: MealIcon, color }) => {
                const options =
                  visualizandoPlano.conteudo.plano_semanal[diaHistoricoIndex].refeicoes[key] || [];
                return (
                  <div
                    key={key}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${color}`}>
                        <MealIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        {label}
                      </span>
                    </div>

                    <ul className="space-y-1.5">
                      {options.map((opt, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800"
                        >
                          <span className="font-bold text-emerald-600 text-[10px] shrink-0 mt-0.5">
                            {i + 1}.
                          </span>
                          <span>{opt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PLANOS ALIMENTARES HISTORY LIST */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Histórico de Planos Gerados ({historico.length})</span>
        </h4>

        {loadingHistorico ? (
          <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Carregando histórico de planos...</p>
          </div>
        ) : historico.length === 0 ? (
          <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Nenhum plano alimentar gerado para este paciente ainda.
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Clique em <strong>"✨ Gerar Plano com IA"</strong> acima para criar o primeiro cardápio semanal completo.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800/60 shadow-xs">
            {historico.map((item, index) => {
              const totalDias = item.conteudo?.plano_semanal?.length || 0;
              const isSelected = visualizandoPlano?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    isSelected ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                      #{historico.length - index}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        Plano Alimentar Semanal ({totalDias} dias)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Gerado e salvo em {item.created_at}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (isSelected) {
                          setVisualizandoPlano(null);
                        } else {
                          setVisualizandoPlano(item);
                          setDiaHistoricoIndex(0);
                        }
                      }}
                      className="h-8 px-3 text-xs border-emerald-200 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      {isSelected ? 'Ocultar' : 'Visualizar'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
