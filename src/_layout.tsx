import { Stack } from 'expo-router';
import AppProviders from './app/providers/AppProviders';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AppProviders>
  );
}