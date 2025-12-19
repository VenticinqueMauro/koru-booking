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

export interface KoruCredentials {
  websiteId: string;
  appId: string;
}

export class APIClient {
  private baseURL: string;
  private credentials: KoruCredentials | null = null;

  constructor(baseURL?: string, credentials?: KoruCredentials) {
    this.baseURL = baseURL || API_BASE_URL;
    this.credentials = credentials || null;
  }

  /**
   * Set Koru credentials for authentication
   */
  setCredentials(credentials: KoruCredentials): void {
    this.credentials = credentials;
  }

  /**
   * Get headers with Koru authentication
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.credentials) {
      headers['X-Koru-Website-Id'] = this.credentials.websiteId;
      headers['X-Koru-App-Id'] = this.credentials.appId;
      console.log('📤 [API Client] Sending Koru headers:', {
        websiteId: this.credentials.websiteId,
        appId: this.credentials.appId
      });
    } else {
      console.warn('⚠️ [API Client] No credentials set - requests will not include Koru headers');
    }

    return headers;
  }

  /**
   * Obtiene todos los servicios activos
   */
  async getServices(): Promise<Service[]> {
    const response = await fetch(`${this.baseURL}/api/services`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al cargar servicios');
    }
    return response.json();
  }

  /**
   * Obtiene los slots disponibles para un servicio en una fecha
   */
  async getSlots(serviceId: string, date: string, signal?: AbortSignal): Promise<string[]> {
    const response = await fetch(
      `${this.baseURL}/api/slots?serviceId=${serviceId}&date=${date}`,
      {
        headers: this.getHeaders(),
        signal,
      }
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
      headers: this.getHeaders(),
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
export const createApiClient = (baseURL?: string, credentials?: KoruCredentials): APIClient => {
  return new APIClient(baseURL, credentials);
};

// Exportar instancia por defecto para compatibilidad
export const apiClient = new APIClient();
