/**
 * Utility to decode JWT without verification
 * Used to inspect Koru tokens and extract user information
 */

export interface DecodedKoruToken {
  // Common JWT claims
  iat?: number;  // Issued at
  exp?: number;  // Expiration
  iss?: string;  // Issuer
  sub?: string;  // Subject (usually user ID)

  // Possible Koru-specific claims (to be confirmed)
  userId?: string;
  username?: string;
  email?: string;
  websiteId?: string;
  appId?: string;
  role?: string;
  permissions?: string[];

  // Catch-all for any other properties
  [key: string]: any;
}

/**
 * Decodes a JWT token without verifying the signature
 * SECURITY NOTE: This should only be used after verifying the token with Koru API
 * @param token - The JWT token to decode
 * @returns Decoded token payload
 */
export function decodeJwtWithoutVerification(token: string): DecodedKoruToken | null {
  try {
    // JWT structure: header.payload.signature
    const parts = token.split('.');

    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Base64 URL decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 * @param token - The JWT token to check
 * @returns true if expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeJwtWithoutVerification(token);

  if (!decoded || !decoded.exp) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = decoded.exp * 1000;
  const now = Date.now();

  return now >= expirationTime;
}

/**
 * Gets the expiration date of a JWT token
 * @param token - The JWT token
 * @returns Expiration date or null if not found
 */
export function getTokenExpiration(token: string): Date | null {
  const decoded = decodeJwtWithoutVerification(token);

  if (!decoded || !decoded.exp) {
    return null;
  }

  return new Date(decoded.exp * 1000);
}

/**
 * Extracts user information from Koru JWT
 * @param token - The Koru JWT token
 * @returns User information extracted from token
 */
export function extractKoruUserInfo(token: string): {
  koruUserId: string | null;
  username: string | null;
  email: string | null;
  websiteId: string | null;
  appId: string | null;
} {
  const decoded = decodeJwtWithoutVerification(token);

  if (!decoded) {
    return {
      koruUserId: null,
      username: null,
      email: null,
      websiteId: null,
      appId: null,
    };
  }

  return {
    // Try different possible claim names
    koruUserId: decoded.sub || decoded.userId || decoded.id || null,
    username: decoded.username || decoded.user || null,
    email: decoded.email || null,
    websiteId: decoded.websiteId || decoded.website_id || null,
    appId: decoded.appId || decoded.app_id || null,
  };
}
