import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User as UserIcon, AlertCircle, Sparkles, CheckCircle2, ArrowRight, Sun, Moon } from 'lucide-react';

interface RegisterScreenProps {
  onNavigateLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateLogin }) => {
  const { register } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos do formulário.');
      return;
    }

    if (password.length < 9) {
      setError('A senha deve ter no mínimo 9 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Digite novamente.');
      return;
    }

    setLoading(true);
    try {
      await register(nome, email, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro ao criar a conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden transition-colors duration-300">
      {/* Ambient decorative orbs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-200/40 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-200/30 dark:bg-teal-950/20 rounded-full blur-3xl pointer-events-none" />

      {/* Theme Toggle Button top-right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          title={darkMode ? 'Modo claro' : 'Modo escuro'}
          className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-emerald-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-emerald-600" />}
        </button>
      </div>

      <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl shadow-emerald-950/5 dark:shadow-black/40 border border-emerald-100 dark:border-slate-800 p-8 z-10 transition-colors">
        {/* Header & Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-950 dark:text-white">
            Sistema Nutrica
          </h1>
          <p className="text-sm text-emerald-800/70 dark:text-emerald-400/80 mt-1">
            Crie sua conta e comece a gerenciar seus pacientes
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-emerald-900/70 dark:text-emerald-400/80">
              Nome completo
            </label>
            <Input
              type="text"
              placeholder="Dra. Mariana Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              icon={<UserIcon className="w-4 h-4" />}
              autoComplete="name"
              required
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-emerald-900/70 dark:text-emerald-400/80">
              E-mail profissional
            </label>
            <Input
              type="email"
              placeholder="mariana@nutricao.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-emerald-900/70 dark:text-emerald-400/80">
              Senha (mínimo 9 dígitos)
            </label>
            <Input
              type="password"
              placeholder="•••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-emerald-900/70 dark:text-emerald-400/80">
              Confirmar senha
            </label>
            <Input
              type="password"
              placeholder="•••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<CheckCircle2 className="w-4 h-4" />}
              autoComplete="new-password"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-3 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-2 group"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Criar conta</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </Button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-6 pt-5 border-t border-emerald-50 dark:border-slate-800 text-center text-sm text-emerald-800/80 dark:text-slate-400">
          <span>Já tem conta? </span>
          <button
            type="button"
            onClick={onNavigateLogin}
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline cursor-pointer inline-flex items-center gap-1 ml-1"
          >
            Faça login
          </button>
        </div>
      </div>
    </div>
  );
};
