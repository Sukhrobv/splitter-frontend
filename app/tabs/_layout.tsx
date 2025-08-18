import { Tabs, Redirect } from 'expo-router';
import { useAppStore } from '@/shared/lib/stores/app-store';

export default function TabLayout() {
  const token = useAppStore(s => s.token);

  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs>
      <Tabs.Screen name="index"   options={{ title: 'Home',    tabBarIcon: () => null }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: () => null }} />
    </Tabs>
  );
}
