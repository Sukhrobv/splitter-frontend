// app/tabs/_layout.tsx

import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, XStack, Text, View } from 'tamagui';
import { Home, Settings, Bell } from '@tamagui/lucide-icons';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';

import { useAppStore } from '@/shared/lib/stores/app-store';
import { useFriendsStore } from '@/features/friends/model/friends.store';

// --- Reusable Badge Component ---
function DotBadge({ value }: { value?: number }) {
  if (!value || value <= 0) return null;
  return (
    <View
      position="absolute"
      top={-4} right={-4}
      w={20} h={20}
      br={999}
      ai="center" jc="center"
      backgroundColor="#2ECC71"
    >
      <Text color="white" fontSize={10} fontWeight="700">
        {value}
      </Text>
    </View>
  );
}

// --- Global Header for all Tabs ---
function GlobalTabsHeader(props: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAppStore();
  const fetchAll = useFriendsStore(s => s.fetchAll);
  const { t } = useTranslation();

    useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // 2) Обновлять при фокусе на табах (когда возвращаемся на Home/любой таб)
  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  // 3) Обновлять при возвращении приложения в foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchAll();
    });
    return () => sub.remove();
  }, [fetchAll]);

  // UX: считаем только входящие как уведомления
  const requestsCount = useFriendsStore((s) => s.requestsRaw?.incoming?.length ?? 0);

  const onAvatarPress = () => {
    Alert.alert(
      user?.username || 'Profile',
      `ID: ${user?.uniqueId ?? '—'}`,
      [
        {
          text: 'Copy ID',
          onPress: async () => {
            if (user?.uniqueId) {
              await Clipboard.setStringAsync(user.uniqueId);
              Alert.alert('Copied', 'Your ID has been copied to the clipboard.');
            }
          },
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => logout().then(() => router.replace('/')),
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  return (
    <YStack bg="$background" pt={insets.top}>
      <XStack h={50} ai="center" jc="space-between" px="$4">
        <Text fontSize={18} fontWeight="600" numberOfLines={1} miw={150}>
          {props.options.title}
        </Text>

        <XStack ai="center" gap="$3">
          <Pressable onPress={() => router.push('/tabs/friends/requests')}>
            <View>
              <Bell size={22} color="$gray11" />
              <DotBadge value={requestsCount} />
            </View>
          </Pressable>

          <Pressable onPress={onAvatarPress}>
            <View w={36} h={36} br={18} backgroundColor="$gray5" ai="center" jc="center">
              <Text>{(user?.username || 'U').slice(0, 1).toUpperCase()}</Text>
            </View>
          </Pressable>
        </XStack>
      </XStack>
    </YStack>
  );
}

export default function TabLayout() {
  const { user } = useAppStore();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        header: (props) => <GlobalTabsHeader {...props} />,
      }}
    >
      {/* ВИДИМЫЕ ТАБЫ */}
      <Tabs.Screen
        name="index"
        options={{
          title: `Hi, ${user?.username || 'friend'}!`,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />

      {/* СКРЫТЫЕ ЭКРАНЫ ДРУЗЕЙ (не появляются как вкладки) */}
      <Tabs.Screen name="friends/index" options={{ href: null, title: t('friends.title', 'Friends') }} />
      <Tabs.Screen name="friends/search" options={{ href: null, title: t('friends.search', 'Search') }} />
      <Tabs.Screen name="friends/requests" options={{ href: null, title: t('friends.requests', 'Requests') }} />

      {/* HIDDEN: Groups */}
      <Tabs.Screen name="groups/index"   options={{ href: null, title: 'Groups' }} />
      <Tabs.Screen name="groups/create"  options={{ href: null, title: 'New group' }} />
      <Tabs.Screen name="groups/[groupId]" options={{ href: null, title: 'Group' }} />
    </Tabs>
  );
}
