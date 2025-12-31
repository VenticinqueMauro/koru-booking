import { Service } from '../api/client';
import { getIcon } from './icons';

export interface ServiceSelectorOptions {
  services: Service[];
  accentColor: string;
  layout: 'list' | 'grid' | 'button';
  onSelect: (service: Service) => void;
}

export class ServiceSelector {
  private container: HTMLElement | null = null;
  private options: ServiceSelectorOptions;

  constructor(options: ServiceSelectorOptions) {
    this.options = options;
  }

  render(parent: HTMLElement): void {
    this.container = document.createElement('div');
    this.container.className = 'kb-service-selector';

    // Render based on layout type
    const servicesContainer = document.createElement('div');

    switch (this.options.layout) {
      case 'list':
        servicesContainer.className = 'kb-services-list-compact';
        this.renderListLayout(servicesContainer);
        break;
      case 'grid':
        servicesContainer.className = 'kb-services-grid-compact';
        this.renderGridLayout(servicesContainer);
        break;
      case 'button':
        servicesContainer.className = 'kb-services-buttons';
        this.renderButtonLayout(servicesContainer);
        break;
    }

    this.container.appendChild(servicesContainer);
    parent.appendChild(this.container);
  }

  private renderListLayout(container: HTMLElement): void {
    this.options.services.forEach((service) => {
      const item = document.createElement('div');
      item.className = 'kb-service-item-list';
      item.onclick = () => this.options.onSelect(service);

      item.innerHTML = `
        <div class="kb-service-item-content">
          <p class="kb-service-item-name">${service.name}</p>
          <div class="kb-service-item-meta">
            ${getIcon('clock', 'kb-service-item-icon')}
            <span>${service.duration} min</span>
          </div>
        </div>
        <div class="kb-service-item-action">
          ${service.price ? `<span class="kb-service-item-price" style="color: ${this.options.accentColor}">$${service.price.toLocaleString()}</span>` : ''}
          <span class="kb-service-item-chevron" style="color: ${this.options.accentColor}">${getIcon('chevron-right')}</span>
        </div>
      `;

      // Hover effects
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#f8fafc';
      });
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = '';
      });

      container.appendChild(item);
    });
  }

  private renderGridLayout(container: HTMLElement): void {
    this.options.services.forEach((service) => {
      const item = document.createElement('div');
      item.className = 'kb-service-item-grid';
      item.onclick = () => this.options.onSelect(service);

      item.innerHTML = `
        <div class="kb-service-grid-icon" style="background-color: ${this.options.accentColor}20">
          <span style="color: ${this.options.accentColor}">${getIcon('calendar')}</span>
        </div>
        <p class="kb-service-grid-name">${service.name}</p>
        ${service.price ? `<p class="kb-service-grid-price" style="color: ${this.options.accentColor}">$${service.price.toLocaleString()}</p>` : ''}
      `;

      container.appendChild(item);
    });
  }

  private renderButtonLayout(container: HTMLElement): void {
    this.options.services.forEach((service) => {
      const button = document.createElement('button');
      button.className = 'kb-service-button';
      button.style.backgroundColor = this.options.accentColor;
      button.onclick = () => this.options.onSelect(service);

      const priceText = service.price ? ` - $${service.price.toLocaleString()}` : '';
      button.textContent = `${service.name}${priceText}`;

      // Hover effect
      button.addEventListener('mouseenter', () => {
        button.style.opacity = '0.9';
        button.style.transform = 'scale(1.02)';
      });
      button.addEventListener('mouseleave', () => {
        button.style.opacity = '1';
        button.style.transform = 'scale(1)';
      });

      container.appendChild(button);
    });
  }

  destroy(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
