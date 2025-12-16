import axios, { AxiosResponse } from 'axios';

export const apiClient = axios.create({
    baseURL: (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '') + '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    (error: any) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_state');
            // Use basename only in production
            const basename = import.meta.env.PROD ? '/koru-booking' : '';
            window.location.href = `${basename}/login`;
        }
        return Promise.reject(error);
    }
);
