import { apiClient } from './client';
import { Schedule, CreateScheduleInput, ApiResponse } from '../types';

export const schedulesApi = {
    getAll: async (): Promise<ApiResponse<Schedule[]>> => {
        return apiClient.get('/schedules');
    },

    update: async (data: CreateScheduleInput): Promise<ApiResponse<Schedule>> => {
        return apiClient.post('/schedules', data);
    }
};
