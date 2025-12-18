import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bookingsApi } from '../api/bookings';
import { Booking } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Bookings() {
  const queryClient = useQueryClient();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: bookingsApi.getAll,
  });

  const cancelMutation = useMutation({
    mutationFn: bookingsApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Reserva cancelada correctamente');
    },
    onError: () => {
      toast.error('Error al cancelar la reserva');
    },
  });

  const handleCancel = (id: string) => {
    if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      cancelMutation.mutate(id);
    }
  };

  const bookings = response || [];

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'confirmed':
        return 'default'; // Success green usually implies default or secondary. I will use 'default' (primary color) or 'secondary' if I want subtle. Or custom class.
      // Actually shadcn default is black. I'll use outline or secondary + custom class if needed. 
      // For now, mapping: 'confirmed' -> 'default' (or maybe I should add a 'success' variant to badge component? I'll stick to standard variants for now and use className if needed for color).
      // Let's use 'default' for confirmed. 
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Helper to add specific colors if needed, since Shadcn variants are semantic
  const getStatusClassName = (status: string) => {
    switch (status) {
      case 'confirmed': return "bg-green-500 hover:bg-green-600 border-transparent text-white";
      case 'cancelled': return ""; // destructive handles it
      default: return "bg-yellow-500 hover:bg-yellow-600 border-transparent text-white";
    }
  }


  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Pendiente';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex h-[50vh] items-center justify-center text-destructive gap-2">
          <AlertCircle className="h-5 w-5" />
          Error al cargar reservas
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Agenda de Reservas</h1>
          <p className="text-muted-foreground mt-2">
            Visualiza y gestiona todas las citas agendadas
          </p>
        </header>

        <Card>
          <CardHeader className="px-4 sm:px-6 py-4 border-b">
            <CardTitle className="text-base font-medium">Listado de Reservas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] sm:w-[300px]">Cliente</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No hay reservas registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((booking: Booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {booking.customerName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {booking.customerEmail}
                            </div>
                            {booking.customerPhone && (
                              <div className="text-sm text-muted-foreground">
                                {booking.customerPhone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {booking.service?.name || 'Servicio eliminado'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(parseISO(booking.date), 'EEEE d MMMM yyyy', {
                                locale: es,
                              })}
                            </span>
                            <span className="text-sm text-muted-foreground">{booking.time} hs</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusVariant(booking.status)}
                            className={getStatusClassName(booking.status)}
                          >
                            {getStatusLabel(booking.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {booking.status !== 'cancelled' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancel(booking.id)}
                              disabled={cancelMutation.isPending}
                            >
                              Cancelar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
