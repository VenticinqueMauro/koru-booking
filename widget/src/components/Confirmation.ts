import { BookingResponse } from '../api/client';

export interface ConfirmationOptions {
  booking: BookingResponse;
  accentColor: string;
  onClose: () => void;
}

export class Confirmation {
  private container: HTMLElement | null = null;
  private options: ConfirmationOptions;

  constructor(options: ConfirmationOptions) {
    this.options = options;
  }

  render(parent: HTMLElement): void {
    this.container = document.createElement('div');
    this.container.className = 'kb-confirmation';

    // Icono de éxito
    const icon = document.createElement('div');
    icon.className = 'kb-success-icon';
    icon.innerHTML = '✓';
    icon.style.backgroundColor = this.options.accentColor;
    this.container.appendChild(icon);

    // Título
    const title = document.createElement('h2');
    title.className = 'kb-confirmation-title';
    title.textContent = '¡Reserva Confirmada!';
    this.container.appendChild(title);

    // Mensaje
    const message = document.createElement('p');
    message.className = 'kb-confirmation-message';
    message.textContent = 'Te hemos enviado un email de confirmación con todos los detalles.';
    this.container.appendChild(message);

    // Detalles de la reserva
    const details = document.createElement('div');
    details.className = 'kb-confirmation-details';
    details.innerHTML = `
      <div class="kb-detail-row">
        <span class="kb-detail-label">Servicio:</span>
        <span class="kb-detail-value">${this.options.booking.serviceName}</span>
      </div>
      <div class="kb-detail-row">
        <span class="kb-detail-label">Fecha:</span>
        <span class="kb-detail-value">${this.formatDisplayDate(this.options.booking.date)}</span>
      </div>
      <div class="kb-detail-row">
        <span class="kb-detail-label">Hora:</span>
        <span class="kb-detail-value">${this.options.booking.time}</span>
      </div>
      <div class="kb-detail-row">
        <span class="kb-detail-label">Cliente:</span>
        <span class="kb-detail-value">${this.options.booking.customerName}</span>
      </div>
      <div class="kb-detail-row">
        <span class="kb-detail-label">Email:</span>
        <span class="kb-detail-value">${this.options.booking.customerEmail}</span>
      </div>
    `;
    this.container.appendChild(details);

    // Botones de acción
    const actions = document.createElement('div');
    actions.className = 'kb-confirmation-actions';

    // Botón añadir a calendario
    const calendarBtn = document.createElement('a');
    calendarBtn.className = 'kb-calendar-button';
    calendarBtn.textContent = '📅 Añadir a Calendario';
    calendarBtn.href = this.generateCalendarLink();
    calendarBtn.target = '_blank';
    calendarBtn.style.borderColor = this.options.accentColor;
    calendarBtn.style.color = this.options.accentColor;
    actions.appendChild(calendarBtn);

    // Botón cerrar
    const closeBtn = document.createElement('button');
    closeBtn.className = 'kb-close-button';
    closeBtn.textContent = 'Cerrar';
    closeBtn.style.backgroundColor = this.options.accentColor;
    closeBtn.onclick = () => this.options.onClose();
    actions.appendChild(closeBtn);

    this.container.appendChild(actions);
    parent.appendChild(this.container);
  }

  private formatDisplayDate(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  }

  private generateCalendarLink(): string {
    const { booking } = this.options;
    const startDate = new Date(`${booking.date}T${booking.time}:00`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hora por defecto

    const formatDateForCalendar = (date: Date): string => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const title = encodeURIComponent(`${booking.serviceName} - Reserva`);
    const details = encodeURIComponent(`Reserva confirmada con ${booking.customerName}`);
    const startStr = formatDateForCalendar(startDate);
    const endStr = formatDateForCalendar(endDate);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
  }

  destroy(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
