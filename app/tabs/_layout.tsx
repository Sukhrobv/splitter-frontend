import { Tabs, Redirect } from 'expo-router';
import { useAppStore } from '@/shared/lib/stores/app-store';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';

function LogoutButton() {
  const logout = useAppStore((s) => s.logout);
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Logout?',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            router.replace('/');
          }
        },
      ]
    );
  };

  return (
    <TouchableOpacity 
      onPress={handleLogout}
      style={{ marginRight: 15 }}
    >
      <Text style={{ color: '#EF4444', fontSize: 16 }}>Logout</Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const token = useAppStore(s => s.token);

  // Redirect to welcome page if not authenticated
  if (!token) return <Redirect href="/" />;

  return (
    <Tabs>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          tabBarIcon: () => null,
          headerRight: () => <LogoutButton />
        }} 
      />
      <Tabs.Screen 
        name="explore" 
        options={{ 
          title: 'Explore', 
          tabBarIcon: () => null,
          headerRight: () => <LogoutButton />
        }} 
      />
    </Tabs>
  );
}