// Authentication types for backoffice

export interface KoruCredentials {
    websiteId: string;
    appId: string;
}

export interface EmailPasswordCredentials {
    email: string;
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
    role: 'admin' | 'super_admin';
    name?: string;
}

export interface LoginResponse {
    success: boolean;
    token: string;
    account?: Account;
    user?: User;
    isSuperAdmin: boolean;
}

export interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    account: Account | null;
    user: User | null;
    isSuperAdmin: boolean;
}
