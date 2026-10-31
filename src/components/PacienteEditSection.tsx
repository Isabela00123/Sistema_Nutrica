import React, { useState } from 'react';
import {
  User,
  HeartPulse,
  Coffee,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updatePaciente, type Paciente } from '@/lib/db';

interface PacienteEditSectionProps {
  paciente: Paciente;
  onPatientUpdated: (updated: Paciente) => void;
}

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
  'Frutos do mar',
  'Ovo',
  'Leite',
  'Soja',
  'Nozes',
];

export const PacienteEditSection: React.FC<PacienteEditSectionProps> = ({
  paciente,
  onPatientUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');

  // Aba 1 - Pessoal
  const [nome, setNome] = useState(paciente.nome || '');
  const [dataNascimento, setDataNascimento] = useState(paciente.data_nascimento || '');
  const [sexo, setSexo] = useState(paciente.sexo || '');
  const [whatsapp, setWhatsapp] = useState(paciente.whatsapp || '');
  const [email, setEmail] = useState(paciente.email || '');

  // Aba 2 - Clínico
  const [pesoInicial, setPesoInicial] = useState(
    paciente.peso_inicial !== undefined && paciente.peso_inicial !== null
      ? paciente.peso_inicial.toString()
      : ''
  );
  const [altura, setAltura] = useState(
    paciente.altura !== undefined && paciente.altura !== null
      ? paciente.altura.toString()
      : ''
  );
  const [objetivos, setObjetivos] = useState<string[]>(paciente.objetivos || []);
  const [objetivoTexto, setObjetivoTexto] = useState(paciente.objetivo_texto || '');
  const [nivelAtividade, setNivelAtividade] = useState(paciente.nivel_atividade || '');
  const [patologias, setPatologias] = useState<string[]>(paciente.patologias || []);
  const [restricoes, setRestricoes] = useState<string[]>(paciente.restricoes_alimentares || []);
  const [alergias, setAlergias] = useState<string[]>(paciente.alergias || []);
  const [medicamentos, setMedicamentos] = useState(paciente.medicamentos || '');
  const [suplementos, setSuplementos] = useState(paciente.suplementos || '');

  // Aba 3 - Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState(
    paciente.refeicoes_por_dia !== undefined && paciente.refeicoes_por_dia !== null
      ? paciente.refeicoes_por_dia.toString()
      : ''
  );
  const [horarioAcorda, setHorarioAcorda] = useState(paciente.horario_acorda || '');
  const [horarioDorme, setHorarioDorme] = useState(paciente.horario_dorme || '');
  const [litrosAgua, setLitrosAgua] = useState(
    paciente.litros_agua !== undefined && paciente.litros_agua !== null
      ? paciente.litros_agua.toString()
      : ''
  );
  const [atividadeFisica, setAtividadeFisica] = useState(Boolean(paciente.atividade_fisica));
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState(
    paciente.atividade_fisica_descricao || ''
  );
  const [observacoes, setObservacoes] = useState(paciente.observacoes || '');

  // Custom inputs additions
  const [customPatologia, setCustomPatologia] = useState('');

  // Status
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const toggleArrayItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSalvar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErro(null);
    setMensagemSucesso(null);

    if (!nome.trim()) {
      setErro('O nome do paciente é obrigatório.');
      return;
    }

    setSalvando(true);
    try {
      const parsedPeso = pesoInicial ? parseFloat(pesoInicial.replace(',', '.')) : null;
      const parsedAltura = altura ? parseFloat(altura.replace(',', '.')) : null;
      const parsedLitros = litrosAgua ? parseFloat(litrosAgua.replace(',', '.')) : null;
      const parsedRefeicoes = refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null;

      const updated = await updatePaciente(paciente.id, paciente.nutricionista_id, {
        nome: nome.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        whatsapp: whatsapp ? whatsapp.trim() : null,
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
        horario_acorda: horarioAcorda || null,
        horario_dorme: horarioDorme || null,
        litros_agua: parsedLitros,
        atividade_fisica: atividadeFisica,
        atividade_fisica_descricao: atividadeFisica ? atividadeFisicaDescricao.trim() : null,
        observacoes: observacoes ? observacoes.trim() : null,
      });

      setMensagemSucesso('Dados do paciente atualizados com sucesso!');
      onPatientUpdated(updated);
      setTimeout(() => setMensagemSucesso(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar alterações.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-emerald-100 dark:border-slate-800 shadow-xs space-y-6">
      {/* Feedback Messages */}
      {mensagemSucesso && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-3 animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{mensagemSucesso}</span>
        </div>
      )}

      {erro && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3 animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{erro}</span>
        </div>
      )}

      {/* Header and Save Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Seção 1 — Dados do Paciente
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize e edite as informações cadastrais do paciente organizadas nas 3 abas
          </p>
        </div>

        <Button
          type="button"
          onClick={() => handleSalvar()}
          disabled={salvando}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-xs cursor-pointer h-9 px-4 text-xs"
        >
          {salvando ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Salvar alterações</span>
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('pessoal')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'pessoal'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Pessoal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinico')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'clinico'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Clínico</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('habitos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'habitos'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>Hábitos</span>
        </button>
      </div>

      {/* Form Content */}
      <div className="space-y-6 pt-2">
        {/* ABA 1: PESSOAL */}
        {activeTab === 'pessoal' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nome Completo *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Sexo Biológico
              </label>
              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Selecione...</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                WhatsApp / Celular
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="paciente@exemplo.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* ABA 2: CLÍNICO */}
        {activeTab === 'clinico' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Peso Inicial (kg)
                </label>
                <input
                  type="text"
                  value={pesoInicial}
                  onChange={(e) => setPesoInicial(e.target.value)}
                  placeholder="Ex: 70.5"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Altura (m ou cm)
                </label>
                <input
                  type="text"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  placeholder="Ex: 1.75"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nível de Atividade
                </label>
                <select
                  value={nivelAtividade}
                  onChange={(e) => setNivelAtividade(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Selecione...</option>
                  {NIVEIS_ATIVIDADE.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Objetivos */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Objetivos Clínicos
              </label>
              <div className="flex flex-wrap gap-2">
                {OBJETIVOS_OPCOES.map((obj) => (
                  <button
                    key={obj}
                    type="button"
                    onClick={() => toggleArrayItem(objetivos, setObjetivos, obj)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      objetivos.includes(obj)
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {obj}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Detalhes adicionais do objetivo (opcional)..."
                value={objetivoTexto}
                onChange={(e) => setObjetivoTexto(e.target.value)}
                className="w-full mt-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Patologias */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Patologias / Condições Diagnosticadas
              </label>
              <div className="flex flex-wrap gap-2">
                {PATOLOGIAS_OPCOES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleArrayItem(patologias, setPatologias, p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      patologias.includes(p)
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {patologias
                  .filter((p) => !PATOLOGIAS_OPCOES.includes(p))
                  .map((p) => (
                    <span
                      key={p}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white flex items-center gap-1.5"
                    >
                      {p}
                      <button
                        type="button"
                        onClick={() => setPatologias(patologias.filter((i) => i !== p))}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
              </div>
              <div className="flex items-center gap-2 pt-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Outra patologia..."
                  value={customPatologia}
                  onChange={(e) => setCustomPatologia(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (customPatologia.trim() && !patologias.includes(customPatologia.trim())) {
                      setPatologias([...patologias, customPatologia.trim()]);
                      setCustomPatologia('');
                    }
                  }}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </Button>
              </div>
            </div>

            {/* Restrições Alimentares */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Restrições Alimentares
              </label>
              <div className="flex flex-wrap gap-2">
                {RESTRICOES_OPCOES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleArrayItem(restricoes, setRestricoes, r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      restricoes.includes(r)
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Alergias */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Alergias Alimentares
              </label>
              <div className="flex flex-wrap gap-2">
                {ALERGIAS_OPCOES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleArrayItem(alergias, setAlergias, a)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      alergias.includes(a)
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Medicamentos em uso
                </label>
                <input
                  type="text"
                  value={medicamentos}
                  onChange={(e) => setMedicamentos(e.target.value)}
                  placeholder="Ex: Metformina 500mg, etc."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Suplementos em uso
                </label>
                <input
                  type="text"
                  value={suplementos}
                  onChange={(e) => setSuplementos(e.target.value)}
                  placeholder="Ex: Creatina, Whey, Vitamina D"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: HÁBITOS */}
        {activeTab === 'habitos' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Refeições / Dia
                </label>
                <input
                  type="number"
                  value={refeicoesPorDia}
                  onChange={(e) => setRefeicoesPorDia(e.target.value)}
                  placeholder="Ex: 5"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Horário que Acorda
                </label>
                <input
                  type="text"
                  value={horarioAcorda}
                  onChange={(e) => setHorarioAcorda(e.target.value)}
                  placeholder="Ex: 06:30"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Horário que Dorme
                </label>
                <input
                  type="text"
                  value={horarioDorme}
                  onChange={(e) => setHorarioDorme(e.target.value)}
                  placeholder="Ex: 22:30"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Água / Dia (Litros)
                </label>
                <input
                  type="text"
                  value={litrosAgua}
                  onChange={(e) => setLitrosAgua(e.target.value)}
                  placeholder="Ex: 2.5"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Atividade Física */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={atividadeFisica}
                  onChange={(e) => setAtividadeFisica(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Pratica atividade física regularmente?
                </span>
              </label>

              {atividadeFisica && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={atividadeFisicaDescricao}
                    onChange={(e) => setAtividadeFisicaDescricao(e.target.value)}
                    placeholder="Quais atividades e frequência semanal? Ex: Musculação 4x/sem"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Observações Adicionais
              </label>
              <textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Anotações gerais e preferências do paciente..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
