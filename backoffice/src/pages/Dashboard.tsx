import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wrench, Calendar, ClipboardList, Settings, ArrowRight } from 'lucide-react';

export default function Dashboard() {

  return (
    <Layout>
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Bienvenido al panel de administración de Koru Booking
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Gestión de Servicios"
            description="Administra los servicios ofrecidos a tus clientes"
            link="/services"
            icon={Wrench}
          />
          <DashboardCard
            title="Configuración de Horarios"
            description="Define tu disponibilidad semanal"
            link="/schedule"
            icon={Calendar}
          />
          <DashboardCard
            title="Agenda de Reservas"
            description="Visualiza y gestiona todas las citas"
            link="/bookings"
            icon={ClipboardList}
          />
          <DashboardCard
            title="Ajustes del Widget"
            description="Personaliza el widget de reservas"
            link="/settings"
            icon={Settings}
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
  icon: React.ElementType;
}

function DashboardCard({ title, description, link, icon: Icon }: DashboardCardProps) {
  return (
    <Link to={link} className="block group">
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="h-4 w-4 text-primary" />
        </div>
      </Card>
    </Link>
  );
}
