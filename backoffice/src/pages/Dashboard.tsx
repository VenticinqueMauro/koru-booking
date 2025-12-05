import { useKoruAuth } from '../hooks/useKoruAuth';

export default function Dashboard() {
  useKoruAuth();

  return (
    <div style={{ padding: '40px' }}>
      <h1>📊 Dashboard</h1>
      <p>Bienvenido al panel de administración de Koru Booking</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '40px' }}>
        <DashboardCard
          title="Gestión de Servicios"
          description="Administra los servicios ofrecidos"
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
          description="Visualiza y gestiona citas"
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
  );
}

import { Link } from 'react-router-dom';

function DashboardCard({ title, description, link, icon }: { title: string, description: string, link: string, icon: string }) {
  return (
    <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        height: '100%',
        transition: 'transform 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        cursor: 'pointer'
      }}>
        <div style={{ fontSize: '2em' }}>{icon}</div>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <p style={{ margin: 0, color: '#718096' }}>{description}</p>
      </div>
    </Link>
  );
}
