import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { useState } from 'react';
import { login, LoginRequest } from '../api';
import { saveToken } from '@/shared/lib/utils/token-storage';
import { useAppStore } from '@/shared/lib/stores/app-store';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const { handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  const setAuth = useAppStore((s) => s.setAuth);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (values: LoginRequest) => {
    console.log('🚀 LOGIN: Form submitted with values:', values);
    console.log('🔍 LOGIN: Form errors:', errors);
    
    try {
      setIsLoading(true);
      console.log('📤 LOGIN: Sending request...');
      
      const res = await login(values);
      console.log('✅ LOGIN: Success response:', res);
      
      await saveToken(res.token);
      console.log('💾 LOGIN: Token saved');
      
      setAuth(res.token, res.user);
      console.log('🔐 LOGIN: Auth state updated');
      
      router.replace('/');
      console.log('🔄 LOGIN: Redirecting to home');
    } catch (error: any) {
      console.error('❌ LOGIN: Error occurred:', error);
      Alert.alert(
        'Login Error', 
        error.message || 'An error occurred during login'
      );
    } finally {
      setIsLoading(false);
      console.log('🏁 LOGIN: Loading finished');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ 
          marginBottom: 12, 
          borderWidth: 1, 
          padding: 12,
          borderRadius: 8,
          borderColor: errors.email ? 'red' : '#ddd'
        }}
        onChangeText={(text) => {
          console.log('📧 LOGIN: Email input changed:', text);
          setValue('email', text);
        }}
      />
      {errors.email && (
        <Text style={{ color: 'red', marginBottom: 8, fontSize: 12 }}>
          {errors.email.message}
        </Text>
      )}
      
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={{ 
          marginBottom: 12, 
          borderWidth: 1, 
          padding: 12,
          borderRadius: 8,
          borderColor: errors.password ? 'red' : '#ddd'
        }}
        onChangeText={(text) => {
          console.log('🔒 LOGIN: Password input changed, length:', text.length);
          setValue('password', text);
        }}
      />
      {errors.password && (
        <Text style={{ color: 'red', marginBottom: 8, fontSize: 12 }}>
          {errors.password.message}
        </Text>
      )}
      
      <Button 
        title={isLoading ? "Logging in..." : "Login"} 
        onPress={() => {
          console.log('🔘 LOGIN: Button clicked!');
          console.log('⚡ LOGIN: Calling handleSubmit...');
          handleSubmit(onSubmit)();
        }}
        disabled={isLoading}
      />
    </View>
  );
}