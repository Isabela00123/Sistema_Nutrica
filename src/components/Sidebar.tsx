import React from 'react';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type NavItem = 'dashboard' | 'pacientes';

interface SidebarProps {
  activeItem: NavItem;
  onSelectItem: (item: NavItem) => void;
  onOpenPatientProfile?: (patientId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem,
  onSelectItem,
}) => {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-emerald-100 flex flex-col h-screen sticky top-0 shrink-0 z-30 select-none">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-emerald-50 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
            NutricaAi
          </span>
          <p className="text-[11px] font-medium text-emerald-700/60 leading-none mt-0.5">
            Gestão Clínica Nutricional
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-900/40">
          Menu Principal
        </div>

        {/* Dashboard button */}
        <button
          type="button"
          onClick={() => onSelectItem('dashboard')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
            activeItem === 'dashboard'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutDashboard className={`w-5 h-5 ${activeItem === 'dashboard' ? 'text-white' : 'text-emerald-700'}`} />
            <span>Dashboard</span>
          </div>
          {activeItem === 'dashboard' && <ChevronRight className="w-4 h-4 opacity-70" />}
        </button>

        {/* Pacientes button */}
        <button
          type="button"
          onClick={() => onSelectItem('pacientes')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
            activeItem === 'pacientes'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/70'
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
        </div>
      </div>
    </aside>
  );
};
