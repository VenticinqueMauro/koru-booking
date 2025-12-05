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

    // Success Icon
    const icon = document.createElement('div');
    icon.className = 'kb-success-icon';
    icon.innerHTML = '✓';
    this.container.appendChild(icon);

    // Title
    const title = document.createElement('h2');
    title.className = 'kb-confirmation-title';
    title.textContent = '¡Reserva Confirmada!';
    this.container.appendChild(title);

    // Message
    const message = document.createElement('p');
    message.className = 'kb-confirmation-message';
    message.innerHTML = `Hemos enviado los detalles a <strong>${this.options.booking.customerEmail}</strong>`;
    this.container.appendChild(message);

    // Details Box
    const details = document.createElement('div');
    details.className = 'kb-booking-summary';
    details.innerHTML = `
      <div class="kb-summary-item">
        <strong>Servicio</strong>
        ${this.options.booking.serviceName}
      </div>
      <div class="kb-summary-item">
        <strong>Fecha</strong>
        ${this.formatDisplayDate(this.options.booking.date)}
      </div>
      <div class="kb-summary-item">
        <strong>Hora</strong>
        ${this.options.booking.time}
      </div>
    `;
    this.container.appendChild(details);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'kb-confirmation-actions';

    const calendarBtn = document.createElement('a');
    calendarBtn.className = 'kb-button-outline';
    calendarBtn.textContent = '📅 Agregar a Calendario';
    calendarBtn.href = this.generateCalendarLink();
    calendarBtn.target = '_blank';
    actions.appendChild(calendarBtn);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'kb-submit-button';
    closeBtn.textContent = 'Nueva Reserva';
    closeBtn.onclick = () => this.options.onClose();
    closeBtn.style.marginTop = '0'; // Override default margin
    closeBtn.style.backgroundColor = this.options.accentColor;
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
