import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/auth';
import type { AuthState, KoruCredentials, EmailPasswordCredentials, UsernamePasswordCredentials } from '../types/auth';

interface AuthContextType extends AuthState {
    login: (credentials: KoruCredentials | EmailPasswordCredentials) => Promise<void>;
    koruLogin: (credentials: UsernamePasswordCredentials) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    isAdmin: boolean; // Computed from user.role
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'auth_state';
const TOKEN_KEY = 'auth_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        token: null,
        account: null,
        user: null,
        koruTokenExpiresAt: undefined,
    });
    const [isLoading, setIsLoading] = useState(true);

    // Compute isAdmin from user role (supports both 'admin' from Koru and legacy 'super_admin')
    const isAdmin = authState.user?.role === 'admin' || authState.user?.role === 'super_admin';

    // Load auth state from localStorage on mount
    useEffect(() => {
        const loadAuthState = () => {
            try {
                const storedState = localStorage.getItem(STORAGE_KEY);
                const storedToken = localStorage.getItem(TOKEN_KEY);

                if (storedState && storedToken) {
                    const parsedState = JSON.parse(storedState);
                    setAuthState({
                        ...parsedState,
                        token: storedToken,
                        isAuthenticated: true,
                    });
                }
            } catch (error) {
                console.error('Error loading auth state:', error);
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(TOKEN_KEY);
            } finally {
                setIsLoading(false);
            }
        };

        loadAuthState();
    }, []);

    const login = async (credentials: KoruCredentials | EmailPasswordCredentials) => {
        try {
            const response = await authApi.login(credentials);

            if (!response.success) {
                throw new Error('Login failed');
            }

            const newState: AuthState = {
                isAuthenticated: true,
                token: response.token,
                account: response.account || null,
                user: response.user || null,
                koruTokenExpiresAt: response.koruTokenExpiresAt,
            };

            // Save to state
            setAuthState(newState);

            // Save to localStorage
            localStorage.setItem(TOKEN_KEY, response.token);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                account: newState.account,
                user: newState.user,
                koruTokenExpiresAt: newState.koruTokenExpiresAt,
            }));
        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error(error.response?.data?.error || 'Login failed');
        }
    };

    const koruLogin = async (credentials: UsernamePasswordCredentials) => {
        try {
            const response = await authApi.koruLogin(credentials);

            if (!response.success) {
                throw new Error('Login failed');
            }

            const newState: AuthState = {
                isAuthenticated: true,
                token: response.token,
                account: response.account || null,
                user: response.user || null,
                koruTokenExpiresAt: response.koruTokenExpiresAt,
            };

            // Save to state
            setAuthState(newState);

            // Save to localStorage
            localStorage.setItem(TOKEN_KEY, response.token);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                account: newState.account,
                user: newState.user,
                koruTokenExpiresAt: newState.koruTokenExpiresAt,
            }));
        } catch (error: any) {
            console.error('Koru login error:', error);
            throw new Error(error.response?.data?.error || 'Login failed');
        }
    };

    const logout = () => {
        // Clear state
        setAuthState({
            isAuthenticated: false,
            token: null,
            account: null,
            user: null,
            koruTokenExpiresAt: undefined,
        });

        // Clear localStorage
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(STORAGE_KEY);

        // Call logout API (optional, since JWT is stateless)
        authApi.logout().catch(console.error);
    };

    return (
        <AuthContext.Provider value={{ ...authState, login, koruLogin, logout, isLoading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
