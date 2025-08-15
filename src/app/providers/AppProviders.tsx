import { ReactNode } from 'react';
import QueryProvider from './QueryProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}