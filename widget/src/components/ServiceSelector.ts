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

    // Header con título y subtítulo
    const header = document.createElement('div');
    header.className = 'kb-services-header';

    const title = document.createElement('h2');
    title.className = 'kb-step-title';
    title.textContent = 'Selecciona tu servicio';
    header.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'kb-step-subtitle';
    subtitle.textContent = 'Elige el servicio que mejor se adapte a tus necesidades';
    header.appendChild(subtitle);

    this.container.appendChild(header);

    // Lista de servicios
    const servicesContainer = document.createElement('div');
    servicesContainer.className = `kb-services-${this.options.layout}`;

    this.options.services.forEach((service) => {
      const serviceCard = this.createServiceCard(service);
      servicesContainer.appendChild(serviceCard);
    });

    this.container.appendChild(servicesContainer);
    parent.appendChild(this.container);
  }

  private createServiceCard(service: Service): HTMLElement {
    const card = document.createElement('div');
    card.className = 'kb-service-card';
    card.onclick = () => this.options.onSelect(service);

    // Imagen (si existe)
    if (service.imageUrl) {
      const img = document.createElement('img');
      img.src = service.imageUrl;
      img.alt = service.name;
      img.className = 'kb-service-image';
      card.appendChild(img);
    }

    // Contenido
    const content = document.createElement('div');
    content.className = 'kb-service-content';

    const name = document.createElement('h3');
    name.className = 'kb-service-name';
    name.textContent = service.name;
    content.appendChild(name);

    const details = document.createElement('div');
    details.className = 'kb-service-details';

    const duration = document.createElement('span');
    duration.className = 'kb-service-duration';
    duration.innerHTML = `${getIcon('clock')} <span>${service.duration} min</span>`;
    details.appendChild(duration);

    if (service.price) {
      const price = document.createElement('span');
      price.className = 'kb-service-price';
      price.innerHTML = `$${service.price}`;
      details.appendChild(price);
    }

    content.appendChild(details);
    card.appendChild(content);

    // Hover effect con accent color
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = this.options.accentColor;
    });
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = '#e0e0e0';
    });

    return card;
  }

  destroy(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
