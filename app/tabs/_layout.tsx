import React from 'react';
import { Tabs, Redirect, useRouter } from 'expo-router';
import { Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, XStack, Text, View } from 'tamagui';
import { Bell } from '@tamagui/lucide-icons';

import { useAppStore } from '@/shared/lib/stores/app-store';
import { useFriendsStore } from '@/features/friends/model/friends.store';

function DotBadge({ value }: { value?: number }) {
  if (!value || value <= 0) return null;
  return (
    <View
      position="absolute"
      top={-4}
      right={-4}
      w={20}
      h={20}
      br={999}
      ai="center"
      jc="center"
      backgroundColor="#2ECC71"
    >
      <Text color="white" fontSize={10} fontWeight="700">
        {value}
      </Text>
    </View>
  );
}

/**
 * Кастомный header только для Home (tabs/index).
 * ВЫСОТУ/ОТСТУП регулируй здесь:
 *   - HEADER_EXTRA_TOP — дополнительный отступ сверху (в доп. к safe area)
 *   - нижняя граница и высота строки: h={46}
 */
function HomeHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAppStore();

  // аккуратно считаем бейдж входящих заявок при любой форме стора
  const requestsCount = useFriendsStore((s: any) =>
    Array.isArray(s?.incoming)
      ? s.incoming.length
      : Array.isArray(s?.requests?.incoming)
      ? s.requests.incoming.length
      : 0
  );

  const HEADER_EXTRA_TOP = 6; // ← подними/опусти хедер, если нужно

  const onAvatarPress = async () => {
    Alert.alert(
      user?.username || 'Profile',
      `${user?.email ?? ''}\nID: ${user?.uniqueId ?? '—'}`,
      [
        {
          text: 'Copy ID',
          onPress: async () => {
            try {
              const Clipboard = await import('expo-clipboard');
              await Clipboard.setStringAsync(user?.uniqueId ?? '');
              Alert.alert('Copied', 'ID copied to clipboard');
            } catch {}
          },
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Logout?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                  await logout();
                  router.replace('/');
                },
              },
            ]),
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const openRequests = () => router.push('/tabs/friends/requests' as any);

  return (
    <YStack bg="white" pt={insets.top + HEADER_EXTRA_TOP} pb="$2">
      <XStack
        maxWidth={358}
        w="100%"
        h={46}
        ai="center"
        jc="space-between"
        alignSelf="center"
        borderBottomWidth={1}
        borderColor="$gray5"
        px="$2"
      >
        <Text fontSize={16} fontWeight="600" numberOfLines={1}>
          Hi, {user?.username || 'friend'}!
        </Text>

        <XStack ai="center" gap="$3">
          {/* Bell + badge */}
          <Pressable
            onPress={openRequests}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            accessibilityRole="button"
            accessibilityLabel="Friend requests"
          >
            <View w={17} h={18} ai="center" jc="center">
              <Bell size={18} color="#111" />
            </View>
            <DotBadge value={requestsCount} />
          </Pressable>

          {/* Avatar (инициала) */}
          <Pressable
            onPress={onAvatarPress}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <View w={36} h={36} br={18} backgroundColor="$gray5" ai="center" jc="center">
              <Text>{(user?.username || 'U').slice(0, 1)}</Text>
            </View>
          </Pressable>
        </XStack>
      </XStack>
    </YStack>
  );
}

export default function TabLayout() {
  const token = useAppStore((s) => s.token);
  if (!token) return <Redirect href="/" />;

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          // убираем дефолтный заголовок, рендерим СВОЙ header
          headerTitle: '',
          header: () => <HomeHeader />,
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          headerTitle: 'Settings',
          tabBarLabel: 'Settings',
        }}
      />
    </Tabs>
  );
}
