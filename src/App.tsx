import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Caminhoes from './pages/admin/Caminhoes';
import Motoristas from './pages/admin/Motoristas';
import Viagens from './pages/admin/Viagens';
import Despesas from './pages/admin/Despesas';
import Relatorios from './pages/admin/Relatorios';
import Admins from './pages/admin/Admins';
import Monitoramento from './pages/admin/Monitoramento';
import CadastroAdmin from './pages/CadastroAdmin';
import AppMotorista from './pages/motorista/AppMotorista';

function PrivateRoute({ children, tipo }: { children: React.ReactNode; tipo?: 'admin' | 'motorista' }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (tipo && user?.tipo !== tipo) {
    if (user?.tipo === 'admin') return <Navigate to="/admin" replace />;
    if (user?.tipo === 'motorista') return <Navigate to="/motorista" replace />;
  }

  return <>{children}</>;
}

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.tipo === 'admin') return <Navigate to="/admin" replace />;
  if (user?.tipo === 'motorista') return <Navigate to="/motorista" replace />;
  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro-admin" element={<CadastroAdmin />} />
      <Route path="/" element={<HomeRedirect />} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <PrivateRoute tipo="admin">
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="monitoramento" element={<Monitoramento />} />
        <Route path="caminhoes" element={<Caminhoes />} />
        <Route path="motoristas" element={<Motoristas />} />
        <Route path="viagens" element={<Viagens />} />
        <Route path="despesas" element={<Despesas />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="admins" element={<Admins />} />
      </Route>

      {/* Motorista */}
      <Route
        path="/motorista"
        element={
          <PrivateRoute tipo="motorista">
            <AppMotorista />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}
