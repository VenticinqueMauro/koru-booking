import { KoruWidget, WidgetConfig } from '@redclover/koru-sdk';
import { apiClient, Service, BookingResponse } from './api/client';
import { ServiceSelector } from './components/ServiceSelector';
import { DateTimePicker } from './components/DateTimePicker';
import { CustomerForm, CustomerData } from './components/CustomerForm';
import { Confirmation } from './components/Confirmation';
import './styles/widget.css';

interface BookingWidgetConfig extends WidgetConfig {
  layout?: 'list' | 'grid' | 'button';
  stepInterval?: number;
  accentColor?: string;
  notifyEmail?: string;
}

type Step = 'service' | 'datetime' | 'form' | 'confirmation';

export class BookingWidget extends KoruWidget {
  private container: HTMLDivElement | null = null;
  private currentStep: Step = 'service';
  private services: Service[] = [];
  private selectedService: Service | null = null;
  private selectedDate: string = '';
  private selectedTime: string = '';
  private bookingResult: BookingResponse | null = null;

  // Componentes
  private serviceSelector: ServiceSelector | null = null;
  private dateTimePicker: DateTimePicker | null = null;
  private customerForm: CustomerForm | null = null;
  private confirmation: Confirmation | null = null;

  constructor() {
    super({
      name: 'koru-booking-widget',
      version: '1.0.0',
      options: {
        cache: true,
        debug: true,
        analytics: false,
      },
    });
  }

  async onInit(config: WidgetConfig): Promise<void> {
    this.log('Booking Widget initialized', config);
    
    // Cargar servicios
    try {
      this.services = await apiClient.getServices();
      this.log('Services loaded', this.services);
    } catch (error) {
      this.log('Error loading services', error);
      throw error;
    }
  }

  async onRender(config: WidgetConfig): Promise<void> {
    const typedConfig = config as BookingWidgetConfig;

    // Crear contenedor principal
    this.container = this.createElement('div', {
      className: 'koru-booking-widget',
      style: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      },
    });

    document.body.appendChild(this.container);

    // Renderizar paso inicial
    await this.renderStep(typedConfig);
  }

  private async renderStep(config: BookingWidgetConfig): Promise<void> {
    if (!this.container) return;

    // Limpiar componentes anteriores
    this.clearCurrentComponent();

    // Crear contenedor para el paso actual
    const stepContainer = this.createElement('div', {
      className: 'kb-step-container',
    });

    this.container.innerHTML = '';
    this.container.appendChild(stepContainer);

    const accentColor = config.accentColor || '#00C896';
    const layout = config.layout || 'list';

    switch (this.currentStep) {
      case 'service':
        this.serviceSelector = new ServiceSelector({
          services: this.services,
          accentColor,
          layout,
          onSelect: (service) => this.handleServiceSelect(service, config),
        });
        this.serviceSelector.render(stepContainer);
        break;

      case 'datetime':
        if (this.selectedService) {
          this.dateTimePicker = new DateTimePicker({
            service: this.selectedService,
            accentColor,
            onSelect: (date, time) => this.handleDateTimeSelect(date, time, config),
            onBack: () => this.goToStep('service', config),
          });
          await this.dateTimePicker.render(stepContainer);
        }
        break;

      case 'form':
        if (this.selectedService) {
          this.customerForm = new CustomerForm({
            service: this.selectedService,
            date: this.selectedDate,
            time: this.selectedTime,
            accentColor,
            onSubmit: (data) => this.handleFormSubmit(data, config),
            onBack: () => this.goToStep('datetime', config),
          });
          this.customerForm.render(stepContainer);
        }
        break;

      case 'confirmation':
        if (this.bookingResult) {
          this.confirmation = new Confirmation({
            booking: this.bookingResult,
            accentColor,
            onClose: () => this.resetWidget(config),
          });
          this.confirmation.render(stepContainer);
        }
        break;
    }
  }

  private clearCurrentComponent(): void {
    this.serviceSelector?.destroy();
    this.dateTimePicker?.destroy();
    this.customerForm?.destroy();
    this.confirmation?.destroy();

    this.serviceSelector = null;
    this.dateTimePicker = null;
    this.customerForm = null;
    this.confirmation = null;
  }

  private handleServiceSelect(service: Service, config: BookingWidgetConfig): void {
    this.log('Service selected', service);
    this.selectedService = service;
    this.goToStep('datetime', config);
  }

  private handleDateTimeSelect(date: string, time: string, config: BookingWidgetConfig): void {
    this.log('Date/Time selected', { date, time });
    this.selectedDate = date;
    this.selectedTime = time;
    this.goToStep('form', config);
  }

  private async handleFormSubmit(data: CustomerData, config: BookingWidgetConfig): Promise<void> {
    this.log('Form submitted', data);

    if (!this.selectedService || !this.container) return;

    // Mostrar loading
    this.showLoading();

    try {
      this.bookingResult = await apiClient.createBooking({
        serviceId: this.selectedService.id,
        date: this.selectedDate,
        time: this.selectedTime,
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        notes: data.notes,
      });

      this.log('Booking created', this.bookingResult);
      this.track('booking_completed', {
        serviceId: this.selectedService.id,
        date: this.selectedDate,
        time: this.selectedTime,
      });

      this.goToStep('confirmation', config);
    } catch (error) {
      this.log('Error creating booking', error);
      this.showError((error as Error).message);
    }
  }

  private goToStep(step: Step, config: BookingWidgetConfig): void {
    this.currentStep = step;
    this.renderStep(config);
  }

  private resetWidget(config: BookingWidgetConfig): void {
    this.selectedService = null;
    this.selectedDate = '';
    this.selectedTime = '';
    this.bookingResult = null;
    this.goToStep('service', config);
  }

  private showLoading(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="kb-loading-overlay">
        <div class="kb-spinner"></div>
        <p>Procesando tu reserva...</p>
      </div>
    `;
  }

  private showError(message: string): void {
    if (!this.container) return;

    const errorDiv = this.createElement('div', {
      className: 'kb-error-message',
      style: {
        padding: '20px',
        backgroundColor: '#fee',
        border: '1px solid #fcc',
        borderRadius: '8px',
        color: '#c33',
        textAlign: 'center',
      },
      children: [message],
    });

    this.container.innerHTML = '';
    this.container.appendChild(errorDiv);

    setTimeout(() => {
      if (this.config) {
        this.goToStep(this.currentStep, this.config as BookingWidgetConfig);
      }
    }, 3000);
  }

  async onDestroy(): Promise<void> {
    this.clearCurrentComponent();
    this.container?.remove();
    this.container = null;
    this.log('Widget destroyed');
  }

  async onConfigUpdate(config: WidgetConfig): Promise<void> {
    this.log('Config updated', config);
    await this.renderStep(config as BookingWidgetConfig);
  }
}
