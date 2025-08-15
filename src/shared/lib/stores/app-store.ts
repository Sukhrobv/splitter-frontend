import { create } from 'zustand';

interface AppState {
  // Глобальное состояние приложения
  isLoading: boolean;
  user: User | null;
  theme: 'light' | 'dark';
  language: 'en' | 'ja';
  
  // Actions
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'en' | 'ja') => void;
}

interface User {
  id: string;
  username: string;
  email: string;
  uniqueId: string;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  isLoading: false,
  user: null,
  theme: 'light',
  language: 'en',
  
  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setUser: (user) => set({ user }),
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
}));