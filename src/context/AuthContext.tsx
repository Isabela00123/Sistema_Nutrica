import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { authClient, type Session, type User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    const saved = authClient.getStoredSession();
    if (saved) {
      setSession(saved);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await authClient.signInEmail({ email, password: pass });
    setSession(res);
  };

  const register = async (name: string, email: string, pass: string) => {
    const res = await authClient.signUpEmail({ name, email, password: pass });
    setSession(res);
  };

  const logout = async () => {
    await authClient.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        session,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
