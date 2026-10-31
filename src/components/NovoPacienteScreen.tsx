import React, { useState } from 'react';
import {
  User,
  HeartPulse,
  Coffee,
  Check,
  ArrowRight,
  ArrowLeft,
  Save,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPaciente, updatePaciente, getOrCreateNutricionistaId, type Paciente } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';

interface NovoPacienteScreenProps {
  onCancel: () => void;
  onSuccess: (pacienteId: string) => void;
  pacienteToEdit?: Paciente | null;
}

// Predefined choices as requested in prompt 4
const OBJETIVOS_OPCOES = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
];

const NIVEIS_ATIVIDADE = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo',
];

const PATOLOGIAS_OPCOES = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
];

const RESTRICOES_OPCOES = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
];

const ALERGIAS_OPCOES = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
];

// Helper to format telephone/whatsapp
function formatPhoneNumber(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// Helper to convert time input like "6" -> "06:00", "630" -> "06:30", "2230" -> "22:30"
function formatTimeInput(input: string): string {
  const clean = input.replace(/\D/g, '').slice(0, 4);
  if (!clean) return '';
  if (clean.length === 1 || clean.length === 2) {
    let hour = parseInt(clean, 10);
    if (hour > 23) hour = 23;
    return `${hour.toString().padStart(2, '0')}:00`;
  }
  if (clean.length === 3) {
    let hour = parseInt(clean.slice(0, 1), 10);
    let min = parseInt(clean.slice(1), 10);
    if (min > 59) min = 59;
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  }
  let hour = parseInt(clean.slice(0, 2), 10);
  let min = parseInt(clean.slice(2, 4), 10);
  if (hour > 23) hour = 23;
  if (min > 59) min = 59;
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

// Helper to calculate age from birthdate
function calculateAge(dateStr: string): number | null {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export const NovoPacienteScreen: React.FC<NovoPacienteScreenProps> = ({
  onCancel,
  onSuccess,
  pacienteToEdit,
}) => {
  const { user } = useAuth();
  const isEditing = Boolean(pacienteToEdit);
  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');

  // Format initial height (if e.g. 1.75m, display as 175cm)
  const initialAltura = React.useMemo(() => {
    if (!pacienteToEdit?.altura) return '';
    const h = Number(pacienteToEdit.altura);
    return h <= 3 ? (h * 100).toFixed(0) : h.toString();
  }, [pacienteToEdit]);

  // Aba 1 — Pessoal
  const [nome, setNome] = useState(pacienteToEdit?.nome || '');
  const [dataNascimento, setDataNascimento] = useState(() => {
    if (!pacienteToEdit?.data_nascimento) return '';
    try {
      const val = pacienteToEdit.data_nascimento as unknown;
      if (typeof val === 'string') {
        return val.slice(0, 10);
      }
      if (val instanceof Date) {
        return val.toISOString().slice(0, 10);
      }
      return String(val).slice(0, 10);
    } catch {
      return '';
    }
  });
  const [sexo, setSexo] = useState<'Feminino' | 'Masculino' | 'Outro' | ''>(
    (pacienteToEdit?.sexo as 'Feminino' | 'Masculino' | 'Outro') || ''
  );
  const [telefone, setTelefone] = useState(pacienteToEdit?.whatsapp || '');
  const [whatsapp, setWhatsapp] = useState(pacienteToEdit?.whatsapp || '');
  const [email, setEmail] = useState(pacienteToEdit?.email || '');

  // Aba 2 — Clínico
  const [pesoKg, setPesoKg] = useState<string>(
    pacienteToEdit?.peso_inicial !== undefined && pacienteToEdit?.peso_inicial !== null
      ? pacienteToEdit.peso_inicial.toString()
      : ''
  );
  const [alturaCm, setAlturaCm] = useState<string>(initialAltura);
  const [objetivos, setObjetivos] = useState<string[]>(pacienteToEdit?.objetivos || []);
  const [objetivoTexto, setObjetivoTexto] = useState(pacienteToEdit?.objetivo_texto || '');
  const [nivelAtividade, setNivelAtividade] = useState(
    pacienteToEdit?.nivel_atividade || 'Sedentário'
  );

  const [patologias, setPatologias] = useState<string[]>(pacienteToEdit?.patologias || []);
  const [customPatologia, setCustomPatologia] = useState('');

  const [restricoes, setRestricoes] = useState<string[]>(pacienteToEdit?.restricoes_alimentares || []);
  const [customRestricao, setCustomRestricao] = useState('');

  const [alergias, setAlergias] = useState<string[]>(pacienteToEdit?.alergias || []);
  const [customAlergia, setCustomAlergia] = useState('');

  const [medicamentos, setMedicamentos] = useState(pacienteToEdit?.medicamentos || '');
  const [suplementos, setSuplementos] = useState(pacienteToEdit?.suplementos || '');

  // Aba 3 — Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState<string>(
    pacienteToEdit?.refeicoes_por_dia !== undefined && pacienteToEdit?.refeicoes_por_dia !== null
      ? pacienteToEdit.refeicoes_por_dia.toString()
      : ''
  );
  const [horarioAcordaInput, setHorarioAcordaInput] = useState(pacienteToEdit?.horario_acorda || '');
  const [horarioDormeInput, setHorarioDormeInput] = useState(pacienteToEdit?.horario_dorme || '');
  const [litrosAgua, setLitrosAgua] = useState<string>(
    pacienteToEdit?.litros_agua !== undefined && pacienteToEdit?.litros_agua !== null
      ? pacienteToEdit.litros_agua.toString()
      : ''
  );
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState(
    Boolean(pacienteToEdit?.atividade_fisica)
  );
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState(
    pacienteToEdit?.atividade_fisica_descricao || ''
  );
  const [observacoes, setObservacoes] = useState(pacienteToEdit?.observacoes || '');

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculated age
  const calculatedAge = calculateAge(dataNascimento);

  // Auto-calculated IMC: weight (kg) / (height in meters)^2
  const imcValue = React.useMemo(() => {
    const p = parseFloat(pesoKg.replace(',', '.'));
    const a = parseFloat(alturaCm.replace(',', '.'));
    if (!p || !a || a <= 0) return null;
    const heightMeters = a > 3 ? a / 100 : a; // converts cm to m if needed
    const imc = p / (heightMeters * heightMeters);
    return isFinite(imc) ? imc.toFixed(1) : null;
  }, [pesoKg, alturaCm]);

  const getImcClassification = (imc: number) => {
    if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-amber-600 bg-amber-50' };
    if (imc < 24.9) return { label: 'Peso adequado', color: 'text-emerald-700 bg-emerald-50' };
    if (imc < 29.9) return { label: 'Sobrepeso', color: 'text-amber-700 bg-amber-50' };
    if (imc < 34.9) return { label: 'Obesidade Grau I', color: 'text-rose-600 bg-rose-50' };
    return { label: 'Obesidade Grau II/III', color: 'text-rose-700 bg-rose-100' };
  };

  // Toggle multi-select with "Nenhum" handling
  const toggleSelection = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (item === 'Nenhum') {
      if (list.includes('Nenhum')) {
        setList([]);
      } else {
        setList(['Nenhum']);
      }
      return;
    }

    const filtered = list.filter((i) => i !== 'Nenhum');
    if (filtered.includes(item)) {
      setList(filtered.filter((i) => i !== item));
    } else {
      setList([...filtered, item]);
    }
  };

  const handleAddCustomItem = (
    value: string,
    setValue: (val: string) => void,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const filtered = list.filter((i) => i !== 'Nenhum');
    if (!filtered.includes(trimmed)) {
      setList([...filtered, trimmed]);
    }
    setValue('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError('O campo Nome completo é obrigatório.');
      setActiveTab('pessoal');
      return;
    }

    if (!user) {
      setError('Usuário não autenticado.');
      return;
    }

    setSubmitting(true);
    try {
      const nutriId = await getOrCreateNutricionistaId(user.id, user.email, user.name);

      const parsedPeso = pesoKg ? parseFloat(pesoKg.replace(',', '.')) : null;
      let parsedAltura = alturaCm ? parseFloat(alturaCm.replace(',', '.')) : null;
      if (parsedAltura && parsedAltura > 3) {
        // Convert cm to meters for storage (e.g. 175cm -> 1.75m)
        parsedAltura = parseFloat((parsedAltura / 100).toFixed(2));
      }
      const parsedLitros = litrosAgua ? parseFloat(litrosAgua.replace(',', '.')) : null;
      const parsedRefeicoes = refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null;

      let savedId: string;

      if (isEditing && pacienteToEdit) {
        const updated = await updatePaciente(pacienteToEdit.id, nutriId, {
          nome: nome.trim(),
          data_nascimento: dataNascimento || null,
          sexo: sexo || null,
          whatsapp: whatsapp ? whatsapp.trim() : (telefone ? telefone.trim() : null),
          email: email ? email.trim() : null,
          peso_inicial: parsedPeso,
          altura: parsedAltura,
          objetivos: objetivos.length > 0 ? objetivos : null,
          objetivo_texto: objetivoTexto ? objetivoTexto.trim() : null,
          nivel_atividade: nivelAtividade || null,
          patologias: patologias.length > 0 ? patologias : null,
          restricoes_alimentares: restricoes.length > 0 ? restricoes : null,
          alergias: alergias.length > 0 ? alergias : null,
          medicamentos: medicamentos ? medicamentos.trim() : null,
          suplementos: suplementos ? suplementos.trim() : null,
          refeicoes_por_dia: parsedRefeicoes,
          horario_acorda: horarioAcordaInput ? formatTimeInput(horarioAcordaInput) : null,
          horario_dorme: horarioDormeInput ? formatTimeInput(horarioDormeInput) : null,
          litros_agua: parsedLitros,
          atividade_fisica: praticaAtividadeFisica,
          atividade_fisica_descricao: praticaAtividadeFisica ? atividadeFisicaDescricao.trim() : null,
          observacoes: observacoes ? observacoes.trim() : null,
        });
        savedId = updated.id;
      } else {
        const created = await createPaciente({
          nutricionista_id: nutriId,
          nome: nome.trim(),
          data_nascimento: dataNascimento || null,
          sexo: sexo || null,
          whatsapp: whatsapp ? whatsapp.trim() : (telefone ? telefone.trim() : null),
          email: email ? email.trim() : null,
          peso_inicial: parsedPeso,
          altura: parsedAltura,
          objetivos: objetivos.length > 0 ? objetivos : null,
          objetivo_texto: objetivoTexto ? objetivoTexto.trim() : null,
          nivel_atividade: nivelAtividade || null,
          patologias: patologias.length > 0 ? patologias : null,
          restricoes_alimentares: restricoes.length > 0 ? restricoes : null,
          alergias: alergias.length > 0 ? alergias : null,
          medicamentos: medicamentos ? medicamentos.trim() : null,
          suplementos: suplementos ? suplementos.trim() : null,
          refeicoes_por_dia: parsedRefeicoes,
          horario_acorda: horarioAcordaInput ? formatTimeInput(horarioAcordaInput) : null,
          horario_dorme: horarioDormeInput ? formatTimeInput(horarioDormeInput) : null,
          litros_agua: parsedLitros,
          atividade_fisica: praticaAtividadeFisica,
          atividade_fisica_descricao: praticaAtividadeFisica ? atividadeFisicaDescricao.trim() : null,
          observacoes: observacoes ? observacoes.trim() : null,
        });
        savedId = created.id;
      }

      onSuccess(savedId);
    } catch (err: unknown) {
      console.error('Erro ao salvar paciente:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Falha ao salvar paciente. Verifique os dados e tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70 dark:bg-slate-950 overflow-y-auto">
      {/* Top Header Bar */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-emerald-100/70 dark:border-slate-800 px-4 sm:px-8 py-3.5 sm:py-4 sticky top-0 z-20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="border-emerald-200 dark:border-slate-700 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer gap-1 sm:gap-2 h-8 sm:h-9 px-2.5 sm:px-3 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
              <span>{isEditing ? 'Editar' : 'Novo Paciente'}</span>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800 shrink-0">
                {isEditing ? 'Atualizar' : 'Cadastro'}
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate hidden sm:block">
              {isEditing
                ? 'Atualize as informações do paciente nas 3 etapas'
                : 'Preencha os dados organizados em 3 etapas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="hidden sm:inline-flex border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 h-8 sm:h-9 text-xs"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 sm:gap-2 font-semibold shadow-sm cursor-pointer h-8 sm:h-9 px-3 text-xs sm:text-sm"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6">
        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Navigation Controls */}
        <div className="bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-2xl border border-emerald-100 dark:border-slate-800 shadow-xs flex items-center justify-between gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('pessoal')}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2.5 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'pessoal'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50/60 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0" />
            <span className="truncate">1. Pessoal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clinico')}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2.5 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'clinico'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50/60 dark:hover:bg-slate-800'
            }`}
          >
            <HeartPulse className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0" />
            <span className="truncate">2. Clínico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('habitos')}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2.5 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'habitos'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50/60 dark:hover:bg-slate-800'
            }`}
          >
            <Coffee className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0" />
            <span className="truncate">3. Hábitos</span>
          </button>
        </div>

        {/* Tab 1: Pessoal */}
        {activeTab === 'pessoal' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-emerald-100 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Dados Pessoais</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identificação e canais de contato com o paciente
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nome Completo (Obrigatório) */}
              <div className="md:col-span-2 space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Data de Nascimento & Idade Calculada */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Data de Nascimento
                  </label>
                  {calculatedAge !== null && (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {calculatedAge} anos
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Sexo */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Sexo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Feminino', 'Masculino', 'Outro'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSexo(s)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        sexo === s
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telefone */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Telefone
                </label>
                <input
                  type="text"
                  placeholder="(11) 3456-7890"
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhoneNumber(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatPhoneNumber(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2 space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="paciente@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                onClick={() => setActiveTab('clinico')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer font-semibold"
              >
                <span>Avançar para Clínico</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Clínico */}
        {activeTab === 'clinico' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-emerald-100 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Avaliação Clínica e Antropométrica</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Medidas iniciais, condições de saúde, restrições e objetivos
              </p>
            </div>

            {/* Antropometria & IMC */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              {/* Peso em kg */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Peso atual
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="75.5"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(e.target.value)}
                    className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    kg
                  </span>
                </div>
              </div>

              {/* Altura em cm */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Altura
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    placeholder="175"
                    value={alturaCm}
                    onChange={(e) => setAlturaCm(e.target.value)}
                    className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    cm
                  </span>
                </div>
              </div>

              {/* IMC Calculado (somente leitura) */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  IMC (Automático)
                </label>
                <div className="h-[42px] px-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-800">
                    {imcValue ? `${imcValue} kg/m²` : '—'}
                  </span>
                  {imcValue && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getImcClassification(parseFloat(imcValue)).color}`}>
                      {getImcClassification(parseFloat(imcValue)).label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Objetivos */}
            <div className="space-y-3 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Objetivos do Paciente (Múltipla escolha)
              </label>
              <div className="flex flex-wrap gap-2">
                {OBJETIVOS_OPCOES.map((obj) => {
                  const selected = objetivos.includes(obj);
                  return (
                    <button
                      key={obj}
                      type="button"
                      onClick={() =>
                        setObjetivos((prev) =>
                          prev.includes(obj) ? prev.filter((o) => o !== obj) : [...prev, obj]
                        )
                      }
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                        selected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5" />}
                      <span>{obj}</span>
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                placeholder="Detalhes ou objetivos adicionais (texto livre)..."
                value={objetivoTexto}
                onChange={(e) => setObjetivoTexto(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 mt-2"
              />
            </div>

            {/* Nível de Atividade Física */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Nível de Atividade Física (Seleção única)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {NIVEIS_ATIVIDADE.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setNivelAtividade(lvl)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                      nivelAtividade === lvl
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Patologias ou Condições */}
            <div className="space-y-2.5 text-left pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Patologias ou Condições de Saúde
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleSelection(patologias, setPatologias, 'Nenhum')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    patologias.includes('Nenhum')
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  Nenhum
                </button>
                {PATOLOGIAS_OPCOES.map((pat) => {
                  const sel = patologias.includes(pat);
                  return (
                    <button
                      key={pat}
                      type="button"
                      onClick={() => toggleSelection(patologias, setPatologias, pat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        sel
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sel && <Check className="w-3 h-3" />}
                      <span>{pat}</span>
                    </button>
                  );
                })}
                {/* Custom tags */}
                {patologias
                  .filter((p) => p !== 'Nenhum' && !PATOLOGIAS_OPCOES.includes(p))
                  .map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"
                    >
                      {p}
                      <button
                        type="button"
                        onClick={() => setPatologias((prev) => prev.filter((item) => item !== p))}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>

              {/* Add custom patologia */}
              <div className="flex gap-2 max-w-sm mt-1">
                <input
                  type="text"
                  placeholder="Adicionar outra patologia..."
                  value={customPatologia}
                  onChange={(e) => setCustomPatologia(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomItem(customPatologia, setCustomPatologia, patologias, setPatologias);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddCustomItem(customPatologia, setCustomPatologia, patologias, setPatologias)}
                  className="h-8 px-2.5 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                </Button>
              </div>
            </div>

            {/* Restrições Alimentares */}
            <div className="space-y-2.5 text-left pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Restrições Alimentares
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleSelection(restricoes, setRestricoes, 'Nenhum')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    restricoes.includes('Nenhum')
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  Nenhum
                </button>
                {RESTRICOES_OPCOES.map((res) => {
                  const sel = restricoes.includes(res);
                  return (
                    <button
                      key={res}
                      type="button"
                      onClick={() => toggleSelection(restricoes, setRestricoes, res)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        sel
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sel && <Check className="w-3 h-3" />}
                      <span>{res}</span>
                    </button>
                  );
                })}
                {restricoes
                  .filter((r) => r !== 'Nenhum' && !RESTRICOES_OPCOES.includes(r))
                  .map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"
                    >
                      {r}
                      <button
                        type="button"
                        onClick={() => setRestricoes((prev) => prev.filter((item) => item !== r))}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>

              <div className="flex gap-2 max-w-sm mt-1">
                <input
                  type="text"
                  placeholder="Adicionar outra restrição..."
                  value={customRestricao}
                  onChange={(e) => setCustomRestricao(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomItem(customRestricao, setCustomRestricao, restricoes, setRestricoes);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddCustomItem(customRestricao, setCustomRestricao, restricoes, setRestricoes)}
                  className="h-8 px-2.5 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                </Button>
              </div>
            </div>

            {/* Alergias Alimentares */}
            <div className="space-y-2.5 text-left pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Alergias Alimentares
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleSelection(alergias, setAlergias, 'Nenhum')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    alergias.includes('Nenhum')
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  Nenhum
                </button>
                {ALERGIAS_OPCOES.map((ale) => {
                  const sel = alergias.includes(ale);
                  return (
                    <button
                      key={ale}
                      type="button"
                      onClick={() => toggleSelection(alergias, setAlergias, ale)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        sel
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sel && <Check className="w-3 h-3" />}
                      <span>{ale}</span>
                    </button>
                  );
                })}
                {alergias
                  .filter((a) => a !== 'Nenhum' && !ALERGIAS_OPCOES.includes(a))
                  .map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"
                    >
                      {a}
                      <button
                        type="button"
                        onClick={() => setAlergias((prev) => prev.filter((item) => item !== a))}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>

              <div className="flex gap-2 max-w-sm mt-1">
                <input
                  type="text"
                  placeholder="Adicionar outra alergia..."
                  value={customAlergia}
                  onChange={(e) => setCustomAlergia(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomItem(customAlergia, setCustomAlergia, alergias, setAlergias);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddCustomItem(customAlergia, setCustomAlergia, alergias, setAlergias)}
                  className="h-8 px-2.5 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                </Button>
              </div>
            </div>

            {/* Medicamentos & Suplementos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Medicamentos contínuos
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Levotiroxina 50mcg em jejum..."
                  value={medicamentos}
                  onChange={(e) => setMedicamentos(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Suplementos em uso
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Whey protein, Creatina 5g, Vitamina D..."
                  value={suplementos}
                  onChange={(e) => setSuplementos(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('pessoal')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para Pessoal</span>
              </Button>
              <Button
                type="button"
                onClick={() => setActiveTab('habitos')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold"
              >
                <span>Avançar para Hábitos</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Hábitos */}
        {activeTab === 'habitos' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-emerald-100 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Rotina diária e Estilo de Vida</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Horários de sono, hidratação, refeições e atividade física
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {/* Quantas refeições por dia */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Refeições / dia
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="Ex: 4"
                  value={refeicoesPorDia}
                  onChange={(e) => setRefeicoesPorDia(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Horário que acorda */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Acorda
                  </label>
                  {horarioAcordaInput && (
                    <span className="text-[11px] font-bold text-emerald-700">
                      {formatTimeInput(horarioAcordaInput)}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Ex: 6 ou 630"
                  value={horarioAcordaInput}
                  onChange={(e) => setHorarioAcordaInput(e.target.value)}
                  onBlur={() => {
                    if (horarioAcordaInput) {
                      setHorarioAcordaInput(formatTimeInput(horarioAcordaInput));
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[10px] text-slate-400">Ex: 6 → 06:00, 630 → 06:30</p>
              </div>

              {/* Horário que dorme */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Dorme
                  </label>
                  {horarioDormeInput && (
                    <span className="text-[11px] font-bold text-emerald-700">
                      {formatTimeInput(horarioDormeInput)}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Ex: 23 ou 2230"
                  value={horarioDormeInput}
                  onChange={(e) => setHorarioDormeInput(e.target.value)}
                  onBlur={() => {
                    if (horarioDormeInput) {
                      setHorarioDormeInput(formatTimeInput(horarioDormeInput));
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[10px] text-slate-400">Ex: 23 → 23:00, 2230 → 22:30</p>
              </div>

              {/* Quantidade de água por dia */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Água por dia
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="2.5"
                    value={litrosAgua}
                    onChange={(e) => setLitrosAgua(e.target.value)}
                    className="w-full pl-4 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    litros
                  </span>
                </div>
              </div>
            </div>

            {/* Pratica Atividade Física */}
            <div className="space-y-3 text-left pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Pratica atividade física?
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPraticaAtividadeFisica(true)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    praticaAtividadeFisica
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPraticaAtividadeFisica(false);
                    setAtividadeFisicaDescricao('');
                  }}
                  className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    !praticaAtividadeFisica
                      ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Não
                </button>
              </div>

              {praticaAtividadeFisica && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-semibold text-slate-600">
                    Qual atividade e frequência semanal?
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Musculação 4x na semana + corrida aos domingos"
                    value={atividadeFisicaDescricao}
                    onChange={(e) => setAtividadeFisicaDescricao(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              )}
            </div>

            {/* Observações gerais */}
            <div className="space-y-1.5 text-left pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Observações gerais (texto livre)
              </label>
              <textarea
                rows={3}
                placeholder="Anotações livres sobre histórico familiar, preferências de paladar, rotina de trabalho..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('clinico')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para Clínico</span>
              </Button>

              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold px-6 h-11 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar e Cadastrar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
