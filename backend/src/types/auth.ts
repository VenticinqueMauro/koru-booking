export interface KoruCredentials {
  websiteId: string;
  appId: string;
}

export interface EmailPasswordCredentials {
  email: string;
  password: string;
}

export interface AuthenticatedAccount {
  id: string;
  websiteId: string;
  appId: string;
  businessName?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  name?: string;
}

export interface LoginRequest {
  websiteId: string;
  appId: string;
}

export interface EmailLoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  account?: AuthenticatedAccount;
  user?: AuthenticatedUser;
  isSuperAdmin: boolean;
}
