import { create } from 'zustand';
import { User } from '@/types/user';
import api from '@/lib/axios';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean; // has the app checked /me yet?
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => set({ user }),

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      set({ user: null });
      window.location.href = '/login';
    }
  },

  // Called once on app startup to restore session from cookie
 initialize: async () => {
  set({ isLoading: true });
  try {
    const res = await api.get('/auth/me');
    set({ user: res.data.user });
  } catch {
    // 401 here is normal — just means no active session
    set({ user: null });
  } finally {
    set({ isLoading: false, isInitialized: true });
  }
},
}));