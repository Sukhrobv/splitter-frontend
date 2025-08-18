import { ReactNode } from 'react';
import { AppStoreProvider } from '../../shared/lib/stores/app-store';

interface StoreProviderProps {
  children: ReactNode;
}

export default function StoreProvider({ children }: StoreProviderProps) {
  return <AppStoreProvider>{children}</AppStoreProvider>;
}
