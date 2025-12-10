import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui';
import './Dashboard.css';

export default function Dashboard() {

  return (
    <Layout>
      <div className="dashboard">
        <header className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Bienvenido al panel de administración de Koru Booking
          </p>
        </header>

        <div className="dashboard-grid">
          <DashboardCard
            title="Gestión de Servicios"
            description="Administra los servicios ofrecidos a tus clientes"
            link="/services"
            icon="🛠️"
          />
          <DashboardCard
            title="Configuración de Horarios"
            description="Define tu disponibilidad semanal"
            link="/schedule"
            icon="📅"
          />
          <DashboardCard
            title="Agenda de Reservas"
            description="Visualiza y gestiona todas las citas"
            link="/bookings"
            icon="📋"
          />
          <DashboardCard
            title="Ajustes del Widget"
            description="Personaliza el widget de reservas"
            link="/settings"
            icon="⚙️"
          />
        </div>
      </div>
    </Layout>
  );
}

interface DashboardCardProps {
  title: string;
  description: string;
  link: string;
  icon: string;
}

function DashboardCard({ title, description, link, icon }: DashboardCardProps) {
  return (
    <Link to={link} className="dashboard-card-link">
      <Card hoverable padding="lg" className="dashboard-card">
        <div className="dashboard-card-icon">{icon}</div>
        <h3 className="dashboard-card-title">{title}</h3>
        <p className="dashboard-card-description">{description}</p>
        <div className="dashboard-card-arrow">→</div>
      </Card>
    </Link>
  );
}
