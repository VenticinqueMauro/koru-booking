import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../api/bookings';
import { Booking } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Layout } from '../components/Layout';
import { Button, Badge } from '../components/ui';
import './Bookings.css';

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
    },
  });

  const handleCancel = (id: string) => {
    if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      cancelMutation.mutate(id);
    }
  };

  const bookings = response || [];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'warning';
    }
  };

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
        <div className="bookings-loading">Cargando reservas...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bookings-error">Error al cargar reservas</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bookings">
        <header className="page-header">
          <h1 className="page-title">Agenda de Reservas</h1>
          <p className="page-subtitle">
            Visualiza y gestiona todas las citas agendadas
          </p>
        </header>

        <div className="bookings-table-container">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Fecha y Hora</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="bookings-empty">
                    No hay reservas registradas.
                  </td>
                </tr>
              ) : (
                bookings.map((booking: Booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div className="booking-customer">
                        <div className="booking-customer-name">
                          {booking.customerName}
                        </div>
                        <div className="booking-customer-email">
                          {booking.customerEmail}
                        </div>
                        {booking.customerPhone && (
                          <div className="booking-customer-phone">
                            {booking.customerPhone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="booking-service">
                        {booking.service?.name || 'Servicio eliminado'}
                      </div>
                    </td>
                    <td>
                      <div className="booking-datetime">
                        <div className="booking-date">
                          {format(parseISO(booking.date), 'EEEE d MMMM yyyy', {
                            locale: es,
                          })}
                        </div>
                        <div className="booking-time">{booking.time}</div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={getStatusVariant(booking.status)}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </td>
                    <td>
                      {booking.status !== 'cancelled' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancel(booking.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
