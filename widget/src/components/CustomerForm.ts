import { validateEmail, validateName, validatePhone, ValidationMessages } from '../utils/validation';
import { Service } from '../api/client';
import { getIcon } from './icons';

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
  private submitButton: HTMLButtonElement | null = null;
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
    backBtn.innerHTML = `${getIcon('arrowLeft')} Volver`;
    backBtn.onclick = () => this.options.onBack();
    header.appendChild(backBtn);

    this.container.appendChild(header);

    // Title and subtitle
    const titleContainer = document.createElement('div');
    titleContainer.className = 'kb-form-header';

    const title = document.createElement('h2');
    title.className = 'kb-step-title';
    title.textContent = 'Completa tus datos';
    titleContainer.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'kb-step-subtitle';
    subtitle.textContent = 'Necesitamos algunos datos para confirmar tu reserva';
    titleContainer.appendChild(subtitle);

    this.container.appendChild(titleContainer);

    // Resumen de la reserva
    const summary = document.createElement('div');
    summary.className = 'kb-booking-summary';
    summary.innerHTML = `
      <div class="kb-summary-item">
        <strong>Servicio</strong>
        <span>${this.options.service.name}</span>
      </div>
      <div class="kb-summary-item">
        <strong>Fecha</strong>
        <span>${this.formatDisplayDate(this.options.date)}</span>
      </div>
      <div class="kb-summary-item">
        <strong>Hora</strong>
        <span>${this.options.time}</span>
      </div>
      <div class="kb-summary-item">
        <strong>Duración</strong>
        <span>${this.options.service.duration} min</span>
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
    form.appendChild(this.createField('name', 'Nombre completo', 'text', true, 'user', 'Juan Pérez'));

    // Campo: Email
    form.appendChild(this.createField('email', 'Correo electrónico', 'email', true, 'mail', 'tu@email.com'));

    // Campo: Teléfono
    form.appendChild(this.createField('phone', 'Teléfono', 'tel', false, 'phone', '+54 11 1234-5678'));

    // Campo: Notas
    const notesGroup = document.createElement('div');
    notesGroup.className = 'kb-form-group';
    notesGroup.setAttribute('data-field', 'notes');

    const notesLabel = document.createElement('label');
    notesLabel.className = 'kb-form-label';
    notesLabel.innerHTML = `${getIcon('note')} <span>Notas adicionales <span class="kb-optional">(opcional)</span></span>`;
    notesGroup.appendChild(notesLabel);

    const notesTextarea = document.createElement('textarea');
    notesTextarea.className = 'kb-form-textarea';
    notesTextarea.rows = 4;
    notesTextarea.placeholder = 'Agrega cualquier información adicional que consideres relevante...';
    notesTextarea.oninput = (e) => {
      this.formData.notes = (e.target as HTMLTextAreaElement).value;
    };
    notesGroup.appendChild(notesTextarea);

    form.appendChild(notesGroup);

    // Botón de envío
    this.submitButton = document.createElement('button');
    this.submitButton.type = 'submit';
    this.submitButton.className = 'kb-submit-button';
    this.submitButton.innerHTML = `
      <div class="kb-button-content">
        ${getIcon('checkCircle')}
        <span>Confirmar Reserva</span>
      </div>
      <div class="kb-spinner"></div>
    `;
    form.appendChild(this.submitButton);

    this.container.appendChild(form);
    parent.appendChild(this.container);
  }

  private createField(
    name: keyof CustomerData,
    label: string,
    type: string,
    required: boolean,
    icon: string,
    placeholder: string
  ): HTMLElement {
    const group = document.createElement('div');
    group.className = 'kb-form-group';
    group.setAttribute('data-field', name);

    const labelEl = document.createElement('label');
    labelEl.className = 'kb-form-label';
    const requiredMark = required ? '<span class="kb-required">*</span>' : '<span class="kb-optional">(opcional)</span>';
    labelEl.innerHTML = `${getIcon(icon as any)} <span>${label} ${requiredMark}</span>`;
    group.appendChild(labelEl);

    const input = document.createElement('input');
    input.type = type;
    input.className = 'kb-form-input';
    input.required = required;
    input.placeholder = placeholder;
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
    const nameGroup = this.container?.querySelector('[data-field="name"]');
    if (nameGroup && !validateName(this.formData.name)) {
      this.showError(nameGroup as HTMLElement, ValidationMessages.name);
      isValid = false;
    }

    // Validar email
    const emailGroup = this.container?.querySelector('[data-field="email"]');
    if (emailGroup && !validateEmail(this.formData.email)) {
      this.showError(emailGroup as HTMLElement, ValidationMessages.email);
      isValid = false;
    }

    // Validar teléfono (si se proporcionó)
    const phoneGroup = this.container?.querySelector('[data-field="phone"]');
    if (phoneGroup && this.formData.phone && !validatePhone(this.formData.phone)) {
      this.showError(phoneGroup as HTMLElement, ValidationMessages.phone);
      isValid = false;
    }

    if (isValid) {
      this.setLoading(true);
      this.options.onSubmit(this.formData);
    }
  }

  private setLoading(loading: boolean): void {
    if (!this.submitButton) return;

    if (loading) {
      this.submitButton.classList.add('kb-loading');
    } else {
      this.submitButton.classList.remove('kb-loading');
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
