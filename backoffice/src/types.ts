export interface Service {
    id: string;
    name: string;
    duration: number;
    price?: number | null;
    buffer: number;
    imageUrl?: string | null;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateServiceInput {
    name: string;
    duration: number;
    price?: number;
    buffer?: number;
    imageUrl?: string;
    active?: boolean;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> { }

export interface Schedule {
    id: string;
    dayOfWeek: number;
    enabled: boolean;
    startTime: string;
    endTime: string;
    breakStart?: string | null;
    breakEnd?: string | null;
}

export interface CreateScheduleInput {
    dayOfWeek: number;
    enabled: boolean;
    startTime: string;
    endTime: string;
    breakStart?: string | null;
    breakEnd?: string | null;
}

export interface Booking {
    id: string;
    serviceId: string;
    service?: Service; // Populated
    date: string;
    time: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    notes?: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: string;
}

export interface CreateBookingInput {
    serviceId: string;
    date: string;
    time: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    notes?: string;
}

export interface WidgetSettings {
    id: string;
    // Apariencia
    layout: 'list' | 'grid' | 'button';
    accentColor: string;
    // Modo de visualización
    displayMode: 'modal' | 'inline';
    triggerText: string;
    triggerPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    offsetX: number;
    offsetY: number;
    // Configuración
    stepInterval: number;
    timezone: string;
    // Notificaciones
    notifyEmail: string;
    // Integración E-commerce
    ecommerceMode: boolean;
    reservationTTL: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface UpdateWidgetSettingsInput {
    // Apariencia
    layout: 'list' | 'grid' | 'button';
    accentColor: string;
    // Modo de visualización
    displayMode: 'modal' | 'inline';
    triggerText: string;
    triggerPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    offsetX: number;
    offsetY: number;
    // Configuración
    stepInterval: number;
    timezone: string;
    // Notificaciones
    notifyEmail: string;
    // Integración E-commerce
    ecommerceMode: boolean;
    reservationTTL: number;
}

export type ApiResponse<T = any> = T;
