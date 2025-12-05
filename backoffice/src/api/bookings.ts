import { apiClient } from './client';
import { Booking, CreateBookingInput, ApiResponse } from '../types';

export const bookingsApi = {
    getAll: async (): Promise<ApiResponse<Booking[]>> => {
        return apiClient.get('/bookings');
    },

    create: async (data: CreateBookingInput): Promise<ApiResponse<Booking>> => {
        return apiClient.post('/bookings', data);
    },

    cancel: async (id: string): Promise<ApiResponse<Booking>> => {
        return apiClient.patch(`/bookings/${id}/cancel`);
    }
};
