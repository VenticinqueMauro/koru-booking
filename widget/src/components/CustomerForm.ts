import { validateEmail, validateName, validatePhone, ValidationMessages } from '../utils/validation';
import { Service } from '../api/client';

export interface CustomerData {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}

export interface CustomerFormOptions {
  service: Service;
  date: string;
  time: string;
  accentColor: string;
  onSubmit: (data: CustomerData) => void;
  onBack: () => void;
}

export class CustomerForm {
  private container: HTMLElement | null = null;
  private options: CustomerFormOptions;
  private formData: CustomerData = {
    name: '',
    email: '',
    phone: '',
    notes: '',
  };

  constructor(options: CustomerFormOptions) {
    this.options = options;
  }

  render(parent: HTMLElement): void {
    this.container = document.createElement('div');
    this.container.className = 'kb-customer-form';

    // Header
    const header = document.createElement('div');
    header.className = 'kb-step-header';

    const backBtn = document.createElement('button');
    backBtn.className = 'kb-back-button';
    backBtn.textContent = '← Volver';
    backBtn.onclick = () => this.options.onBack();
    header.appendChild(backBtn);

    const title = document.createElement('h2');
    title.className = 'kb-step-title';
    title.textContent = 'Completa tus datos';
    header.appendChild(title);

    this.container.appendChild(header);

    // Resumen de la reserva
    const summary = document.createElement('div');
    summary.className = 'kb-booking-summary';
    summary.innerHTML = `
      <div class="kb-summary-item">
        <strong>Servicio:</strong> ${this.options.service.name}
      </div>
      <div class="kb-summary-item">
        <strong>Fecha:</strong> ${this.formatDisplayDate(this.options.date)}
      </div>
      <div class="kb-summary-item">
        <strong>Hora:</strong> ${this.options.time}
      </div>
      <div class="kb-summary-item">
        <strong>Duración:</strong> ${this.options.service.duration} min
      </div>
    `;
    this.container.appendChild(summary);

    // Formulario
    const form = document.createElement('form');
    form.className = 'kb-form';
    form.onsubmit = (e) => {
      e.preventDefault();
      this.handleSubmit();
    };

    // Campo: Nombre
    form.appendChild(this.createField('name', 'Nombre completo', 'text', true));

    // Campo: Email
    form.appendChild(this.createField('email', 'Email', 'email', true));

    // Campo: Teléfono
    form.appendChild(this.createField('phone', 'Teléfono (opcional)', 'tel', false));

    // Campo: Notas
    const notesGroup = document.createElement('div');
    notesGroup.className = 'kb-form-group';

    const notesLabel = document.createElement('label');
    notesLabel.textContent = 'Notas adicionales (opcional)';
    notesLabel.className = 'kb-form-label';
    notesGroup.appendChild(notesLabel);

    const notesTextarea = document.createElement('textarea');
    notesTextarea.className = 'kb-form-textarea';
    notesTextarea.rows = 3;
    notesTextarea.placeholder = 'Información adicional que quieras compartir...';
    notesTextarea.oninput = (e) => {
      this.formData.notes = (e.target as HTMLTextAreaElement).value;
    };
    notesGroup.appendChild(notesTextarea);

    form.appendChild(notesGroup);

    // Botón de envío
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'kb-submit-button';
    submitBtn.textContent = 'Confirmar Reserva';
    submitBtn.style.backgroundColor = this.options.accentColor;
    form.appendChild(submitBtn);

    this.container.appendChild(form);
    parent.appendChild(this.container);
  }

  private createField(
    name: keyof CustomerData,
    label: string,
    type: string,
    required: boolean
  ): HTMLElement {
    const group = document.createElement('div');
    group.className = 'kb-form-group';

    const labelEl = document.createElement('label');
    labelEl.textContent = label + (required ? ' *' : '');
    labelEl.className = 'kb-form-label';
    group.appendChild(labelEl);

    const input = document.createElement('input');
    input.type = type;
    input.className = 'kb-form-input';
    input.required = required;
    input.oninput = (e) => {
      this.formData[name] = (e.target as HTMLInputElement).value as any;
      this.clearError(group);
    };
    group.appendChild(input);

    const errorEl = document.createElement('div');
    errorEl.className = 'kb-form-error';
    group.appendChild(errorEl);

    return group;
  }

  private handleSubmit(): void {
    let isValid = true;

    // Validar nombre
    const nameGroup = this.container?.querySelector('.kb-form-group:nth-child(1)');
    if (nameGroup && !validateName(this.formData.name)) {
      this.showError(nameGroup as HTMLElement, ValidationMessages.name);
      isValid = false;
    }

    // Validar email
    const emailGroup = this.container?.querySelector('.kb-form-group:nth-child(2)');
    if (emailGroup && !validateEmail(this.formData.email)) {
      this.showError(emailGroup as HTMLElement, ValidationMessages.email);
      isValid = false;
    }

    // Validar teléfono (si se proporcionó)
    const phoneGroup = this.container?.querySelector('.kb-form-group:nth-child(3)');
    if (phoneGroup && this.formData.phone && !validatePhone(this.formData.phone)) {
      this.showError(phoneGroup as HTMLElement, ValidationMessages.phone);
      isValid = false;
    }

    if (isValid) {
      this.options.onSubmit(this.formData);
    }
  }

  private showError(group: HTMLElement, message: string): void {
    const errorEl = group.querySelector('.kb-form-error') as HTMLElement;
    const input = group.querySelector('.kb-form-input') as HTMLInputElement;
    
    if (errorEl) errorEl.textContent = message;
    if (input) input.classList.add('kb-form-input-error');
  }

  private clearError(group: HTMLElement): void {
    const errorEl = group.querySelector('.kb-form-error') as HTMLElement;
    const input = group.querySelector('.kb-form-input') as HTMLInputElement;
    
    if (errorEl) errorEl.textContent = '';
    if (input) input.classList.remove('kb-form-input-error');
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

  destroy(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
