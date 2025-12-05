import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../api/bookings';
import { Booking } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

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

  if (isLoading) return <div>Cargando reservas...</div>;
  if (error) return <div>Error al cargar reservas</div>;

  /* Lint Fix: ID: 301a1fdb-1a05-47e9-be6a-5354a04be5b4 */
  const bookings = response || [];

  return (
    <div style={{ padding: '40px' }}>
      <h1>📋 Agenda de Reservas</h1>

      <div style={{ overflowX: 'auto', marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <thead style={{ backgroundColor: '#f7fafc' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left' }}>Cliente</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Servicio</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Fecha y Hora</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#718096' }}>No hay reservas registradas.</td>
              </tr>
            ) : (
              bookings.map((booking: Booking) => (
                <tr key={booking.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 'bold' }}>{booking.customerName}</div>
                    <div style={{ fontSize: '0.9em', color: '#718096' }}>{booking.customerEmail}</div>
                    {booking.customerPhone && <div style={{ fontSize: '0.9em', color: '#718096' }}>{booking.customerPhone}</div>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {booking.service?.name || 'Servicio eliminado'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div>{format(parseISO(booking.date), 'EEEE d MMMM yyyy', { locale: es })}</div>
                    <div style={{ fontWeight: 'bold' }}>{booking.time}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.85em',
                      backgroundColor:
                        booking.status === 'confirmed' ? '#def7ec' :
                          booking.status === 'cancelled' ? '#fde8e8' : '#feecdc',
                      color:
                        booking.status === 'confirmed' ? '#03543f' :
                          booking.status === 'cancelled' ? '#9b1c1c' : '#92400e',
                    }}>
                      {booking.status === 'confirmed' ? 'Confirmada' :
                        booking.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {booking.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#fff',
                          border: '1px solid #c53030',
                          color: '#c53030',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9em'
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
