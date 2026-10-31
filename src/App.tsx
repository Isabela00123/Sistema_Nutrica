import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoginScreen } from '@/components/LoginScreen';
import { RegisterScreen } from '@/components/RegisterScreen';
import { DashboardScreen } from '@/components/DashboardScreen';
import { PacientesScreen } from '@/components/PacientesScreen';
import { Sidebar, type NavItem } from '@/components/Sidebar';
import { Sparkles } from 'lucide-react';
import './index.css';
import { ThemeProvider } from '@/context/ThemeContext';

function MainApp() {
  const { session, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeMenu, setActiveMenu] = useState<NavItem>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Mobile / Responsive Sidebar Drawer */}
        <Sidebar
          activeItem={activeMenu}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectItem={(item) => {
            setActiveMenu(item);
            if (item === 'pacientes') {
              setSelectedPatientId(null);
            }
          }}
        />

        {/* Dynamic Main Content with Mobile Header */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          {activeMenu === 'dashboard' ? (
            <DashboardScreen
              onNavigateToPacientes={handleNavigateToPacientes}
              onSelectPaciente={handleSelectPaciente}
              onToggleMenu={() => setSidebarOpen(true)}
            />
          ) : (
            <PacientesScreen
              selectedPacienteId={selectedPatientId}
              onClearSelectedPaciente={() => setSelectedPatientId(null)}
              onToggleMenu={() => setSidebarOpen(true)}
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
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
