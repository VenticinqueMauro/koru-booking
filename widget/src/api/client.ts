const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:4000';

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number | null;
  buffer: number;
  imageUrl: string | null;
  active: boolean;
}

export interface Slot {
  time: string;
  available: boolean;
}

export interface BookingRequest {
  serviceId: string;
  date: string;
  time: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
}

export interface BookingResponse {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  customerName: string;
  customerEmail: string;
  status: string;
}

export class APIClient {
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || API_BASE_URL;
  }

  /**
   * Obtiene todos los servicios activos
   */
  async getServices(): Promise<Service[]> {
    const response = await fetch(`${this.baseURL}/api/services`);
    if (!response.ok) {
      throw new Error('Error al cargar servicios');
    }
    return response.json();
  }

  /**
   * Obtiene los slots disponibles para un servicio en una fecha
   */
  async getSlots(serviceId: string, date: string): Promise<string[]> {
    const response = await fetch(
      `${this.baseURL}/api/slots?serviceId=${serviceId}&date=${date}`
    );
    if (!response.ok) {
      throw new Error('Error al cargar disponibilidad');
    }
    const data = await response.json();
    return data.slots;
  }

  /**
   * Crea una nueva reserva
   */
  async createBooking(booking: BookingRequest): Promise<BookingResponse> {
    const response = await fetch(`${this.baseURL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear reserva');
    }

    return response.json();
  }
}

/**
 * Factory function para crear instancias de APIClient
 */
export const createApiClient = (baseURL?: string): APIClient => {
  return new APIClient(baseURL);
};

// Exportar instancia por defecto para compatibilidad
export const apiClient = new APIClient();
