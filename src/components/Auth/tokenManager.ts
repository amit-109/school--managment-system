import { refreshToken as apiRefreshToken } from './authService';

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp when access token expires
}

class TokenManager {
  private static instance: TokenManager;
  private tokens: Tokens | null = null;
  private refreshPromise: Promise<any> | null = null;

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  setTokens(tokens: { access_token: string; refresh_token: string; expires_in?: number }): void {
    const expiresIn = tokens.expires_in || 1800; // default 30 mins
    this.tokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (expiresIn * 1000)
    };
    localStorage.setItem('tokens', JSON.stringify(this.tokens));
  }

  getAccessToken(): string | null {
    if (!this.tokens) {
      this.loadFromStorage();
    }

    if (this.tokens && this.isTokenExpired()) {
      this.refreshAccessToken();
      return null; // will be available after refresh
    }

    return this.tokens?.accessToken || null;
  }

  private isTokenExpired(): boolean {
    return this.tokens ? Date.now() >= this.tokens.expiresAt : false;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.tokens) return;

    // Prevent multiple concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = apiRefreshToken(this.tokens.refreshToken)
      .then((response) => {
        this.setTokens(response); // assuming response has access_token, refresh_token, expires_in
      })
      .catch(() => {
        // Refresh failed, clear tokens and redirect to login
        this.clearTokens();
        window.location.reload(); // force re-login
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  getRefreshToken(): string | null {
    if (!this.tokens) {
      this.loadFromStorage();
    }
    return this.tokens?.refreshToken || null;
  }

  clearTokens(): void {
    this.tokens = null;
    localStorage.removeItem('tokens');
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('tokens');
    if (stored) {
      try {
        this.tokens = JSON.parse(stored);
      } catch (e) {
        this.clearTokens();
      }
    }
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token;
  }
}

export default TokenManager;
