import { Resend } from 'resend';
import { prisma } from '../utils/database.js';

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
      // Email al cliente
      await this.sendEmail({
        to: bookingData.customerEmail,
        subject: `Confirmación de Reserva - ${bookingData.serviceName}`,
        html: this.generateCustomerEmail(bookingData),
      });

      // Obtener email del administrador desde WidgetSettings
      const settings = await prisma.widgetSettings.findUnique({
        where: { accountId: bookingData.accountId },
        select: { notifyEmail: true },
      });

      if (settings?.notifyEmail) {
        await this.sendEmail({
          to: settings.notifyEmail,
          subject: `Nueva Reserva - ${bookingData.serviceName}`,
          html: this.generateAdminEmail(bookingData),
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
   * Template de email para el cliente
   */
  private generateCustomerEmail(data: BookingEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00C896 0%, #00A87E 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .detail-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00C896; }
          .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #666; }
          .value { color: #1a1a1a; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #00C896; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Reserva Confirmada</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${data.customerName}</strong>,</p>
            <p>Tu reserva ha sido confirmada exitosamente. Te esperamos en la fecha y hora indicadas.</p>
            
            <div class="detail-box">
              <h3 style="margin-top: 0;">Detalles de tu Reserva</h3>
              <div class="detail-row">
                <span class="label">Servicio:</span>
                <span class="value">${data.serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Fecha:</span>
                <span class="value">${this.formatDate(data.date)}</span>
              </div>
              <div class="detail-row">
                <span class="label">Hora:</span>
                <span class="value">${data.time}</span>
              </div>
              ${data.notes ? `
              <div class="detail-row">
                <span class="label">Notas:</span>
                <span class="value">${data.notes}</span>
              </div>
              ` : ''}
            </div>

            <p style="text-align: center;">
              <a href="${this.generateCalendarLink(data)}" class="button">
                📅 Añadir a mi Calendario
              </a>
            </p>

            <p style="color: #666; font-size: 14px;">
              Si necesitas cancelar o modificar tu reserva, por favor contáctanos lo antes posible.
            </p>
          </div>
          <div class="footer">
            <p>Gracias por confiar en nosotros</p>
            <p style="font-size: 12px; color: #999;">Este es un email automático, por favor no respondas a esta dirección.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template de email para el administrador
   */
  private generateAdminEmail(data: BookingEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a1a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .detail-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔔 Nueva Reserva Recibida</h2>
          </div>
          <div class="content">
            <p>Se ha registrado una nueva reserva en el sistema.</p>
            
            <div class="detail-box">
              <h3>Información del Servicio</h3>
              <div class="detail-row">
                <strong>Servicio:</strong> ${data.serviceName}
              </div>
              <div class="detail-row">
                <strong>Fecha:</strong> ${this.formatDate(data.date)}
              </div>
              <div class="detail-row">
                <strong>Hora:</strong> ${data.time}
              </div>
            </div>

            <div class="detail-box">
              <h3>Información del Cliente</h3>
              <div class="detail-row">
                <strong>Nombre:</strong> ${data.customerName}
              </div>
              <div class="detail-row">
                <strong>Email:</strong> ${data.customerEmail}
              </div>
              ${data.customerPhone ? `
              <div class="detail-row">
                <strong>Teléfono:</strong> ${data.customerPhone}
              </div>
              ` : ''}
              ${data.notes ? `
              <div class="detail-row">
                <strong>Notas:</strong> ${data.notes}
              </div>
              ` : ''}
            </div>

            <p style="color: #666; font-size: 14px;">
              Revisa el panel de administración para gestionar esta reserva.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
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
