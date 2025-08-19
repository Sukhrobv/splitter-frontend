import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { useState } from 'react';
import { register as registerUser, RegisterRequest } from '../api';
import { saveToken } from '@/shared/lib/utils/token-storage';
import { useAppStore } from '@/shared/lib/stores/app-store';

const schema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterForm() {
  const { handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', email: '', password: '' },
  });
  const setAuth = useAppStore((s) => s.setAuth);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (values: RegisterRequest) => {
    console.log('🚀 REGISTER: Form submitted with values:', values);
    console.log('🔍 REGISTER: Form errors:', errors);
    
    try {
      setIsLoading(true);
      console.log('📤 REGISTER: Sending request...');
      
      const res = await registerUser(values);
      console.log('✅ REGISTER: Success response:', res);
      
      await saveToken(res.token);
      console.log('💾 REGISTER: Token saved');
      
      setAuth(res.token, res.user);
      console.log('🔐 REGISTER: Auth state updated');
      
      router.replace('/');
      console.log('🔄 REGISTER: Redirecting to home');
    } catch (error: any) {
      console.error('❌ REGISTER: Error occurred:', error);
      Alert.alert(
        'Registration Error', 
        error.message || 'An error occurred during registration'
      );
    } finally {
      setIsLoading(false);
      console.log('🏁 REGISTER: Loading finished');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Username"
        style={{ 
          marginBottom: 12, 
          borderWidth: 1, 
          padding: 12,
          borderRadius: 8,
          borderColor: errors.username ? 'red' : '#ddd'
        }}
        onChangeText={(text) => {
          console.log('👤 REGISTER: Username input changed:', text);
          setValue('username', text);
        }}
      />
      {errors.username && (
        <Text style={{ color: 'red', marginBottom: 8, fontSize: 12 }}>
          {errors.username.message}
        </Text>
      )}
      
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
          console.log('📧 REGISTER: Email input changed:', text);
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
          console.log('🔒 REGISTER: Password input changed, length:', text.length);
          setValue('password', text);
        }}
      />
      {errors.password && (
        <Text style={{ color: 'red', marginBottom: 8, fontSize: 12 }}>
          {errors.password.message}
        </Text>
      )}
      
      <Button 
        title={isLoading ? "Registering..." : "Register"} 
        onPress={() => {
          console.log('🔘 REGISTER: Button clicked!');
          console.log('⚡ REGISTER: Calling handleSubmit...');
          handleSubmit(onSubmit)();
        }}
        disabled={isLoading}
      />
    </View>
  );
}