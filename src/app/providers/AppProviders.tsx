import { ReactNode } from 'react';
import QueryProvider from './QueryProvider';
import StoreProvider from './StoreProvider';
import I18nProvider from './I18nProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <StoreProvider>
      <QueryProvider>
        <I18nProvider>{children}</I18nProvider>
      </QueryProvider>
    </StoreProvider>
  );
}