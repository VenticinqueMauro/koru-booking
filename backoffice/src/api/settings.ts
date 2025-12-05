import { apiClient } from './client';
import { UpdateWidgetSettingsInput, ApiResponse, WidgetSettings } from '../types';

export const settingsApi = {
    get: async (): Promise<ApiResponse<WidgetSettings>> => {
        return apiClient.get('/settings');
    },

    update: async (data: UpdateWidgetSettingsInput): Promise<ApiResponse<WidgetSettings>> => {
        return apiClient.post('/settings', data);
    }
};