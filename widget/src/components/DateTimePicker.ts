import { format, addDays, startOfWeek, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths, isBefore, startOfDay, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { APIClient, Service } from '../api/client';
import { formatDate, isSlotPast } from '../utils/date';

export interface DateTimePickerOptions {
  service: Service;
  accentColor: string;
  apiClient: APIClient;
  onSelect: (date: string, time: string) => void;
  onBack: () => void;
}

export class DateTimePicker {
  private container: HTMLElement | null = null;
  private options: DateTimePickerOptions;
  private selectedDate: Date;
  private currentMonth: Date;
  private availableSlots: string[] = [];
  private loading: boolean = false;

  constructor(options: DateTimePickerOptions) {
    this.options = options;
    this.selectedDate = new Date();
    this.currentMonth = new Date();
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
    // Clear previous content
    parent.innerHTML = '';

    const calendarTitle = document.createElement('h3');
    calendarTitle.textContent = 'Selecciona una fecha';
    calendarTitle.className = 'kb-calendar-title';
    parent.appendChild(calendarTitle);

    // Month navigation header
    const monthHeader = document.createElement('div');
    monthHeader.className = 'kb-month-header';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'kb-month-nav';
    prevBtn.innerHTML = '←';
    prevBtn.onclick = () => this.changeMonth(-1);
    monthHeader.appendChild(prevBtn);

    const monthLabel = document.createElement('div');
    monthLabel.className = 'kb-month-label';
    monthLabel.textContent = format(this.currentMonth, 'MMMM yyyy', { locale: es });
    monthHeader.appendChild(monthLabel);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'kb-month-nav';
    nextBtn.innerHTML = '→';
    nextBtn.onclick = () => this.changeMonth(1);
    monthHeader.appendChild(nextBtn);

    parent.appendChild(monthHeader);

    // Weekday headers
    const weekdayHeader = document.createElement('div');
    weekdayHeader.className = 'kb-weekday-header';
    const weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    weekdays.forEach(day => {
      const dayLabel = document.createElement('div');
      dayLabel.className = 'kb-weekday-label';
      dayLabel.textContent = day;
      weekdayHeader.appendChild(dayLabel);
    });
    parent.appendChild(weekdayHeader);

    // Calendar grid
    const calendar = document.createElement('div');
    calendar.className = 'kb-calendar';
    calendar.id = 'kb-calendar-grid';

    this.renderMonthDays(calendar);

    parent.appendChild(calendar);
  }

  private renderMonthDays(calendar: HTMLElement): void {
    calendar.innerHTML = '';

    const monthStart = startOfMonth(this.currentMonth);
    const monthEnd = endOfMonth(this.currentMonth);

    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    let startDay = getDay(monthStart);
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    startDay = startDay === 0 ? 6 : startDay - 1;

    const today = startOfDay(new Date());

    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'kb-day-card kb-day-empty';
      calendar.appendChild(emptyCell);
    }

    // Add days of the month
    let currentDate = monthStart;
    while (currentDate <= monthEnd) {
      const dayCard = this.createDayCard(currentDate, today);
      calendar.appendChild(dayCard);
      currentDate = addDays(currentDate, 1);
    }
  }

  private changeMonth(direction: number): void {
    if (direction > 0) {
      this.currentMonth = addMonths(this.currentMonth, 1);
    } else {
      this.currentMonth = subMonths(this.currentMonth, 1);
    }

    const calendarSection = this.container?.querySelector('.kb-calendar-section');
    if (calendarSection) {
      this.renderCalendar(calendarSection as HTMLElement);
    }
  }

  private createDayCard(date: Date, today: Date): HTMLElement {
    const card = document.createElement('div');
    card.className = 'kb-day-card';

    const isPast = isBefore(date, today);
    const isToday = isSameDay(date, today);
    const isSelected = isSameDay(date, this.selectedDate);

    // Mark past days
    if (isPast) {
      card.classList.add('kb-day-past');
    }

    // Mark today
    if (isToday) {
      card.classList.add('kb-day-today');
    }

    // Mark selected day
    if (isSelected) {
      card.classList.add('kb-day-selected');
      card.style.backgroundColor = this.options.accentColor;
    }

    const dayNumber = document.createElement('div');
    dayNumber.className = 'kb-day-number';
    dayNumber.textContent = format(date, 'd');
    card.appendChild(dayNumber);

    // Only allow clicking on current or future days
    if (!isPast) {
      card.onclick = async () => {
        this.selectedDate = date;
        this.updateCalendarSelection();
        await this.loadSlots();
      };
    }

    return card;
  }

  private updateCalendarSelection(): void {
    // Re-render the current month to update selection
    const calendarGrid = this.container?.querySelector('#kb-calendar-grid');
    if (calendarGrid) {
      this.renderMonthDays(calendarGrid as HTMLElement);
    }
  }

  private async loadSlots(): Promise<void> {
    const slotsContainer = document.getElementById('kb-slots-container');
    if (!slotsContainer) return;

    this.loading = true;
    slotsContainer.innerHTML = '<div class="kb-loading">Cargando disponibilidad...</div>';

    try {
      const dateString = formatDate(this.selectedDate);
      this.availableSlots = await this.options.apiClient.getSlots(this.options.service.id, dateString);

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

        // Create span for text to appear above gradient
        const timeText = document.createElement('span');
        timeText.textContent = time;
        timeText.style.position = 'relative';
        timeText.style.zIndex = '1';
        slotBtn.appendChild(timeText);

        slotBtn.onclick = () => this.options.onSelect(formatDate(this.selectedDate), time);

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
