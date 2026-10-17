import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Plus,
  Target,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  fetchPacientes,
  fetchPacienteComConsultas,
  getOrCreateNutricionistaId,
  type Paciente,
  type PacienteComUltimaConsulta,
  type Consulta,
} from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { NovoPacienteScreen } from '@/components/NovoPacienteScreen';

interface PacientesScreenProps {
  selectedPacienteId?: string | null;
  onClearSelectedPaciente?: () => void;
  initialMode?: 'list' | 'new';
}

export const PacientesScreen: React.FC<PacientesScreenProps> = ({
  selectedPacienteId,
  onClearSelectedPaciente,
  initialMode = 'list',
}) => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<PacienteComUltimaConsulta[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // View state: 'list' | 'new' | 'edit' | 'profile'
  const [isCreatingNew, setIsCreatingNew] = useState(initialMode === 'new');
  const [editingPatient, setEditingPatient] = useState<Paciente | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(
    selectedPacienteId || null
  );
  const [activePatientData, setActivePatientData] = useState<{
    paciente: Paciente;
    consultas: Consulta[];
  } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Sync prop changes
  useEffect(() => {
    if (selectedPacienteId) {
      setActiveProfileId(selectedPacienteId);
      setIsCreatingNew(false);
    }
  }, [selectedPacienteId]);

  const loadPacientes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const nutriId = await getOrCreateNutricionistaId(
        user.id,
        user.email,
        user.name
      );
      const data = await fetchPacientes(nutriId);
      setPacientes(data);
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPacientes();
  }, [user?.id]);

  // Load single patient details when activeProfileId is chosen
  useEffect(() => {
    const loadProfile = async () => {
      if (!activeProfileId || !user) {
        setActivePatientData(null);
        return;
      }
      setLoadingProfile(true);
      try {
        const nutriId = await getOrCreateNutricionistaId(
          user.id,
          user.email,
          user.name
        );
        const data = await fetchPacienteComConsultas(activeProfileId, nutriId);
        setActivePatientData(data);
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [activeProfileId, user?.id]);

  // Dismiss success banner after 5 seconds
  useEffect(() => {
    if (successBanner) {
      const timer = setTimeout(() => setSuccessBanner(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successBanner]);

  const handlePatientCreated = (newId: string) => {
    setIsCreatingNew(false);
    setActiveProfileId(newId);
    setSuccessBanner('Paciente cadastrado com sucesso!');
    loadPacientes();
  };

  const handlePatientUpdated = (updatedId: string) => {
    setEditingPatient(null);
    setActiveProfileId(updatedId);
    setSuccessBanner('Dados do paciente atualizados com sucesso!');
    loadPacientes();
  };

  const filteredPacientes = pacientes.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.whatsapp && p.whatsapp.includes(searchTerm)) ||
      (p.objetivos && p.objetivos.some((obj) => obj.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (p.objetivo_texto && p.objetivo_texto.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // If in edit mode, display NovoPacienteScreen populated with existing patient
  if (editingPatient) {
    return (
      <NovoPacienteScreen
        pacienteToEdit={editingPatient}
        onCancel={() => setEditingPatient(null)}
        onSuccess={handlePatientUpdated}
      />
    );
  }

  // If in create mode, display NovoPacienteScreen
  if (isCreatingNew) {
    return (
      <NovoPacienteScreen
        onCancel={() => setIsCreatingNew(false)}
        onSuccess={handlePatientCreated}
      />
    );
  }

  // Detail view of single patient
  if (activeProfileId) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100/70 px-8 py-4 sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveProfileId(null);
                if (onClearSelectedPaciente) onClearSelectedPaciente();
              }}
              className="gap-2 border-emerald-200 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para lista</span>
            </Button>
            <h1 className="text-lg font-bold text-slate-800">
              Perfil do Paciente
            </h1>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setActiveProfileId(null);
              setIsCreatingNew(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Paciente</span>
          </Button>
        </header>

        <main className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* Success banner if recently created */}
          {successBanner && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 animate-in fade-in duration-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successBanner}</span>
            </div>
          )}

          {loadingProfile ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">
                Carregando perfil e consultas...
              </p>
            </div>
          ) : !activePatientData ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100">
              <p className="text-base font-semibold text-slate-700">
                Paciente não encontrado ou sem permissão de acesso.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setActiveProfileId(null);
                  if (onClearSelectedPaciente) onClearSelectedPaciente();
                }}
              >
                Voltar
              </Button>
            </div>
          ) : (
            <>
              {/* Profile Card Header */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-emerald-600/20">
                    {activePatientData.paciente.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {activePatientData.paciente.nome}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                      {activePatientData.paciente.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {activePatientData.paciente.email}
                        </span>
                      )}
                      {activePatientData.paciente.whatsapp && (
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <Phone className="w-3.5 h-3.5" />
                          {activePatientData.paciente.whatsapp}
                        </span>
                      )}
                      {activePatientData.paciente.data_nascimento && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Nascimento: {new Date(activePatientData.paciente.data_nascimento).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {activePatientData.paciente.sexo && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                          {activePatientData.paciente.sexo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200">
                    Paciente Ativo
                  </span>
                  <Button
                    onClick={() => setEditingPatient(activePatientData.paciente)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-semibold shadow-xs cursor-pointer h-9 px-3.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Dados</span>
                  </Button>
                </div>
              </div>

              {/* Bio & Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-emerald-100/80 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Peso Inicial
                  </span>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {activePatientData.paciente.peso_inicial
                      ? `${activePatientData.paciente.peso_inicial} kg`
                      : 'Não informado'}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100/80 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Altura
                  </span>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {activePatientData.paciente.altura
                      ? `${activePatientData.paciente.altura} m`
                      : 'Não informada'}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100/80 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Nível de Atividade
                  </span>
                  <p className="text-base font-bold text-slate-800 mt-1 capitalize truncate">
                    {activePatientData.paciente.nivel_atividade || 'Não informado'}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100/80 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Água / Dia
                  </span>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {activePatientData.paciente.litros_agua
                      ? `${activePatientData.paciente.litros_agua} L`
                      : 'Não informado'}
                  </p>
                </div>
              </div>

              {/* Objetivos, Condições & Estilo de Vida */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Objetivos & Observações */}
                <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900/70 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span>Objetivos e Metas</span>
                  </h3>

                  {activePatientData.paciente.objetivos && activePatientData.paciente.objetivos.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {activePatientData.paciente.objetivos.map((obj) => (
                        <span
                          key={obj}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                        >
                          {obj}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Sem objetivos cadastrados.</p>
                  )}

                  {activePatientData.paciente.objetivo_texto && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                      {activePatientData.paciente.objetivo_texto}
                    </p>
                  )}

                  {activePatientData.paciente.observacoes && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold uppercase text-slate-400">Observações:</span>
                      <p className="text-xs text-slate-600 mt-1">
                        {activePatientData.paciente.observacoes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Restrições & Hábitos */}
                <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900/70 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Quadro Clínico e Hábitos</span>
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-700">Patologias: </span>
                      <span className="text-slate-600">
                        {activePatientData.paciente.patologias?.join(', ') || 'Nenhuma'}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700">Restrições Alimentares: </span>
                      <span className="text-slate-600">
                        {activePatientData.paciente.restricoes_alimentares?.join(', ') || 'Nenhuma'}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700">Alergias: </span>
                      <span className="text-slate-600">
                        {activePatientData.paciente.alergias?.join(', ') || 'Nenhuma'}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700">Rotina de sono: </span>
                      <span className="text-slate-600">
                        {activePatientData.paciente.horario_acorda ? `Acorda ${activePatientData.paciente.horario_acorda}` : '—'} 
                        {activePatientData.paciente.horario_dorme ? ` | Dorme ${activePatientData.paciente.horario_dorme}` : ''}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700">Atividade Física: </span>
                      <span className="text-slate-600">
                        {activePatientData.paciente.atividade_fisica
                          ? activePatientData.paciente.atividade_fisica_descricao || 'Sim'
                          : 'Não pratica'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultas History */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100/90 shadow-xs">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Histórico de Consultas
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-full">
                    {activePatientData.consultas.length} consulta(s)
                  </span>
                </div>

                {activePatientData.consultas.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    Nenhuma consulta registrada para este paciente ainda.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activePatientData.consultas.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-emerald-50/20 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-800 text-sm">
                              {new Date(c.data_consulta).toLocaleDateString('pt-BR')}
                            </span>
                            {c.proximo_retorno && (
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold border border-teal-200/60">
                                Próximo retorno: {new Date(c.proximo_retorno).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                          {c.observacoes && (
                            <p className="text-xs text-slate-600 max-w-xl">
                              {c.observacoes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                          {c.peso && <span>Peso: {c.peso} kg</span>}
                          {c.cintura && <span>Cintura: {c.cintura} cm</span>}
                          {c.percentual_gordura && <span>% Gordura: {c.percentual_gordura}%</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  // Patients List view (Prompt 4 requirements)
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70 overflow-y-auto">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100/70 px-8 py-4 sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Pacientes</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200/60">
              {pacientes.length} cadastrado(s)
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie seus pacientes e cadastre novas fichas clínicas
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Campo de busca por nome no topo da listagem */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome do paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-100/90 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Botão "Novo Paciente" que redireciona para o formulário de cadastro */}
          <Button
            onClick={() => setIsCreatingNew(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold px-4 h-10 shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Paciente</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-32 bg-white border border-slate-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredPacientes.length === 0 ? (
          /* Se não houver pacientes cadastrados, exibir a mensagem "Nenhum paciente cadastrado ainda" */
          <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 max-w-md mx-auto space-y-4 my-8 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {pacientes.length === 0
                  ? 'Nenhum paciente cadastrado ainda'
                  : 'Nenhum paciente encontrado'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {pacientes.length === 0
                  ? 'Cadastre seu primeiro paciente para começar o acompanhamento clínico nutricional.'
                  : `Nenhum resultado corresponde à busca "${searchTerm}".`}
              </p>
            </div>
            {pacientes.length === 0 && (
              <Button
                onClick={() => setIsCreatingNew(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Primeiro Paciente</span>
              </Button>
            )}
          </div>
        ) : (
          /* Lista de pacientes: Cada paciente exibe: nome, objetivo e data da última consulta */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPacientes.map((paciente) => {
              // Extract primary objective display
              const primaryObjective =
                paciente.objetivos && paciente.objetivos.length > 0
                  ? paciente.objetivos.join(', ')
                  : paciente.objetivo_texto || 'Sem objetivo registrado';

              return (
                <div
                  key={paciente.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveProfileId(paciente.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveProfileId(paciente.id);
                    }
                  }}
                  className="w-full text-left bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3 w-full">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-100 to-teal-50 text-emerald-800 font-bold flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                          {paciente.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          {/* Nome */}
                          <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors text-base truncate">
                            {paciente.nome}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">
                            {paciente.whatsapp || paciente.email || 'Sem contato'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </div>

                    {/* Objetivo */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                      <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-500 text-[11px] shrink-0">Objetivo:</span>
                      <span className="truncate font-medium text-slate-800" title={primaryObjective}>
                        {primaryObjective}
                      </span>
                    </div>
                  </div>

                  {/* Data da última consulta & Ações */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 w-full">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Última:</span>
                      <strong className="text-slate-700 font-semibold ml-0.5">
                        {paciente.ultima_consulta
                          ? new Date(paciente.ultima_consulta).toLocaleDateString('pt-BR')
                          : 'Nenhuma'}
                      </strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPatient(paciente);
                        }}
                        className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-emerald-800 hover:bg-emerald-100/70 bg-slate-100/80 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Editar cadastro do paciente"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Editar</span>
                      </button>

                      <span className="text-emerald-600 font-bold group-hover:underline text-[11px]">
                        Ver perfil →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
