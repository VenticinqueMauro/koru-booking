import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { apiClient, Service } from '../api/client';
import { formatDate, isSlotPast } from '../utils/date';

export interface DateTimePickerOptions {
  service: Service;
  accentColor: string;
  onSelect: (date: string, time: string) => void;
  onBack: () => void;
}

export class DateTimePicker {
  private container: HTMLElement | null = null;
  private options: DateTimePickerOptions;
  private selectedDate: Date;
  private availableSlots: string[] = [];
  private loading: boolean = false;

  constructor(options: DateTimePickerOptions) {
    this.options = options;
    this.selectedDate = new Date();
  }

  async render(parent: HTMLElement): Promise<void> {
    this.container = document.createElement('div');
    this.container.className = 'kb-datetime-picker';

    // Header con botón volver
    const header = document.createElement('div');
    header.className = 'kb-step-header';

    const backBtn = document.createElement('button');
    backBtn.className = 'kb-back-button';
    backBtn.textContent = '← Volver';
    backBtn.onclick = () => this.options.onBack();
    header.appendChild(backBtn);

    const title = document.createElement('h2');
    title.className = 'kb-step-title';
    title.textContent = `${this.options.service.name}`;
    header.appendChild(title);

    this.container.appendChild(header);

    // Layout: Calendar | Time Slots
    const layout = document.createElement('div');
    layout.className = 'kb-datetime-layout';

    // Calendario
    const calendarSection = document.createElement('div');
    calendarSection.className = 'kb-calendar-section';
    this.renderCalendar(calendarSection);
    layout.appendChild(calendarSection);

    // Slots de tiempo
    const slotsSection = document.createElement('div');
    slotsSection.className = 'kb-slots-section';
    slotsSection.id = 'kb-slots-container';
    layout.appendChild(slotsSection);

    this.container.appendChild(layout);
    parent.appendChild(this.container);

    // Cargar slots para la fecha seleccionada
    await this.loadSlots();
  }

  private renderCalendar(parent: HTMLElement): void {
    const calendarTitle = document.createElement('h3');
    calendarTitle.textContent = 'Selecciona una fecha';
    calendarTitle.className = 'kb-calendar-title';
    parent.appendChild(calendarTitle);

    const calendar = document.createElement('div');
    calendar.className = 'kb-calendar';

    // Generar 14 días desde hoy
    for (let i = 0; i < 14; i++) {
      const date = addDays(new Date(), i);
      const dayCard = this.createDayCard(date);
      calendar.appendChild(dayCard);
    }

    parent.appendChild(calendar);
  }

  private createDayCard(date: Date): HTMLElement {
    const card = document.createElement('div');
    card.className = 'kb-day-card';

    if (isSameDay(date, this.selectedDate)) {
      card.classList.add('kb-day-selected');
      card.style.backgroundColor = this.options.accentColor;
    }

    const dayName = document.createElement('div');
    dayName.className = 'kb-day-name';
    dayName.textContent = format(date, 'EEE');
    card.appendChild(dayName);

    const dayNumber = document.createElement('div');
    dayNumber.className = 'kb-day-number';
    dayNumber.textContent = format(date, 'd');
    card.appendChild(dayNumber);

    card.onclick = async () => {
      this.selectedDate = date;
      this.updateCalendarSelection();
      await this.loadSlots();
    };

    return card;
  }

  private updateCalendarSelection(): void {
    const calendar = this.container?.querySelector('.kb-calendar');
    if (!calendar) return;

    const dayCards = calendar.querySelectorAll('.kb-day-card');
    dayCards.forEach((card, index) => {
      const date = addDays(new Date(), index);
      const htmlCard = card as HTMLElement;
      
      if (isSameDay(date, this.selectedDate)) {
        htmlCard.classList.add('kb-day-selected');
        htmlCard.style.backgroundColor = this.options.accentColor;
      } else {
        htmlCard.classList.remove('kb-day-selected');
        htmlCard.style.backgroundColor = '';
      }
    });
  }

  private async loadSlots(): Promise<void> {
    const slotsContainer = document.getElementById('kb-slots-container');
    if (!slotsContainer) return;

    this.loading = true;
    slotsContainer.innerHTML = '<div class="kb-loading">Cargando disponibilidad...</div>';

    try {
      const dateString = formatDate(this.selectedDate);
      this.availableSlots = await apiClient.getSlots(this.options.service.id, dateString);

      // Filtrar slots pasados
      const validSlots = this.availableSlots.filter(
        (time) => !isSlotPast(dateString, time)
      );

      slotsContainer.innerHTML = '';

      if (validSlots.length === 0) {
        slotsContainer.innerHTML = '<div class="kb-no-slots">No hay horarios disponibles para esta fecha</div>';
        return;
      }

      const slotsTitle = document.createElement('h3');
      slotsTitle.textContent = 'Horarios disponibles';
      slotsTitle.className = 'kb-slots-title';
      slotsContainer.appendChild(slotsTitle);

      const slotsGrid = document.createElement('div');
      slotsGrid.className = 'kb-slots-grid';

      validSlots.forEach((time) => {
        const slotBtn = document.createElement('button');
        slotBtn.className = 'kb-slot-button';
        slotBtn.textContent = time;
        slotBtn.onclick = () => this.options.onSelect(formatDate(this.selectedDate), time);
        
        slotBtn.addEventListener('mouseenter', () => {
          slotBtn.style.backgroundColor = this.options.accentColor;
          slotBtn.style.color = '#fff';
        });
        slotBtn.addEventListener('mouseleave', () => {
          slotBtn.style.backgroundColor = '';
          slotBtn.style.color = '';
        });

        slotsGrid.appendChild(slotBtn);
      });

      slotsContainer.appendChild(slotsGrid);
    } catch (error) {
      slotsContainer.innerHTML = `<div class="kb-error">Error al cargar horarios: ${(error as Error).message}</div>`;
    } finally {
      this.loading = false;
    }
  }

  destroy(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
