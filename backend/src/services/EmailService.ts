import { Resend } from 'resend';
import { render } from '@react-email/render';
import { prisma } from '../utils/database.js';
import BookingConfirmation from '../emails/templates/BookingConfirmation.js';
import AdminNotification from '../emails/templates/AdminNotification.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface BookingEmailData {
  accountId: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
}

export class EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  RESEND_API_KEY no está configurada. Los emails no se enviarán.');
    }

    this.resend = new Resend(apiKey || 'dummy-key');
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@koru-booking.com';
  }

  /**
   * Envía emails de confirmación tanto al cliente como al admin
   */
  async sendBookingConfirmation(bookingData: BookingEmailData): Promise<void> {
    try {
      // Generate calendar link
      const calendarLink = this.generateCalendarLink(bookingData);
      const formattedDate = this.formatDate(bookingData.date);

      // Email al cliente
      const customerHtml = await render(
        BookingConfirmation({
          customerName: bookingData.customerName,
          serviceName: bookingData.serviceName,
          date: formattedDate,
          time: bookingData.time,
          notes: bookingData.notes,
          calendarLink,
        })
      );

      await this.sendEmail({
        to: bookingData.customerEmail,
        subject: `Confirmación de Reserva - ${bookingData.serviceName}`,
        html: customerHtml,
      });

      // Obtener email del administrador desde WidgetSettings
      const settings = await prisma.widgetSettings.findUnique({
        where: { accountId: bookingData.accountId },
        select: { notifyEmail: true },
      });

      if (settings?.notifyEmail) {
        const adminHtml = await render(
          AdminNotification({
            customerName: bookingData.customerName,
            customerEmail: bookingData.customerEmail,
            customerPhone: bookingData.customerPhone,
            serviceName: bookingData.serviceName,
            date: formattedDate,
            time: bookingData.time,
            notes: bookingData.notes,
          })
        );

        await this.sendEmail({
          to: settings.notifyEmail,
          subject: `Nueva Reserva - ${bookingData.serviceName}`,
          html: adminHtml,
        });
      } else {
        console.warn(`⚠️  No se encontró notifyEmail para accountId: ${bookingData.accountId}`);
      }

      console.log('✅ Emails de confirmación enviados');
    } catch (error) {
      console.error('❌ Error al enviar emails:', error);
      // No lanzamos error para que la reserva se cree aunque falle el email
    }
  }

  /**
   * Envía un email genérico usando Resend
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    const { data, error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      throw new Error(`Error al enviar email: ${error.message}`);
    }

    console.log(`📧 Email enviado exitosamente (ID: ${data?.id})`);
  }


  /**
   * Formatea la fecha para mostrar
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  /**
   * Genera link para Google Calendar
   */
  private generateCalendarLink(data: BookingEmailData): string {
    const startDate = new Date(`${data.date}T${data.time}:00`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatDateForCalendar = (date: Date): string => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const title = encodeURIComponent(`${data.serviceName} - Reserva`);
    const details = encodeURIComponent(`Reserva confirmada`);
    const startStr = formatDateForCalendar(startDate);
    const endStr = formatDateForCalendar(endDate);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
  }
}

export const emailService = new EmailService();
