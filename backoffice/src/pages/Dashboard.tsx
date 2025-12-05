import { useKoruAuth } from '@redclover/koru-react-sdk';

export default function Dashboard() {
  const { config } = useKoruAuth();

  return (
    <div style={{ padding: '40px' }}>
      <h1>📊 Dashboard</h1>
      <p>Bienvenido al panel de administración de Koru Booking</p>
      <pre>{JSON.stringify(config, null, 2)}</pre>
      
      <div style={{ marginTop: '40px' }}>
        <h2>Próximas funcionalidades:</h2>
        <ul>
          <li>Gestión de Servicios (/services)</li>
          <li>Configuración de Horarios (/schedule)</li>
          <li>Agenda de Reservas (/bookings)</li>
          <li>Ajustes del Widget (/settings)</li>
        </ul>
      </div>
    </div>
  );
}
