/**
 * Unified Authentication Session Manager
 * Synchronizes JWT tokens across LocalStorage, Document Cookies, and API headers.
 * Ensures compatibility with Next.js Edge Middleware and cross-domain APIs.
 */

const TOKEN_KEY = 'auth_token';
const COOKIE_NAME = 'auth_token';
const LEGACY_COOKIE_NAME = 'token';
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Try localStorage
  try {
    const lsToken = localStorage.getItem(TOKEN_KEY);
    if (lsToken) return lsToken;
  } catch {}

  // 2. Try document.cookie fallback
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + COOKIE_NAME + '|' + LEGACY_COOKIE_NAME + ')=([^;]*)'));
    if (match && match[3]) {
      return decodeURIComponent(match[3]);
    }
  } catch {}

  return null;
}

export function setAuthSession(token: string): void {
  if (typeof window === 'undefined' || !token) return;

  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}

  try {
    const isHttps = window.location.protocol === 'https:';
    const secureFlag = isHttps ? '; Secure' : '';
    const cookieValue = encodeURIComponent(token);
    
    // Set both cookie names so Edge Middleware and legacy checks have immediate access
    document.cookie = `${COOKIE_NAME}=${cookieValue}; path=/; max-age=${SEVEN_DAYS_SECONDS}; SameSite=Lax${secureFlag}`;
    document.cookie = `${LEGACY_COOKIE_NAME}=${cookieValue}; path=/; max-age=${SEVEN_DAYS_SECONDS}; SameSite=Lax${secureFlag}`;
  } catch (e) {
    console.error('Error saving auth cookie:', e);
  }
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}

  try {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `${LEGACY_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  } catch (e) {
    console.error('Error clearing auth cookie:', e);
  }
}
