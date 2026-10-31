import React from 'react';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export type NavItem = 'dashboard' | 'pacientes';

interface SidebarProps {
  activeItem: NavItem;
  onSelectItem: (item: NavItem) => void;
  onOpenPatientProfile?: (patientId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem,
  onSelectItem,
  isOpen = false,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed lg:sticky top-0 bottom-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-emerald-100 dark:border-slate-800 flex flex-col h-screen shrink-0 z-50 select-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="p-5 border-b border-emerald-50 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-800 to-teal-700 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                NutricaAi
              </span>
              <p className="text-[11px] font-medium text-emerald-700/60 dark:text-emerald-400/60 leading-none mt-0.5">
                Gestão Clínica Nutricional
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-900/40">
          Menu Principal
        </div>

        {/* Dashboard button */}
        <button
          type="button"
          onClick={() => {
            onSelectItem('dashboard');
            if (onClose) onClose();
          }}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
            activeItem === 'dashboard'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-white hover:bg-emerald-50/70 dark:hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutDashboard className={`w-5 h-5 ${activeItem === 'dashboard' ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'}`} />
            <span>Dashboard</span>
          </div>
          {activeItem === 'dashboard' && <ChevronRight className="w-4 h-4 opacity-70" />}
        </button>

        {/* Pacientes button */}
        <button
          type="button"
          onClick={() => {
            onSelectItem('pacientes');
            if (onClose) onClose();
          }}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
            activeItem === 'pacientes'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-white hover:bg-emerald-50/70 dark:hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <Users className={`w-5 h-5 ${activeItem === 'pacientes' ? 'text-white' : 'text-emerald-700'}`} />
            <span>Pacientes</span>
          </div>
          {activeItem === 'pacientes' && <ChevronRight className="w-4 h-4 opacity-70" />}
        </button>
      </div>

      {/* User profile footer & Logout */}
      <div className="p-4 border-t border-emerald-50 bg-emerald-50/30">
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white border border-emerald-100/60 shadow-xs">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate" title={user?.name || 'Nutricionista'}>
              {user?.name || 'Nutricionista'}
            </p>
            <p className="text-[11px] text-emerald-700/70 truncate" title={user?.email}>
              {user?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sair do sistema"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            title={darkMode ? "Modo claro" : "Modo escuro"}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
    </>
  );
};
