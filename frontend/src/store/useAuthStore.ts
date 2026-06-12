import { create } from 'zustand';
import { User } from '../types';
import { apiFetch } from '../lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (credentials: any) => Promise<void>;
  register: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:unauthorized', () => {
      set({ user: null, isAuthenticated: false });
    });
  }

  return {
    user: null,
    isAuthenticated: false,
    isInitializing: true,

    login: async (credentials) => {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      localStorage.setItem('accessToken', data.accessToken);
      set({ user: data.user as User, isAuthenticated: true });
    },

    register: async (credentials) => {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      localStorage.setItem('accessToken', data.accessToken);
      set({ user: data.user as User, isAuthenticated: true });
    },

    logout: async () => {
      try {
        await apiFetch('/auth/logout', { method: 'POST' });
      } catch (err) {
        console.error('Failed to logout gracefully:', err);
      } finally {
        localStorage.removeItem('accessToken');
        set({ user: null, isAuthenticated: false });
      }
    },

    checkAuth: async () => {
      try {
        const data = await apiFetch('/auth/me');
        set({ user: data.user as User, isAuthenticated: true, isInitializing: false });
      } catch (err) {
        set({ user: null, isAuthenticated: false, isInitializing: false });
      }
    },
  };
});
