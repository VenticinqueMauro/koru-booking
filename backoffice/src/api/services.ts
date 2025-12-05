import { apiClient } from './client';
import { Service, CreateServiceInput, UpdateServiceInput, ApiResponse } from '../types';

export const servicesApi = {
    getAll: async (): Promise<ApiResponse<Service[]>> => {
        return apiClient.get('/services');
    },

    getOne: async (id: string): Promise<ApiResponse<Service>> => {
        return apiClient.get(`/services/${id}`);
    },

    create: async (data: CreateServiceInput): Promise<ApiResponse<Service>> => {
        return apiClient.post('/services', data);
    },

    update: async (id: string, data: UpdateServiceInput): Promise<ApiResponse<Service>> => {
        return apiClient.put(`/services/${id}`, data);
    },

    delete: async (id: string): Promise<ApiResponse<void>> => {
        return apiClient.delete(`/services/${id}`);
    }
};
