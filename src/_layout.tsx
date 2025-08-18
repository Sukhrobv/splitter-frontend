import { useEffect } from 'react';
import { Stack } from 'expo-router';
import AppProviders from './app/providers/AppProviders';
import { useAppStore } from './shared/lib/stores/app-store';
import { getToken } from './shared/lib/utils/token-storage';

export default function RootLayout() {
  const token = useAppStore((s) => s.token);
  const setToken = useAppStore((s) => s.setToken);

  useEffect(() => {
    (async () => {
      const stored = await getToken();
      if (stored) setToken(stored);
    })();
  }, [setToken]);

  return (
    <AppProviders>
      <Stack>
        {token ? (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: 'Login' }} />
            <Stack.Screen name="register" options={{ title: 'Register' }} />
          </>
        )}
      </Stack>
    </AppProviders>
  );
}