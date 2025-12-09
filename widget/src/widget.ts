import { KoruWidget, WidgetConfig } from '@redclover/koru-sdk';
import { createApiClient, APIClient, Service, BookingResponse } from './api/client';
import { ServiceSelector } from './components/ServiceSelector';
import { DateTimePicker } from './components/DateTimePicker';
import { CustomerForm, CustomerData } from './components/CustomerForm';
import { Confirmation } from './components/Confirmation';
import './styles/widget.css';

export interface BookingWidgetConfig extends WidgetConfig {
  apiUrl?: string;
  layout?: 'list' | 'grid' | 'button';
  stepInterval?: number;
  accentColor?: string;
  notifyEmail?: string;
  displayMode?: 'inline' | 'modal';
  triggerText?: string;
  triggerPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

type Step = 'service' | 'datetime' | 'form' | 'confirmation';

export class BookingWidget extends KoruWidget {
  private widgetContainer: HTMLDivElement | null = null;
  private modalOverlay: HTMLDivElement | null = null;
  private triggerButton: HTMLButtonElement | null = null;
  private currentStep: Step = 'service';
  private services: Service[] = [];
  private selectedService: Service | null = null;
  private selectedDate: string = '';
  private selectedTime: string = '';
  private bookingResult: BookingResponse | null = null;
  private widgetConfig: BookingWidgetConfig | null = null;
  private isOpen: boolean = false;
  private apiClient: APIClient;

  // Componentes
  private serviceSelector: ServiceSelector | null = null;
  private dateTimePicker: DateTimePicker | null = null;
  private customerForm: CustomerForm | null = null;
  private confirmation: Confirmation | null = null;

  constructor() {
    super({
      name: 'koru-booking',
      version: '1.0.0',
      options: {
        debug: true,
        cache: true,
        analytics: false
      }
    });

    // Inicializar apiClient con URL por defecto
    this.apiClient = createApiClient();
    this.log('BookingWidget constructor called');
  }

  /**
   * Lifecycle hook: Initialize widget state after authorization
   * Loads services from the backend API
   */
  async onInit(config: WidgetConfig): Promise<void> {
    this.log('onInit called with config:', config);
    const typedConfig = config as BookingWidgetConfig;
    this.widgetConfig = typedConfig;

    // Configurar API client con URL desde config o fallback a env var
    const apiUrl = typedConfig.apiUrl || import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:4000';
    this.apiClient = createApiClient(apiUrl);
    this.log('API Client configured with URL:', apiUrl);

    // Cargar servicios
    try {
      this.log('Fetching services from API...');
      this.services = await this.apiClient.getServices();
      this.log('Services loaded:', this.services);
    } catch (error) {
      this.log('Error loading services:', error);
      throw error;
    }
  }

  /**
   * Lifecycle hook: Render widget UI
   * Called after onInit completes successfully
   */
  async onRender(config: WidgetConfig): Promise<void> {
    this.log('onRender called');
    const typedConfig = config as BookingWidgetConfig;
    this.widgetConfig = typedConfig;

    const displayMode = typedConfig.displayMode || 'inline';

    if (displayMode === 'modal') {
      this.renderModalMode(typedConfig);
    } else {
      this.renderInlineMode(typedConfig);
    }
  }

  /**
   * Lifecycle hook: Cleanup when widget is stopped
   * Removes all DOM elements and clears component references
   */
  async onDestroy(): Promise<void> {
    this.clearCurrentComponent();
    this.widgetContainer?.remove();
    this.modalOverlay?.remove();
    this.triggerButton?.remove();
    this.widgetContainer = null;
    this.modalOverlay = null;
    this.triggerButton = null;
    this.log('Widget destroyed');
  }

  /**
   * Optional lifecycle hook: Update config without full re-render
   * Called when widget.reload() is invoked
   */
  async onConfigUpdate(config: WidgetConfig): Promise<void> {
    this.log('Config updated', config);
    const typedConfig = config as BookingWidgetConfig;
    this.widgetConfig = typedConfig;
    await this.renderStep(typedConfig);
  }

  /**
   * Override start() para soportar modo desarrollo local
   * En desarrollo: usa config mock sin autenticación
   * En producción: delega al SDK de Koru para autenticación completa
   */
  async start(): Promise<void> {
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isDev) {
      this.log('🚀 Development mode: Using mock config');

      const mockConfig: BookingWidgetConfig = {
        apiUrl: import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:4000',
        accentColor: '#0d9488',
        layout: 'list',
        stepInterval: 30,
        displayMode: 'modal', // Cambiar a 'inline' para modo embebido
        triggerText: 'Reservar cita',
        triggerPosition: 'bottom-right',
      };

      try {
        await this.onInit(mockConfig);
        await this.onRender(mockConfig);
        this.log('✅ Widget started successfully in dev mode');
      } catch (error) {
        this.log('❌ Error starting widget in dev mode:', error);
        throw error;
      }
      return;
    }

    // En producción, usar el método start() del SDK
    this.log('🚀 Production mode: Using Koru SDK authentication');
    await super.start();
  }


  private renderInlineMode(config: BookingWidgetConfig): void {
    console.log('Rendering inline mode...');

    this.widgetContainer = this.createElement('div', {
      className: 'koru-booking-widget',
    });

    const targetElement = document.getElementById('widget-root') || document.body;
    targetElement.appendChild(this.widgetContainer);

    this.renderStep(config);
  }

  private renderModalMode(config: BookingWidgetConfig): void {
    console.log('Rendering modal mode...');

    // Crear botón trigger
    this.triggerButton = this.createElement('button', {
      className: 'kb-trigger-button',
    });

    const triggerText = config.triggerText || '📅 Reservar ahora';
    this.triggerButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
        <path d="M3 8H17" stroke="currentColor" stroke-width="2"/>
        <path d="M7 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M13 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>${triggerText}</span>
    `;

    const position = config.triggerPosition || 'bottom-right';
    this.triggerButton.classList.add(`kb-trigger-${position}`);

    this.triggerButton.onclick = () => this.openModal(config);
    document.body.appendChild(this.triggerButton);

    // Crear modal overlay (oculto inicialmente)
    this.modalOverlay = this.createElement('div', {
      className: 'kb-modal-overlay',
    });
    this.modalOverlay.style.display = 'none';

    // Click en overlay cierra el modal
    this.modalOverlay.onclick = (e) => {
      if (e.target === this.modalOverlay) {
        this.closeModal();
      }
    };

    // Crear contenedor del widget dentro del modal
    this.widgetContainer = this.createElement('div', {
      className: 'koru-booking-widget kb-modal-content',
    });

    // Botón cerrar
    const closeButton = this.createElement('button', {
      className: 'kb-modal-close',
    });
    closeButton.innerHTML = '×';
    closeButton.onclick = () => this.closeModal();

    this.widgetContainer.appendChild(closeButton);
    this.modalOverlay.appendChild(this.widgetContainer);
    document.body.appendChild(this.modalOverlay);
  }

  private openModal(config: BookingWidgetConfig): void {
    if (!this.modalOverlay || !this.widgetContainer) return;

    this.isOpen = true;
    this.modalOverlay.style.display = 'flex';

    // Trigger animation
    requestAnimationFrame(() => {
      this.modalOverlay!.classList.add('kb-modal-open');
    });

    // Renderizar contenido si es la primera vez
    if (!this.widgetContainer.querySelector('.kb-step-container')) {
      this.renderStep(config);
    }

    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
  }

  private closeModal(): void {
    if (!this.modalOverlay) return;

    this.isOpen = false;
    this.modalOverlay.classList.remove('kb-modal-open');

    setTimeout(() => {
      if (this.modalOverlay) {
        this.modalOverlay.style.display = 'none';
      }
    }, 300);

    // Restaurar scroll del body
    document.body.style.overflow = '';
  }

  private async renderStep(config: BookingWidgetConfig): Promise<void> {
    if (!this.widgetContainer) return;

    // Limpiar componentes anteriores
    this.clearCurrentComponent();

    // Crear contenedor para el paso actual
    const stepContainer = this.createElement('div', {
      className: 'kb-step-container',
    });

    this.widgetContainer.innerHTML = '';
    this.widgetContainer.appendChild(stepContainer);

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

    if (!this.selectedService || !this.widgetContainer) return;

    // Mostrar loading
    this.showLoading();

    try {
      this.bookingResult = await this.apiClient.createBooking({
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
    if (!this.widgetContainer) return;

    this.widgetContainer.innerHTML = `
      <div class="kb-loading-overlay">
        <div class="kb-spinner"></div>
        <p>Procesando tu reserva...</p>
      </div>
    `;
  }

  private showError(message: string): void {
    if (!this.widgetContainer) return;

    const errorDiv = this.createElement('div', {
      className: 'kb-error-message',
      style: {
        padding: '20px',
        backgroundColor: '#fee',
        border: '1px solid #fcc',
        borderRadius: '8px',
        color: '#c33',
        textAlign: 'center',
      } as any,
    });
    errorDiv.textContent = message;

    this.widgetContainer.innerHTML = '';
    this.widgetContainer.appendChild(errorDiv);

    setTimeout(() => {
      if (this.widgetConfig) {
        this.goToStep(this.currentStep, this.widgetConfig);
      }
    }, 3000);
  }

}
