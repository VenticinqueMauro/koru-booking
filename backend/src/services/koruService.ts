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

export class KoruService {
    private koruApiUrl: string;

    constructor() {
        this.koruApiUrl = process.env.KORU_API_URL || 'https://www.korusuite.com';
    }

    /**
     * Verify credentials with Koru Suite API
     * Uses the /api/widget/authorize endpoint
     */
    async verifyCredentials(credentials: KoruCredentials): Promise<KoruAuthorizeResponse | null> {
        try {
            const response = await axios.get<KoruAuthorizeResponse>(
                `${this.koruApiUrl}/api/widget/authorize`,
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
     * Development mode: bypass Koru API for testing
     */
    async verifyCredentialsDev(credentials: KoruCredentials): Promise<boolean> {
        // In development, accept any non-empty credentials
        return !!(credentials.websiteId && credentials.appId);
    }
}

export const koruService = new KoruService();
