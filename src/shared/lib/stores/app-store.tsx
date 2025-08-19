import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, removeToken } from '../utils/token-storage';

export interface User {
  id: number;
  email: string;
  username: string;
  uniqueId: string;
}

interface AppStore {
  // Auth state
  token: string | null;
  user: User | null;
  isLoading: boolean;
  
  // App settings
  theme: 'light' | 'dark';
  language: 'en' | 'ja' | 'ru';
  
  // Actions
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setAuth: (token: string, user: User) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'en' | 'ja' | 'ru') => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      token: null,
      user: null,
      isLoading: false,
      theme: 'light',
      language: 'ru',

      // Auth actions
      setToken: (token: string) => {
        set({ token });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setAuth: (token: string, user: User) => {
        set({ token, user });
      },

      logout: async () => {
        try {
          await removeToken();
          set({ token: null, user: null });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      initializeAuth: async () => {
        try {
          set({ isLoading: true });
          const token = await getToken();
          if (token) {
            set({ token });
            // Здесь можно загрузить информацию о пользователе
            // const user = await getCurrentUser(token);
            // set({ user });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ token: null, user: null });
        } finally {
          set({ isLoading: false });
        }
      },

      // App settings actions
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        // Не сохраняем токен и пользователя в AsyncStorage, 
        // так как токен сохраняется отдельно в SecureStore
      }),
    }
  )
);

// Provider component for initialization
import { ReactNode, useEffect } from 'react';

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const initializeAuth = useAppStore((s) => s.initializeAuth);
  
  useEffect(() => {
    initializeAuth();
  }, []);
  
  return <>{children}</>;
}