import { apiClient } from './client';
import { BookingReservation, ApiResponse } from '../types';

export const reservationsApi = {
    getPending: async (): Promise<ApiResponse<BookingReservation[]>> => {
        return apiClient.get('/reservations');
    },

    cancel: async (id: string): Promise<ApiResponse<void>> => {
        return apiClient.delete(`/reservations/${id}`);
    },
};
