import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onNavigateRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 9) {
      setError('A senha deve ter no mínimo 9 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro ao entrar. Verifique seus dados.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 relative overflow-hidden">
      {/* Background soft ambient orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl shadow-emerald-950/5 border border-emerald-100 p-8 z-10">
        {/* Header & Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-950">
            Sistema Nutrica
          </h1>
          <p className="text-sm text-emerald-800/70 mt-1">
            Gestão clínica inteligente para nutricionistas
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-emerald-900/70">
              E-mail profissional
            </label>
            <Input
              type="email"
              placeholder="exemplo@nutricao.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-emerald-900/70">
                Senha
              </label>
            </div>
            <Input
              type="password"
              placeholder="•••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-2 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-2 group"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </Button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-emerald-50 text-center text-sm text-emerald-800/80">
          <span>Não tem conta? </span>
          <button
            type="button"
            onClick={onNavigateRegister}
            className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer inline-flex items-center gap-1 ml-1"
          >
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
};
