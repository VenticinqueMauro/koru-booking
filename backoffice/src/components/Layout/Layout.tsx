import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/services', label: 'Servicios', icon: '🛠️' },
  { path: '/schedule', label: 'Horarios', icon: '📅' },
  { path: '/bookings', label: 'Reservas', icon: '📋' },
  { path: '/settings', label: 'Configuración', icon: '⚙️' },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { account, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">Koru Booking</h1>
          <p className="sidebar-subtitle">Backoffice</p>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-content">
            <div className="sidebar-footer-text">
              <div className="sidebar-footer-name">
                {account?.businessName || 'Client Account'}
              </div>
              <div className="sidebar-footer-email">
                {account?.websiteId ? `ID: ${account.websiteId.slice(0, 8)}...` : 'N/A'}
              </div>
            </div>
          </div>
          <button onClick={logout} className="logout-button-sidebar">
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="main-content-inner">{children}</div>
      </main>
    </div>
  );
};
