import { ReactNode, createContext, useContext, useRef } from 'react';
import { StoreApi, createStore, useStore } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
  uniqueId: string;
}

interface AppState {
  isLoading: boolean;
  user: User | null;
  token: string | null;
  theme: 'light' | 'dark';
  language: 'en' | 'ja';
  setLoading: (v: boolean) => void;
  setUser: (u: User | null) => void;
  setToken: (t: string | null) => void;
  setTheme: (t: 'light' | 'dark') => void;
  setLanguage: (l: 'en' | 'ja') => void;
}

type AppStore = StoreApi<AppState>;

const createAppStore = () =>
  createStore<AppState>((set) => ({
    isLoading: false,
    user: null,
    token: null,
    theme: 'light',
    language: 'en',
    setLoading: (v) => set({ isLoading: v }),
    setUser: (u) => set({ user: u }),
    setToken: (t) => set({ token: t }),
    setTheme: (t) => set({ theme: t }),
    setLanguage: (l) => set({ language: l }),
  }));

const StoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = createAppStore();
  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
}

export function useAppStore<T = AppState>(selector?: (s: AppState) => T) {
  const store = useContext(StoreContext);
  if (!store) throw new Error('AppStoreProvider is missing');
  return useStore(store, selector ?? ((s) => s as unknown as T));
}