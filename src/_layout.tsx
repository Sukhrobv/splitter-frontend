import { Stack } from 'expo-router';
import AppProviders from './app/providers/AppProviders';
import { useAppStore } from './shared/lib/stores/app-store';

export default function RootLayout() {
  const token = useAppStore((s) => s.token);

  return (
    <AppProviders>
      <Stack
        screenOptions={{ headerShown: false }}
        initialRouteName={token ? 'app/tabs' : '(auth)'}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="app/tabs" options={{ headerShown: false }} />
      </Stack>
    </AppProviders>
  );
}