import { apiClient } from './client';
import type { KoruCredentials, EmailPasswordCredentials, UsernamePasswordCredentials, LoginResponse } from '../types/auth';

export const authApi = {
    // Login with Koru credentials or email/password
    login: async (credentials: KoruCredentials | EmailPasswordCredentials): Promise<LoginResponse> => {
        const response = await apiClient.post<any, LoginResponse>('/auth/login', credentials);
        return response;
    },

    // Koru user login with username/password (Identity Broker)
    koruLogin: async (credentials: UsernamePasswordCredentials): Promise<LoginResponse> => {
        const response = await apiClient.post<any, LoginResponse>('/auth/koru-login', credentials);
        return response;
    },

    // Verify current token
    verify: async (): Promise<any> => {
        const response = await apiClient.get('/auth/verify');
        return response;
    },

    // Logout
    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
    },
};

export const superAdminApi = {
    // Get all accounts
    getAllAccounts: async () => {
        const response = await apiClient.get('/super-admin/accounts');
        return response;
    },

    // Get global statistics
    getGlobalStats: async () => {
        const response = await apiClient.get('/super-admin/stats');
        return response;
    },

    // Update account credentials and reference website
    updateAccount: async (accountId: string, data: { email?: string; password?: string; referenceWebsite?: string }) => {
        const response = await apiClient.put(`/super-admin/accounts/${accountId}`, data);
        return response;
    },

    // Get services for a specific account
    getAccountServices: async (accountId: string) => {
        const response = await apiClient.get(`/super-admin/accounts/${accountId}/services`);
        return response;
    },

    // Get bookings for a specific account
    getAccountBookings: async (accountId: string) => {
        const response = await apiClient.get(`/super-admin/accounts/${accountId}/bookings`);
        return response;
    },
};
