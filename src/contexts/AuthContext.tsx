import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User, AuthState, UserType } from '../types';
import { mockUsers, mockMotoristas, CREDENCIAIS_TESTE } from '../data/mockData';

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

  const login = async (email: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    // Simulação de login com dados mock
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = mockUsers.find(u => u.email === email);

    if (!user) {
      return { success: false, error: 'Email não encontrado' };
    }

    // Verificar credenciais
    if (user.tipo === 'admin' && email === CREDENCIAIS_TESTE.admin.email && senha === CREDENCIAIS_TESTE.admin.senha) {
      setAuthState({ user, isAuthenticated: true });
      return { success: true };
    }

    if (user.tipo === 'motorista' && senha === CREDENCIAIS_TESTE.motorista.senha) {
      const motorista = mockMotoristas.find(m => m.userId === user.id);
      setMotoristaId(motorista?.id);
      setAuthState({ user, isAuthenticated: true });
      return { success: true };
    }

    // Permitir qualquer motorista com senha padrão
    if (user.tipo === 'motorista' && senha === 'moto123') {
      const motorista = mockMotoristas.find(m => m.userId === user.id);
      setMotoristaId(motorista?.id);
      setAuthState({ user, isAuthenticated: true });
      return { success: true };
    }

    return { success: false, error: 'Senha incorreta' };
  };

  const logout = () => {
    setAuthState({ user: null, isAuthenticated: false });
    setMotoristaId(undefined);
  };

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
