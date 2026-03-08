import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Receipt,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/caminhoes', label: 'Caminhões', icon: Truck },
  { to: '/admin/motoristas', label: 'Motoristas', icon: Users },
  { to: '/admin/viagens', label: 'Viagens', icon: Route },
  { to: '/admin/despesas', label: 'Despesas', icon: Receipt },
  { to: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Até logo!');
    navigate('/login');
  };

  const initials = user?.nome.split(' ').map(n => n[0]).slice(0, 2).join('') || 'A';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="bg-primary rounded-xl p-2">
            <Truck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground text-lg">FrotaTech</h1>
            <p className="text-xs text-sidebar-foreground/60">Gestão de Frota</p>
          </div>
          <button
            className="ml-auto lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.nome}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">Administrador</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-4 shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
