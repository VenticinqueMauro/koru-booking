import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Wrench,
  Calendar,
  ClipboardList,
  Settings,
  LogOut,
  User
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/services', label: 'Servicios', icon: Wrench },
  { path: '/schedule', label: 'Horarios', icon: Calendar },
  { path: '/bookings', label: 'Reservas', icon: ClipboardList },
  { path: '/settings', label: 'Configuración', icon: Settings },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { account, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background font-sans antialiased flex">
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-card text-card-foreground shadow-sm">
        <div className="flex h-16 items-center border-b px-6">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Koru Booking</h1>
            <p className="text-xs text-muted-foreground">Backoffice</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium leading-none">
                {account?.businessName || 'Client Account'}
              </p>
              <p className="truncate text-xs text-muted-foreground mt-1">
                {account?.websiteId ? `ID: ${account.websiteId.slice(0, 8)}...` : 'N/A'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 pl-64">
        <div className="container py-8 px-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
