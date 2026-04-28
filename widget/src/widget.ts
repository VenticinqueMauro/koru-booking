import { KoruWidget, WidgetConfig } from '@redclover/koru-sdk';
import { createApiClient, APIClient, Service, BookingResponse, ReservationResponse, WidgetSettings } from './api/client';
import { ServiceSelector } from './components/ServiceSelector';
import { DateTimePicker } from './components/DateTimePicker';
import { CustomerForm, CustomerData } from './components/CustomerForm';
import { Confirmation } from './components/Confirmation';
import { saveReservationToVtexOrderForm } from './utils/vtex';
import './styles/widget.css';

export interface BookingWidgetConfig extends WidgetConfig {
  accentColor?: string;
  displayMode?: 'inline' | 'modal';
  triggerText?: string;
  triggerPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offsetX?: number;
  offsetY?: number;
  layout?: 'list' | 'grid' | 'button';
  ecommerceMode?: boolean;
  reservationTTL?: number;
}

export interface OpenFromTriggersOpts {
  /** IDs de servicios de koru-booking a mostrar (valores de la spec koru_services). */
  services: string[];
  /** Llamado cuando el usuario completa la reserva — koru-triggers usa esto para addToCart. Debe retornar Promise para poder awaitearlo. */
  onResolve: () => Promise<void>;
  /** Llamado cuando el usuario cierra el modal sin completar el flujo. */
  onCancel: () => void;
}

type Step = 'service' | 'datetime' | 'form' | 'confirmation' | 'ecommerce-confirmation';

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
  private reservationResult: ReservationResponse | null = null;
  private widgetConfig: BookingWidgetConfig | null = null;
  private isOpen: boolean = false;
  private apiClient!: APIClient;
  private externalOpenOpts: OpenFromTriggersOpts | null = null;
  private filteredServicesForModal: Service[] | null = null;

  // Componentes
  private serviceSelector: ServiceSelector | null = null;
  private dateTimePicker: DateTimePicker | null = null;
  private customerForm: CustomerForm | null = null;
  private confirmation: Confirmation | null = null;

  constructor(private readonly headless: boolean = false) {
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
   * Fetches widget settings from the backend and converts to BookingWidgetConfig
   */
  private async fetchBackendSettings(): Promise<BookingWidgetConfig> {
    try {
      console.log('📥 Fetching widget settings from backend...');
      const settings = await this.apiClient.getSettings();
      console.log('✅ Widget settings loaded from backend:', settings);

      return {
        accentColor: settings.accentColor,
        displayMode: settings.displayMode,
        triggerText: settings.triggerText,
        triggerPosition: settings.triggerPosition,
        offsetX: settings.offsetX,
        offsetY: settings.offsetY,
        layout: settings.layout,
        ecommerceMode: settings.ecommerceMode,
        reservationTTL: settings.reservationTTL,
      };
    } catch (error) {
      console.warn('⚠️ Could not load settings from backend, using defaults:', error);
      return {
        accentColor: '#00C896',
        displayMode: 'modal',
        triggerText: 'Reservar',
        triggerPosition: 'bottom-right',
        offsetX: 24,
        offsetY: 24,
        layout: 'list',
      };
    }
  }

  /**
   * Override start to load configuration from backend database
   */
  async start(): Promise<void> {
    console.log('🚀 BookingWidget.start() called');

    // Get credentials from script tag
    const credentials = this.getCredentialsFromScriptTag();
    console.log('🔑 Credentials from script tag:', credentials);

    if (!credentials) {
      console.error('❌ Koru credentials not found in script tag');
      throw new Error('Koru credentials are required. Add data-website-id and data-app-id to your script tag.');
    }

    // Initialize API client with credentials
    console.log('✅ Koru credentials loaded - websiteId:', credentials.websiteId, 'appId:', credentials.appId);
    this.apiClient = createApiClient(undefined, credentials);

    // Fetch configuration from backend database (single source of truth)
    const config = await this.fetchBackendSettings();
    console.log('📋 Using configuration:', config);

    try {
      console.log('Calling onInit...');
      await this.onInit(config);
      console.log('onInit completed, calling onRender...');
      await this.onRender(config);
      console.log('onRender completed');
    } catch (error) {
      console.error('Error starting widget:', error);
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

    // En modo headless (koru-triggers controla el trigger), no se crea DOM aquí —
    // ensureModalCreated() lo hará on-demand cuando openFromTriggers() sea llamado.
    if (this.headless) return;

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

    // Apply accent color
    const accentColor = config.accentColor || '#00C896';
    this.triggerButton.style.backgroundColor = accentColor;

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

    // Si venía de triggers y no completó el flujo → notificar cancel
    if (this.externalOpenOpts && this.currentStep !== 'ecommerce-confirmation') {
      this.externalOpenOpts.onCancel();
    }

    this.isOpen = false;
    this.modalOverlay.classList.remove('kb-modal-open');

    setTimeout(() => {
      if (this.modalOverlay) {
        this.modalOverlay.style.display = 'none';
      }
    }, 300);

    document.body.style.overflow = '';

    // Limpiar estado externo
    if (this.externalOpenOpts) {
      this.externalOpenOpts = null;
      this.filteredServicesForModal = null;
    }
  }

  private async renderStep(config: BookingWidgetConfig): Promise<void> {
    if (!this.widgetContainer) return;

    // Limpiar componentes anteriores
    this.clearCurrentComponent();

    const accentColor = config.accentColor || '#00C896';

    // Apply accent color as CSS variable to the entire widget
    this.widgetContainer.style.setProperty('--kb-accent-color', accentColor);

    // Clear container
    this.widgetContainer.innerHTML = '';

    // Add header with accent color
    const header = this.createElement('div', {
      className: 'kb-widget-header',
    });
    header.style.backgroundColor = accentColor;
    const headerTitle = this.currentStep === 'service' ? 'Seleccioná un servicio' : 'Reservar cita';
    header.innerHTML = `
      <svg class="kb-header-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2.5" y="3.5" width="13" height="12" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M2.5 6.5H15.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M5.5 2V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M12.5 2V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span class="kb-header-title">${headerTitle}</span>
    `;
    this.widgetContainer.appendChild(header);

    // Crear contenedor para el paso actual
    const stepContainer = this.createElement('div', {
      className: 'kb-step-container',
    });

    this.widgetContainer.appendChild(stepContainer);

    switch (this.currentStep) {
      case 'service':
        this.serviceSelector = new ServiceSelector({
          services: this.filteredServicesForModal ?? this.services,
          accentColor,
          layout: config.layout || 'list',
          onSelect: (service) => this.handleServiceSelect(service, config),
        });
        this.serviceSelector.render(stepContainer);
        break;

      case 'datetime':
        if (this.selectedService) {
          // "Atrás" vuelve al selector solo si hay múltiples servicios para elegir;
          // con un único servicio (auto-seleccionado) no tiene sentido volver al selector.
          const hasMultipleServices = (this.filteredServicesForModal ?? this.services).length > 1;
          this.dateTimePicker = new DateTimePicker({
            service: this.selectedService,
            accentColor,
            apiClient: this.apiClient,
            onSelect: (date, time) => this.handleDateTimeSelect(date, time, config),
            onBack: hasMultipleServices
              ? () => this.goToStep('service', config)
              : () => this.closeModal(),
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

      case 'ecommerce-confirmation':
        if (this.reservationResult && this.selectedService) {
          this.renderEcommerceConfirmation(stepContainer, accentColor, config);
        }
        break;
    }
  }

  private renderEcommerceConfirmation(container: HTMLElement, accentColor: string, config: BookingWidgetConfig): void {
    const expiresAt = this.reservationResult ? new Date(this.reservationResult.expiresAt) : null;
    const expiresText = expiresAt
      ? expiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    container.innerHTML = `
      <div style="padding: 32px 24px; text-align: center; min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;">
        <div style="
          width: 56px; height: 56px; border-radius: 50%;
          background: ${accentColor}20; display: flex; align-items: center; justify-content: center;
          color: ${accentColor}; font-size: 28px;
        ">⏳</div>
        <div>
          <h3 style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0 0 8px;">Turno reservado temporalmente</h3>
          <p style="font-size: 14px; color: #64748b; margin: 0; line-height: 1.5;">
            Tu turno del <strong>${this.selectedDate}</strong> a las <strong>${this.selectedTime}</strong> está reservado.
          </p>
          ${expiresText ? `<p style="font-size: 13px; color: #94a3b8; margin: 8px 0 0;">Expira a las ${expiresText} si no completás la compra.</p>` : ''}
        </div>
        <p style="font-size: 13px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin: 0; line-height: 1.5;">
          Completá tu compra para confirmar el turno. Una vez procesado el pago, recibirás la confirmación por email.
        </p>
        <button class="kb-reset-btn" style="
          background: none; border: 1px solid #e2e8f0; border-radius: 8px;
          padding: 10px 20px; font-size: 14px; color: #64748b; cursor: pointer;
        ">Elegir otro turno</button>
      </div>
    `;

    container.querySelector('.kb-reset-btn')?.addEventListener('click', () => this.resetWidget(config));
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

    this.showLoading(config.accentColor);

    try {
      if (config.ecommerceMode) {
        this.reservationResult = await this.apiClient.createReservation({
          serviceId: this.selectedService.id,
          date: this.selectedDate,
          time: this.selectedTime,
          customerName: data.name,
          customerEmail: data.email,
          customerPhone: data.phone,
          customerDocument: data.document || undefined,
          ttlMinutes: config.reservationTTL,
        });

        this.log('Reservation created', this.reservationResult);
        this.track('reservation_created', {
          serviceId: this.selectedService.id,
          date: this.selectedDate,
          time: this.selectedTime,
        });

        // Save reservationId to VTEX orderForm so the Worker can confirm it on payment-approved
        await saveReservationToVtexOrderForm(this.reservationResult.reservationId);

        // Notificar a koru-triggers para que ejecute addToCart y esperar resultado
        if (this.externalOpenOpts) {
          try {
            await this.externalOpenOpts.onResolve();
          } catch (err) {
            console.error('[koru-booking] addToCart falló después de reserva exitosa:', err);
          }
        }

        this.goToStep('ecommerce-confirmation', config);
      } else {
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
      }
    } catch (error) {
      this.log('Error submitting form', error);
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
    this.reservationResult = null;
    this.externalOpenOpts = null;
    this.filteredServicesForModal = null;
    this.goToStep('service', config);
  }

  private showLoading(accentColor?: string): void {
    if (!this.widgetContainer) return;

    const spinnerColor = accentColor || '#00C896';

    this.widgetContainer.innerHTML = `
      <div class="kb-loading-overlay" style="min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px;">
        <div class="kb-spinner" style="
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top-color: ${spinnerColor};
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

  /**
   * API pública llamada por koru-triggers cuando el usuario hace click en el CTA
   * de un producto que requiere booking. Abre el modal directamente, sin necesitar
   * el botón flotante, y fuerza ecommerceMode.
   */
  openFromTriggers(opts: OpenFromTriggersOpts): void {
    this.externalOpenOpts = opts;

    const filtered = opts.services.length > 0
      ? this.services.filter(s => opts.services.includes(s.id))
      : this.services;

    if (filtered.length === 0) {
      console.warn('[koru-booking] openFromTriggers: ningún servicio coincide con los IDs:', opts.services);
      opts.onCancel();
      return;
    }

    this.filteredServicesForModal = filtered;

    // Auto-seleccionar si hay un solo servicio (salta el paso de selección)
    if (filtered.length === 1) {
      this.selectedService = filtered[0];
      this.currentStep = 'datetime';
    } else {
      this.selectedService = null;
      this.currentStep = 'service';
    }

    const config: BookingWidgetConfig = {
      ...(this.config as BookingWidgetConfig),
      ecommerceMode: true,
    };

    this.ensureModalCreated(config);

    // Limpiar paso anterior si el modal ya fue usado
    this.widgetContainer?.querySelector('.kb-step-container')?.remove();
    this.openModal(config);
  }

  private ensureModalCreated(config: BookingWidgetConfig): void {
    if (this.modalOverlay) return;

    this.modalOverlay = this.createElement('div', { className: 'kb-modal-overlay' });
    this.modalOverlay.style.display = 'none';
    this.modalOverlay.onclick = (e) => {
      if (e.target === this.modalOverlay) this.closeModal();
    };

    const content = this.createElement('div', {
      className: 'koru-booking-widget kb-modal-content',
    });

    const closeBtn = this.createElement('button', { className: 'kb-modal-close' });
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => this.closeModal();

    content.appendChild(closeBtn);
    this.modalOverlay.appendChild(content);
    document.body.appendChild(this.modalOverlay);
    this.widgetContainer = content;

    const accentColor = config.accentColor || '#00C896';
    content.style.setProperty('--kb-accent-color', accentColor);
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
