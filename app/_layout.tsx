import { Stack } from 'expo-router';
import AppProviders from '../src/application/providers/AppProviders';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="tabs" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="register" options={{ title: 'Register' }} />
        <Stack.Screen name="scan-invite" options={{ title: 'Scan Invite' }} />
      </Stack>
    </AppProviders>
  );
}