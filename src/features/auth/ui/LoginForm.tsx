import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, TextInput, Button } from 'react-native';
import { login, LoginRequest } from '../api';
import { saveToken } from '@/shared/lib/utils/token-storage';
import { useAppStore } from '@/shared/lib/stores/app-store';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const { handleSubmit, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  const setToken = useAppStore((s) => s.setToken);
  const router = useRouter();

  const onSubmit = async (values: LoginRequest) => {
    const res = await login(values);
    await saveToken(res.token);
    setToken(res.token);
    router.replace('/');
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ marginBottom: 12, borderWidth: 1, padding: 8 }}
        onChangeText={(text) => setValue('email', text)}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={{ marginBottom: 12, borderWidth: 1, padding: 8 }}
        onChangeText={(text) => setValue('password', text)}
      />
      <Button title="Login" onPress={handleSubmit(onSubmit)} />
    </View>
  );
}
