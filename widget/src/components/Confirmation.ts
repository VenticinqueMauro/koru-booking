import { BookingResponse } from '../api/client';
import { getIcon } from './icons';

export interface ConfirmationOptions {
  booking: BookingResponse;
  accentColor: string;
  onClose: () => void;
  serviceDuration: number;
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

    // Success Icon
    const icon = document.createElement('div');
    icon.className = 'kb-success-icon';
    icon.innerHTML = getIcon('checkCircle');
    this.container.appendChild(icon);

    // Title
    const title = document.createElement('h2');
    title.className = 'kb-confirmation-title';
    title.textContent = '¡Reserva Confirmada!';
    this.container.appendChild(title);

    // Message
    const message = document.createElement('p');
    message.className = 'kb-confirmation-message';
    message.innerHTML = `Hemos enviado la confirmación a<br><strong>${this.options.booking.customerEmail}</strong>`;
    this.container.appendChild(message);

    // Details Box
    const details = document.createElement('div');
    details.className = 'kb-booking-summary kb-confirmation-details';
    details.innerHTML = `
      <div class="kb-summary-item">
        <strong>Servicio</strong>
        <span>${this.options.booking.serviceName}</span>
      </div>
      <div class="kb-summary-item">
        <strong>Fecha</strong>
        <span>${this.formatDisplayDate(this.options.booking.date)}</span>
      </div>
      <div class="kb-summary-item">
        <strong>Hora</strong>
        <span>${this.options.booking.time}</span>
      </div>
    `;
    this.container.appendChild(details);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'kb-confirmation-actions';

    // Primary: Nueva reserva (mismo icono que botón flotante)
    const newBookingBtn = document.createElement('button');
    newBookingBtn.className = 'kb-submit-button';
    newBookingBtn.innerHTML = `
      <div class="kb-button-content">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M3 8H17" stroke="currentColor" stroke-width="2"/>
          <path d="M7 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M13 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Nueva Reserva</span>
      </div>
    `;
    newBookingBtn.onclick = () => this.options.onClose();
    newBookingBtn.style.marginTop = '0';
    actions.appendChild(newBookingBtn);

    // Secondary: Agregar a calendario
    const calendarBtn = document.createElement('a');
    calendarBtn.className = 'kb-button-secondary';
    calendarBtn.innerHTML = `
      ${getIcon('calendar')}
      <span>Agregar a Calendario</span>
    `;
    calendarBtn.href = this.generateCalendarLink();
    calendarBtn.target = '_blank';
    calendarBtn.rel = 'noopener noreferrer';
    actions.appendChild(calendarBtn);

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
    const { booking, serviceDuration } = this.options;
    const startDate = new Date(`${booking.date}T${booking.time}:00`);
    const endDate = new Date(startDate.getTime() + serviceDuration * 60 * 1000);

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
