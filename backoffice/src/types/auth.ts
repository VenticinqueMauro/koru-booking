// Authentication types for backoffice

export interface KoruCredentials {
    websiteId: string;
    appId: string;
}

export interface EmailPasswordCredentials {
    email: string;
    password: string;
}

export interface UsernamePasswordCredentials {
    username: string;
    password: string;
}

export interface Account {
    id: string;
    websiteId: string;
    appId: string;
    businessName?: string;
}

export interface User {
    id: string;
    email: string;
    role: 'admin' | 'super_admin' | 'client';
    name?: string;
    username?: string;
}

export interface LoginResponse {
    success: boolean;
    token: string;
    account?: Account;
    user?: User;
    koruTokenExpiresAt?: string; // Koru token expiration (ISO 8601)
}

export interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    account: Account | null;
    user: User | null;
    koruTokenExpiresAt?: string; // Koru token expiration (ISO 8601)
}
