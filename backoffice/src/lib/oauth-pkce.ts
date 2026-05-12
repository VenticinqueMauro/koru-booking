/**
 * PKCE helpers (RFC 7636) para iniciar un Authorization Code Flow contra
 * KoruSuite. Soporta solo S256.
 */

const STORAGE_PREFIX = 'koru-booking-oauth';

function base64UrlFromBytes(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function randomBase64Url(byteLength: number): string {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return base64UrlFromBytes(bytes);
}

async function sha256Base64Url(input: string): Promise<string> {
    const encoded = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return base64UrlFromBytes(new Uint8Array(digest));
}

export interface OauthBootstrap {
    state: string;
    codeChallenge: string;
}

/**
 * Genera state + code_verifier + code_challenge, persiste los secrets en
 * sessionStorage, y devuelve los valores públicos para el redirect.
 */
export async function startOauthFlow(): Promise<OauthBootstrap> {
    const codeVerifier = randomBase64Url(32);
    const state = randomBase64Url(32);
    const codeChallenge = await sha256Base64Url(codeVerifier);

    sessionStorage.setItem(`${STORAGE_PREFIX}-verifier`, codeVerifier);
    sessionStorage.setItem(`${STORAGE_PREFIX}-state`, state);

    return { state, codeChallenge };
}

export interface ConsumedOauthFlow {
    state: string;
    codeVerifier: string;
}

/**
 * Lee y borra los secrets del sessionStorage. Llamar exactamente una vez al
 * recibir el callback de KoruSuite.
 */
export function consumeOauthFlow(): ConsumedOauthFlow | null {
    const codeVerifier = sessionStorage.getItem(`${STORAGE_PREFIX}-verifier`);
    const state = sessionStorage.getItem(`${STORAGE_PREFIX}-state`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}-verifier`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}-state`);
    if (!codeVerifier || !state) return null;
    return { codeVerifier, state };
}
