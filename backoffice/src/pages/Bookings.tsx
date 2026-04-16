import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bookingsApi } from '../api/bookings';
import { reservationsApi } from '../api/reservations';
import { Booking, BookingReservation } from '../types';
import { format, parseISO, differenceInMinutes } from 'date-fns';
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
import { Loader2, AlertCircle, Clock } from 'lucide-react';

/**
 * Parsea la fecha de la API ("2026-04-17T00:00:00.000Z") como fecha LOCAL,
 * evitando que UTC midnight cruce al día anterior en zonas UTC-N.
 */
function parseDateLocal(isoString: string): Date {
  const [y, m, d] = isoString.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isDatetimePast(dateStr: string, timeStr: string): boolean {
  // Usar la parte de fecha del ISO string directamente evita la conversión UTC→local
  const bookingDay = dateStr.substring(0, 10); // "2026-04-17"
  const today = format(new Date(), 'yyyy-MM-dd');
  if (bookingDay < today) return true;
  if (bookingDay > today) return false;
  // mismo día: comparar hora
  return timeStr <= format(new Date(), 'HH:mm');
}

type Tab = 'confirmed' | 'pending';

function timeRemaining(expiresAt: string): string {
  const mins = differenceInMinutes(parseISO(expiresAt), new Date());
  if (mins <= 0) return 'Vencida';
  if (mins === 1) return '1 min restante';
  return `${mins} min restantes`;
}

export default function Bookings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('confirmed');

  const { data: bookings = [], isLoading: loadingBookings, error: errorBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: bookingsApi.getAll,
  });

  const { data: reservations = [], isLoading: loadingReservations, error: errorReservations } = useQuery({
    queryKey: ['reservations', 'pending'],
    queryFn: reservationsApi.getPending,
    refetchInterval: 60_000, // refrescar cada minuto para mantener TTL actualizado
  });

  const cancelBookingMutation = useMutation({
    mutationFn: bookingsApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Reserva cancelada correctamente');
    },
    onError: () => toast.error('Error al cancelar la reserva'),
  });

  const cancelReservationMutation = useMutation({
    mutationFn: reservationsApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', 'pending'] });
      toast.success('Reserva temporal cancelada');
    },
    onError: () => toast.error('Error al cancelar la reserva temporal'),
  });

  const handleCancelBooking = (id: string) => {
    if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      cancelBookingMutation.mutate(id);
    }
  };

  const handleCancelReservation = (id: string) => {
    if (confirm('¿Cancelar esta reserva pendiente de pago? El slot quedará libre.')) {
      cancelReservationMutation.mutate(id);
    }
  };

  const getBookingStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    if (status === 'cancelled') return 'destructive';
    return 'default';
  };

  const getBookingStatusClassName = (status: string) => {
    if (status === 'confirmed') return 'bg-green-500 hover:bg-green-600 border-transparent text-white';
    if (status === 'cancelled') return '';
    return 'bg-yellow-500 hover:bg-yellow-600 border-transparent text-white';
  };

  const getBookingStatusLabel = (status: string) => {
    if (status === 'confirmed') return 'Confirmada';
    if (status === 'cancelled') return 'Cancelada';
    return 'Pendiente';
  };

  const isLoading = activeTab === 'confirmed' ? loadingBookings : loadingReservations;
  const hasError = activeTab === 'confirmed' ? errorBookings : errorReservations;

  const pendingCount = Array.isArray(reservations) ? reservations.length : 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (hasError) {
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

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('confirmed')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'confirmed'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Confirmadas
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Pendientes de pago
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-yellow-500 text-white text-xs w-5 h-5">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Confirmed bookings */}
        {activeTab === 'confirmed' && (
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
                    {(Array.isArray(bookings) ? bookings : []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No hay reservas registradas.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (Array.isArray(bookings) ? bookings : []).map((booking: Booking) => {
                        const past = isDatetimePast(booking.date, booking.time);
                        return (
                        <TableRow key={booking.id} className={past ? 'bg-muted/30 opacity-60' : ''}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{booking.customerName}</div>
                              <div className="text-sm text-muted-foreground">{booking.customerEmail}</div>
                              {booking.customerPhone && (
                                <div className="text-sm text-muted-foreground">{booking.customerPhone}</div>
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
                                {format(parseDateLocal(booking.date), 'EEEE d MMMM yyyy', { locale: es })}
                              </span>
                              <span className="text-sm text-muted-foreground">{booking.time} hs</span>
                              {past && (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  Pasada
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getBookingStatusVariant(booking.status)}
                              className={getBookingStatusClassName(booking.status)}
                            >
                              {getBookingStatusLabel(booking.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {booking.status !== 'cancelled' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelBooking(booking.id)}
                                disabled={cancelBookingMutation.isPending}
                              >
                                Cancelar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending reservations */}
        {activeTab === 'pending' && (
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4 border-b">
              <CardTitle className="text-base font-medium">Reservas pendientes de pago</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px] sm:w-[300px]">Cliente</TableHead>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Expira en</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(reservations) ? reservations : []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No hay reservas pendientes de pago.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (Array.isArray(reservations) ? reservations : []).map((res: BookingReservation) => (
                        <TableRow key={res.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{res.customerName || '—'}</div>
                              <div className="text-sm text-muted-foreground">{res.customerEmail || '—'}</div>
                              {res.customerPhone && (
                                <div className="text-sm text-muted-foreground">{res.customerPhone}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {res.service?.name || 'Servicio eliminado'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {format(parseDateLocal(res.date), 'EEEE d MMMM yyyy', { locale: es })}
                              </span>
                              <span className="text-sm text-muted-foreground">{res.time} hs</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-yellow-600">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="text-sm font-medium">{timeRemaining(res.expiresAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelReservation(res.id)}
                              disabled={cancelReservationMutation.isPending}
                            >
                              Liberar slot
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
