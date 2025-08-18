import { ReactNode, createContext, useContext, useRef, useEffect } from 'react';
import { StoreApi, createStore, useStore } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AppState {
  isLoading: boolean;
  user: User | null;
  token: string | null;
  theme: 'light' | 'dark';
  language: 'en' | 'ja';
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
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
    token: null,
    theme: 'light',
    language: 'en',
    setLoading: (loading) => set({ isLoading: loading }),
    setUser: (user) => set({ user }),
    login: async (token, user) => {
      await SecureStore.setItemAsync('token', token);
      set({ token, user });
    },
    logout: async () => {
      await SecureStore.deleteItemAsync('token');
      set({ token: null, user: null });
    },
    setTheme: (theme) => set({ theme }),
    setLanguage: (language) => set({ language }),
  }));

const StoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    storeRef.current = createAppStore();
  }
  useEffect(() => {
    const init = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        storeRef.current?.setState({ token });
      }
    };
    init();
  }, []);
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
