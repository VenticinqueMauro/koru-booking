import axios from 'axios';
import { KoruCredentials } from '../types/auth.js';

export interface KoruAuthorizeResponse {
    authorized: boolean;
    token: string;
    config: Record<string, any>;
    app: {
        id: string;
        name: string;
        description: string;
    };
    website: {
        id: string;
        url: string;
        is_ecommerce: boolean;
    };
}

export interface KoruWebsite {
    id: string;
    url: string;
}

export interface KoruLoginResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    expires_at: string;
    app_id: string;
    websites: KoruWebsite[];
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

export interface KoruConfigResponse {
    config: Record<string, any>;
    app_name: string;
    is_widget: boolean;
    app_manifest: Record<string, any>;
}

export interface KoruLoginCredentials {
    username: string;
    password: string;
}

export class KoruService {
    private koruApiUrl: string;
    private koruAppId: string;
    private koruAppSecret: string;

    constructor() {
        this.koruApiUrl = process.env.KORU_API_URL || 'https://www.korusuite.com';
        this.koruAppId = process.env.KORU_APP_ID || '';
        this.koruAppSecret = process.env.KORU_APP_SECRET || '';

        if (!this.koruAppId || !this.koruAppSecret) {
            console.warn('⚠️  KORU_APP_ID or KORU_APP_SECRET not set. User login will not work.');
        }
    }

    /**
     * Verify credentials with Koru Suite API
     * Uses the /api/auth/widget endpoint
     */
    async verifyCredentials(credentials: KoruCredentials): Promise<KoruAuthorizeResponse | null> {
        try {
            const response = await axios.get<KoruAuthorizeResponse>(
                `${this.koruApiUrl}/api/auth/widget`,
                {
                    params: {
                        website_id: credentials.websiteId,
                        app_id: credentials.appId,
                    },
                    timeout: 10000, // 10 second timeout
                }
            );

            if (response.data.authorized) {
                return response.data;
            }

            return null;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 403) {
                    console.error('Koru authorization failed: App not active or validation failed');
                } else if (error.response?.status === 400) {
                    console.error('Koru authorization failed: Missing required parameters');
                } else {
                    console.error('Koru API error:', error.message);
                }
            } else {
                console.error('Koru verification error:', error);
            }
            return null;
        }
    }

    /**
     * Get widget configuration without re-authorization
     * Uses the /api/config endpoint (lightweight polling)
     * Use this for config updates instead of full re-authorization
     */
    async getConfig(credentials: KoruCredentials): Promise<KoruConfigResponse | null> {
        try {
            const response = await axios.get<KoruConfigResponse>(
                `${this.koruApiUrl}/api/config`,
                {
                    params: {
                        website_id: credentials.websiteId,
                        app_id: credentials.appId,
                    },
                    timeout: 10000, // 10 second timeout
                }
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 403) {
                    console.error('Koru config fetch failed: App not active or validation failed');
                } else if (error.response?.status === 400) {
                    console.error('Koru config fetch failed: Missing required parameters');
                } else if (error.response?.status === 404) {
                    console.error('Koru config fetch failed: Widget/App not found');
                } else {
                    console.error('Koru API error:', error.message);
                }
            } else {
                console.error('Koru config fetch error:', error);
            }
            return null;
        }
    }

    /**
     * Login user with Koru credentials (username/password)
     * Uses the /api/auth/login endpoint (Identity Broker)
     */
    async loginUser(credentials: KoruLoginCredentials): Promise<KoruLoginResponse | null> {
        try {
            const response = await axios.post<KoruLoginResponse>(
                `${this.koruApiUrl}/api/auth/login`,
                {
                    username: credentials.username,
                    password: credentials.password,
                },
                {
                    headers: {
                        'X-App-ID': this.koruAppId,
                        'X-App-Secret': this.koruAppSecret,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000, // 10 second timeout
                }
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    console.error('Koru login failed: Invalid username or password');
                } else if (error.response?.status === 403) {
                    console.error('Koru login failed: App not authorized or inactive');
                } else if (error.response?.status === 400) {
                    console.error('Koru login failed: Missing required parameters');
                } else {
                    console.error('Koru API error:', error.message);
                }
            } else {
                console.error('Koru login error:', error);
            }
            return null;
        }
    }

    /**
     * Development mode: bypass Koru API for testing
     */
    async verifyCredentialsDev(credentials: KoruCredentials): Promise<boolean> {
        // In development, accept any non-empty credentials
        return !!(credentials.websiteId && credentials.appId);
    }

    /**
     * Development mode: mock config response for testing
     */
    async getConfigDev(credentials: KoruCredentials): Promise<KoruConfigResponse | null> {
        // In development, return mock config
        if (credentials.websiteId && credentials.appId) {
            return {
                config: {
                    accentColor: '#00C896',
                    displayMode: 'modal',
                    triggerText: 'Book Now',
                    apiUrl: 'http://localhost:4000/api',
                },
                app_name: 'Koru Booking Widget (Dev)',
                is_widget: true,
                app_manifest: {
                    version: '1.0.0',
                    features: ['booking', 'calendar', 'notifications'],
                },
            };
        }
        return null;
    }

    /**
     * Development mode: mock login for testing
     */
    async loginUserDev(credentials: KoruLoginCredentials): Promise<KoruLoginResponse | null> {
        // In development, accept any non-empty credentials and return mock response
        if (credentials.username && credentials.password) {
            // Create a mock JWT with user info for testing
            const mockPayload = {
                sub: 'dev-user-id',
                username: credentials.username,
                email: `${credentials.username}@dev.test`,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
            };

            // Base64 encode (not a real JWT signature, just for dev)
            const mockToken = 'dev.' + Buffer.from(JSON.stringify(mockPayload)).toString('base64') + '.mock';

            return {
                access_token: mockToken,
                token_type: 'Bearer',
                expires_in: 3600,
                expires_at: new Date(Date.now() + 3600000).toISOString(),
                app_id: 'dev-app-id',
                websites: [
                    {
                        id: 'dev-website-id',
                        url: 'http://localhost:3000',
                    },
                ],
                user: {
                    id: 'dev-user-id',
                    email: `${credentials.username}@dev.test`,
                    name: credentials.username,
                    role: 'client',
                },
            };
        }
        return null;
    }
}

export const koruService = new KoruService();
