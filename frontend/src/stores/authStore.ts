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
  error: string | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true, // Start as true to prevent premature redirects on refresh
      error: null,

      setUser: (user) => set({ user, isLoading: false }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res: any = await authApi.login({ email, password });
          if (res.success) {
            set({ user: res.data, isLoading: false });
            return true;
          } else {
            set({ error: res.error, isLoading: false });
            return false;
          }
        } catch (err: any) {
          set({ error: err.response?.data?.error || 'Login failed', isLoading: false });
          return false;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res: any = await authApi.register(data);
          if (res.success) {
            set({ user: res.data, isLoading: false });
            return true;
          } else {
            set({ error: res.error, isLoading: false });
            return false;
          }
        } catch (err: any) {
          set({ error: err.response?.data?.error || 'Registration failed', isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          set({ user: null, error: null, isLoading: false });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const res: any = await authApi.me();
          if (res.success) {
            set({ user: res.data, isLoading: false });
          } else {
            set({ user: null, isLoading: false });
          }
        } catch {
          set({ user: null, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
      // Ensure we don't persist the isLoading state
      onRehydrateStorage: () => (state) => {
        if (state) {
          // After hydration, if we have a user, we might still want to checkAuth 
          // but at least we can stop the initial blank screen
          state.isLoading = false;
        }
      },
    }
  )
);
