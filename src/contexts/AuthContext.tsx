import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { AuthState, UserType } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  motoristaId?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [motoristaId, setMotoristaId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setAuthState({ user: null, isAuthenticated: false });
        setMotoristaId(undefined);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(userId: string) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      setAuthState({ user: null, isAuthenticated: false });
      return;
    }

    const user = {
      id: profile.id,
      nome: profile.nome,
      email: profile.email,
      tipo: profile.tipo as UserType,
      dataCriacao: profile.data_criacao,
    };

    setAuthState({ user, isAuthenticated: true });

    if (profile.tipo === 'motorista') {
      const { data: motorista } = await supabase
        .from('motoristas')
        .select('id')
        .eq('user_id', userId)
        .single();
      setMotoristaId(motorista?.id);
    }
  }

  const login = async (email: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      return { success: false, error: 'Email ou senha incorretos' };
    }

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, motoristaId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}

export type { UserType };
