import { ReactNode, createContext, useContext, useRef } from 'react';
import { StoreApi, createStore, useStore } from 'zustand';

interface AppState {
  isLoading: boolean;
  user: User | null;
  theme: 'light' | 'dark';
  language: 'en' | 'ja';
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

type AppStore = StoreApi<AppState>;

const createAppStore = () =>
  createStore<AppState>((set) => ({
    isLoading: false,
    user: null,
    theme: 'light',
    language: 'en',
    setLoading: (loading) => set({ isLoading: loading }),
    setUser: (user) => set({ user }),
    setTheme: (theme) => set({ theme }),
    setLanguage: (language) => set({ language }),
  }));

const StoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    storeRef.current = createAppStore();
  }
  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
}

export function useAppStore<T>(selector: (state: AppState) => T) {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('AppStoreProvider is missing');
  }
  return useStore(store, selector);
}
