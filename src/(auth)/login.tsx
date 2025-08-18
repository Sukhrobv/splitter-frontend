import { View, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/shared/lib/stores/app-store';

export default function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const router = useRouter();

  const handleLogin = async () => {
    await login('demo-token', {
      id: '1',
      username: 'demo',
      email: 'demo@example.com',
      uniqueId: 'demo',
    });
    router.replace('app/tabs');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Log in" onPress={handleLogin} />
    </View>
  );
}
