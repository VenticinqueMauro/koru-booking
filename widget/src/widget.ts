import { KoruWidget, WidgetConfig } from '@redclover/koru-sdk';
import { createApiClient, APIClient, Service, BookingResponse } from './api/client';
import { ServiceSelector } from './components/ServiceSelector';
import { DateTimePicker } from './components/DateTimePicker';
import { CustomerForm, CustomerData } from './components/CustomerForm';
import { Confirmation } from './components/Confirmation';
import './styles/widget.css';

export interface BookingWidgetConfig extends WidgetConfig {
  accentColor?: string;
  displayMode?: 'inline' | 'modal';
  triggerText?: string;
  triggerPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offsetX?: number;
  offsetY?: number;
  layout?: 'list' | 'grid' | 'button';
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
  private apiClient!: APIClient;

  // Componentes
  private serviceSelector: ServiceSelector | null = null;
  private dateTimePicker: DateTimePicker | null = null;
  private customerForm: CustomerForm | null = null;
  private confirmation: Confirmation | null = null;

  constructor() {
    super({
      name: 'koru-booking',
      version: '1.0.0',
    });

    // Inicializar apiClient con URL por defecto
    this.apiClient = createApiClient();
    this.log('BookingWidget constructor called');
  }


  /**
   * Get Koru credentials from script tag data attributes
   */
  private getCredentialsFromScriptTag(): { websiteId: string; appId: string } | null {
    const scripts = document.querySelectorAll('script[data-website-id][data-app-id]');

    if (scripts.length === 0) {
      console.warn('No script tag found with data-website-id and data-app-id attributes');
      return null;
    }

    const script = scripts[0] as HTMLScriptElement;
    const websiteId = script.getAttribute('data-website-id');
    const appId = script.getAttribute('data-app-id');

    if (!websiteId || !appId) {
      console.warn('Script tag missing required attributes');
      return null;
    }

    return { websiteId, appId };
  }

  /**
   * Override start to bypass Koru SDK authentication in development
   */
  async start(): Promise<void> {
    console.log('🚀 BookingWidget.start() called');
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    console.log('isDev:', isDev);

    // Get credentials from script tag
    const credentials = this.getCredentialsFromScriptTag();

    if (!credentials && !isDev) {
      console.error('❌ Koru credentials not found in script tag');
      throw new Error('Koru credentials are required. Add data-website-id and data-app-id to your script tag.');
    }

    // Initialize API client with credentials
    if (credentials) {
      this.log('🔑 Koru credentials loaded:', { websiteId: credentials.websiteId });
      this.apiClient = createApiClient(undefined, credentials);
    } else {
      // Development mode without credentials
      this.log('⚠️ Development mode: No credentials provided');
      this.apiClient = createApiClient();
    }

    if (isDev) {
      this.log('🚀 Development mode detected: Bypassing Koru SDK auth');

      const mockConfig: BookingWidgetConfig = {
        accentColor: '#0d9488',
        displayMode: 'modal', // Cambiar a 'inline' para modo embebido
        triggerText: 'Reservar cita',
        triggerPosition: 'bottom-right',
        offsetX: 24,
        offsetY: 24,
      };

      try {
        console.log('Calling onInit...');
        await this.onInit(mockConfig);
        console.log('onInit completed, calling onRender...');
        await this.onRender(mockConfig);
        console.log('onRender completed');
      } catch (error) {
        console.error('Error starting widget in dev mode:', error);
      }
      return;
    }

    // En producción, usar el método start() del SDK de Koru
    console.log('🚀 Production mode: Using Koru SDK authentication');
    try {
      await super.start();
      console.log('✅ Koru SDK authentication completed');
    } catch (error) {
      console.error('❌ Error in Koru SDK authentication:', error);
      throw error;
    }
  }

  async onInit(config: BookingWidgetConfig): Promise<void> {
    console.log('📝 onInit called with config:', config);
    this.log('Booking Widget initialized', config);

    // Cargar servicios
    try {
      console.log('Fetching services from API...');
      this.services = await this.apiClient.getServices();
      console.log('Services loaded:', this.services);
      this.log('Services loaded', this.services);
    } catch (error) {
      console.error('Error loading services:', error);
      this.log('Error loading services', error);
      throw error;
    }
  }

  async onRender(config: BookingWidgetConfig): Promise<void> {
    console.log('🎨 onRender called');
    const typedConfig = config as BookingWidgetConfig;
    this.config = typedConfig;

    const displayMode = typedConfig.displayMode || 'modal';

    if (displayMode === 'modal') {
      this.renderModalMode(typedConfig);
    } else {
      this.renderInlineMode(typedConfig);
    }
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

    const triggerText = config.triggerText || 'Reservar ahora';
    this.triggerButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
        <path d="M3 8H17" stroke="currentColor" stroke-width="2"/>
        <path d="M7 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M13 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>${triggerText}</span>
    `;

    // Apply position based on triggerPosition and offsets
    const position = config.triggerPosition || 'bottom-right';
    const offsetX = config.offsetX ?? 24; // Horizontal offset (from left or right)
    const offsetY = config.offsetY ?? 24; // Vertical offset (from top or bottom)

    switch (position) {
      case 'bottom-right':
        this.triggerButton.style.bottom = `${offsetY}px`;
        this.triggerButton.style.right = `${offsetX}px`;
        break;
      case 'bottom-left':
        this.triggerButton.style.bottom = `${offsetY}px`;
        this.triggerButton.style.left = `${offsetX}px`;
        break;
      case 'top-right':
        this.triggerButton.style.top = `${offsetY}px`;
        this.triggerButton.style.right = `${offsetX}px`;
        break;
      case 'top-left':
        this.triggerButton.style.top = `${offsetY}px`;
        this.triggerButton.style.left = `${offsetX}px`;
        break;
    }

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

    switch (this.currentStep) {
      case 'service':
        this.serviceSelector = new ServiceSelector({
          services: this.services,
          accentColor,
          layout: config.layout || 'list',
          onSelect: (service) => this.handleServiceSelect(service, config),
        });
        this.serviceSelector.render(stepContainer);
        break;

      case 'datetime':
        if (this.selectedService) {
          this.dateTimePicker = new DateTimePicker({
            service: this.selectedService,
            accentColor,
            apiClient: this.apiClient,
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
        if (this.bookingResult && this.selectedService) {
          this.confirmation = new Confirmation({
            booking: this.bookingResult,
            accentColor,
            onClose: () => this.resetWidget(config),
            serviceDuration: this.selectedService.duration,
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
      this.showError((error as Error).message, () => this.goToStep('form', config));
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
      <div class="kb-loading-overlay" style="min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px;">
        <div class="kb-spinner" style="
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top-color: #0d9488;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        "></div>
        <p style="margin-top: 20px; font-size: 16px; color: #64748b; font-weight: 500;">Procesando tu reserva...</p>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  private showError(message: string, onClose?: () => void): void {
    if (!this.widgetContainer) return;

    this.widgetContainer.innerHTML = '';

    const errorContainer = this.createElement('div', {
      style: {
        padding: '60px 20px',
        textAlign: 'center',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      } as any,
    });

    const errorDiv = this.createElement('div', {
      className: 'kb-error-message',
      style: {
        padding: '20px',
        backgroundColor: '#fee2e2',
        border: '1px solid #fca5a5',
        borderRadius: '8px',
        color: '#991b1b',
        marginBottom: '20px',
        maxWidth: '400px',
      } as any,
    });
    errorDiv.textContent = message;
    errorContainer.appendChild(errorDiv);

    const closeButton = this.createElement('button', {
      className: 'kb-button-secondary',
      textContent: 'Volver a intentar',
    });
    closeButton.onclick = () => {
      if (onClose) {
        onClose();
      } else if (this.config) {
        this.goToStep(this.currentStep, this.config as BookingWidgetConfig);
      }
    };
    errorContainer.appendChild(closeButton);

    this.widgetContainer.appendChild(errorContainer);
  }

  async onDestroy(): Promise<void> {
    this.clearCurrentComponent();
    this.widgetContainer?.remove();
    this.widgetContainer = null;
    this.log('Widget destroyed');
  }

  async onConfigUpdate(config: BookingWidgetConfig): Promise<void> {
    this.log('Config updated', config);
    await this.renderStep(config);
  }
}
