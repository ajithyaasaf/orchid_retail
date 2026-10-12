import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

let checkAuthPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      setUser: (user) => set({ user, isLoading: false, isInitialized: true }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res: any = await authApi.login({ email, password });
          if (res.success) {
            if (res.token && typeof window !== 'undefined') {
              localStorage.setItem('auth_token', res.token);
            }
            set({ user: res.data, isLoading: false, isInitialized: true, error: null });
            return true;
          } else {
            set({ error: res.error || 'Login failed', isLoading: false });
            return false;
          }
        } catch (err: any) {
          set({ error: err.message || 'Login failed', isLoading: false });
          return false;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res: any = await authApi.register(data);
          if (res.success) {
            if (res.token && typeof window !== 'undefined') {
              localStorage.setItem('auth_token', res.token);
            }
            set({ user: res.data, isLoading: false, isInitialized: true, error: null });
            return true;
          } else {
            set({ error: res.error || 'Registration failed', isLoading: false });
            return false;
          }
        } catch (err: any) {
          set({ error: err.message || 'Registration failed', isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
          }
          set({ user: null, error: null, isLoading: false, isInitialized: true });
        }
      },

      checkAuth: async () => {
        if (checkAuthPromise) return checkAuthPromise;

        checkAuthPromise = (async () => {
          try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) {
              set({ user: null, isInitialized: true, isLoading: false });
              return;
            }

            const res: any = await authApi.me();
            if (res.success && res.data) {
              set({ user: res.data, isInitialized: true, isLoading: false, error: null });
            } else {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
              }
              set({ user: null, isInitialized: true, isLoading: false });
            }
          } catch (err: any) {
            const isUnauthorized =
              err?.message &&
              (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized'));
            if (isUnauthorized) {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
              }
              set({ user: null, isInitialized: true, isLoading: false });
            } else {
              set({ isInitialized: true, isLoading: false });
            }
          } finally {
            checkAuthPromise = null;
          }
        })();

        return checkAuthPromise;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.isInitialized = true;
        }
      },
    }
  )
);
