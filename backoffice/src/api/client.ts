import axios, { AxiosResponse } from 'axios';

export const apiClient = axios.create({
    baseURL: (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '') + '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    (error: any) => {
        return Promise.reject(error);
    }
);
