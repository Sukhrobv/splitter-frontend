import { ReactNode } from 'react';
import QueryProvider from './QueryProvider';
import I18nProvider from './I18nProvider';
import { AppStoreProvider } from '@/shared/lib/stores/app-store';

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppStoreProvider>
      <QueryProvider>
        <I18nProvider>{children}</I18nProvider>
      </QueryProvider>
    </AppStoreProvider>
  );
}
