import { Redirect, Link } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { useAppStore } from '@/shared/lib/stores/app-store';

export default function Welcome() {
  const token = useAppStore(s => s.token);

  // Если уже залогинен — сразу в табы
  if (token) return <Redirect href="/tabs" />; 

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Welcome 👋</Text>

      <Link href="/login" asChild>
        <Pressable><Text>Log in</Text></Pressable>
      </Link>

      <Link href="/register" asChild>
        <Pressable><Text>Create account</Text></Pressable>
      </Link>
    </View>
  );
}
