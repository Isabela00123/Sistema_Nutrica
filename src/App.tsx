import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoginScreen } from '@/components/LoginScreen';
import { RegisterScreen } from '@/components/RegisterScreen';
import { DashboardScreen } from '@/components/DashboardScreen';
import { PacientesScreen } from '@/components/PacientesScreen';
import { Sidebar, type NavItem } from '@/components/Sidebar';
import { Sparkles } from 'lucide-react';
import './index.css';

function MainApp() {
  const { session, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeMenu, setActiveMenu] = useState<NavItem>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-emerald-50/50">
        <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 animate-pulse mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-emerald-900">Carregando NutricaAi...</p>
      </div>
    );
  }

  // If user is authenticated, render Sidebar + Main Workspace
  if (session) {
    const handleNavigateToPacientes = () => {
      setSelectedPatientId(null);
      setActiveMenu('pacientes');
    };

    const handleSelectPaciente = (pacienteId: string) => {
      setSelectedPatientId(pacienteId);
      setActiveMenu('pacientes');
    };

    return (
      <div className="flex h-screen w-full overflow-hidden bg-slate-50">
        {/* Fixed Sidebar with NutricaAi logo and menu */}
        <Sidebar
          activeItem={activeMenu}
          onSelectItem={(item) => {
            setActiveMenu(item);
            if (item === 'pacientes') {
              setSelectedPatientId(null);
            }
          }}
        />

        {/* Dynamic Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {activeMenu === 'dashboard' ? (
            <DashboardScreen
              onNavigateToPacientes={handleNavigateToPacientes}
              onSelectPaciente={handleSelectPaciente}
            />
          ) : (
            <PacientesScreen
              selectedPacienteId={selectedPatientId}
              onClearSelectedPaciente={() => setSelectedPatientId(null)}
            />
          )}
        </div>
      </div>
    );
  }

  // Authentication Views
  if (authView === 'register') {
    return <RegisterScreen onNavigateLogin={() => setAuthView('login')} />;
  }

  return <LoginScreen onNavigateRegister={() => setAuthView('register')} />;
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
