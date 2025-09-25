// app/tabs/_layout.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, XStack, Text, View, Popover, Separator } from 'tamagui';
import { Home, Settings, Bell, ChevronLeft, Copy, LogOut } from '@tamagui/lucide-icons';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

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
  const routeName = props?.route?.name ?? '';
  const showHomeShortcut =
    routeName.startsWith('friends') ||
    routeName.startsWith('groups') ||
    routeName.startsWith('sessions');
  const onBackToHome = () => router.replace('/tabs');

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchAll();
    });
    return () => sub.remove();
  }, [fetchAll]);

  const requestsCount = useFriendsStore((s) => s.requestsRaw?.incoming?.length ?? 0);
  const [profileOpen, setProfileOpen] = useState(false);
  const displayName = user?.username || 'Guest';
  const userInitial = displayName.slice(0, 1).toUpperCase();
  const userId = user?.uniqueId ?? '';
  const visibleUserId = userId || 'N/A';

  const handleCopyId = useCallback(async () => {
    if (!userId) {
      Alert.alert('Unavailable', 'User ID is not available yet.');
      return;
    }
    await Clipboard.setStringAsync(userId);
    Alert.alert('Copied', 'Your ID has been copied to the clipboard.');
  }, [userId]);

  const closeMenu = useCallback(() => setProfileOpen(false), []);

  const handleSettings = useCallback(() => {
    closeMenu();
    router.push('/tabs/settings');
  }, [closeMenu, router]);

  const handleLogout = useCallback(() => {
    closeMenu();
    logout()
      .then(() => router.replace('/'))
      .catch(() => Alert.alert('Error', 'Could not log out. Please try again.'));
  }, [closeMenu, logout, router]);

  return (
    <YStack bg="$background" pt={insets.top}>
      <XStack h={50} ai="center" jc="space-between" px="$4">
        <XStack ai="center" gap="$2">
          {showHomeShortcut && (
            <Pressable onPress={onBackToHome} hitSlop={10}>
              <XStack ai="center" gap="$1">
                <ChevronLeft size={20} color="$gray11" />
                <Text fontSize={14} color="$gray11">
                  {t('navigation.mainMenu', 'Main menu')}
                </Text>
              </XStack>
            </Pressable>
          )}
          <Text fontSize={18} fontWeight="600" numberOfLines={1} miw={150}>
            {props.options.title}
          </Text>
        </XStack>

        <XStack ai="center" gap="$3">
          <Pressable onPress={() => router.push('/tabs/friends/requests')}>
            <View>
              <Bell size={22} color="$gray11" />
              <DotBadge value={requestsCount} />
            </View>
          </Pressable>

         <Popover open={profileOpen} onOpenChange={setProfileOpen}>
  <Popover.Trigger asChild>
    <Pressable hitSlop={10}>
      <View w={36} h={36} br={18} backgroundColor="$gray5" ai="center" jc="center">
        <Text>{userInitial}</Text>
      </View>
    </Pressable>
  </Popover.Trigger>

  {/* Применяем стили напрямую к Popover.Content */}
  <Popover.Content
    w={220}
    gap="$3"
    borderRadius={12}
    borderWidth={1}
    borderColor="$gray5"
    padding={12}
    backgroundColor="$color1"
    elevation="$4"
  >
    {/* Popover.Arrow теперь прямой дочерний элемент */}
    <Popover.Arrow size={14} borderWidth={1} borderColor="$gray5" backgroundColor="$color1" />

    {/* Остальной контент находится внутри отдельного YStack */}
    <YStack gap="$3">
      <XStack ai="center" gap="$2">
        <View w={42} h={42} br={21} backgroundColor="$gray5" ai="center" jc="center">
          <Text fontSize={18} fontWeight="600">{userInitial}</Text>
        </View>
        <YStack>
          <Text fontSize={16} fontWeight="600">{displayName}</Text>
          {user?.email && <Text fontSize={12} color="$gray9">{user.email}</Text>}
        </YStack>
      </XStack>

      <XStack ai="center" jc="space-between">
        <Text fontSize={12} color="$gray9">ID: {visibleUserId}</Text>
        <Pressable onPress={handleCopyId} hitSlop={8}>
          <XStack ai="center" gap={6}>
            <Copy size={16} color="#2ECC71" />
            <Text fontSize={12} color="#2ECC71">Copy</Text>
          </XStack>
        </Pressable>
      </XStack>

      <Separator />

      <YStack gap="$2">
        <Pressable onPress={handleSettings} hitSlop={8}>
          <XStack ai="center" gap="$2" py={6}>
            <Settings size={18} color="$gray11" />
            <Text fontSize={14} color="$gray12">Settings</Text>
          </XStack>
        </Pressable>
        <Separator />
        <Pressable onPress={handleLogout} hitSlop={8}>
          <XStack ai="center" gap="$2" py={6}>
            <LogOut size={18} color="#E74C3C" />
            <Text fontSize={14} color="#E74C3C">Log out</Text>
          </XStack>
        </Pressable>
      </YStack>
    </YStack>
  </Popover.Content>
</Popover>
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
        tabBarStyle: { display: 'none' },
      }}
    >
      {/* Home & Settings tabs (hidden from bar) */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
          title: `Hi, ${user?.username || 'friend'}!`,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />

      {/* Friends stack (hidden) */}
      <Tabs.Screen name="friends/index" options={{ href: null, title: t('friends.title', 'Friends') }} />
      <Tabs.Screen name="friends/search" options={{ href: null, title: t('friends.search', 'Search') }} />
      <Tabs.Screen name="friends/requests" options={{ href: null, title: t('friends.requests', 'Requests') }} />

      {/* HIDDEN: Groups */}
      <Tabs.Screen name="groups/index"   options={{ href: null, title: 'Groups' }} />
      <Tabs.Screen name="groups/create"  options={{ href: null, title: 'New group' }} />
      <Tabs.Screen name="groups/[groupId]" options={{ href: null, title: 'Group' }} />

      <Tabs.Screen name="scan-invite" options={{ href: null, title: 'Scan Invite' }} />
      <Tabs.Screen name="friends/invite" options={{ href: null, title: 'My Friend QR' }} />
      <Tabs.Screen name="groups/invite" options={{ href: null, title: 'Group QR' }} />

      <Tabs.Screen name="scan-receipt" options={{ href: null, title: 'Scan Receipt' }} />
      <Tabs.Screen name="sessions/participants" options={{ href: null, title: 'Participants' }} />
      <Tabs.Screen name="sessions/items-split" options={{ href: null, title: 'Items Split' }} />
      <Tabs.Screen name="sessions/finish" options={{ href: null, title: 'Finish' }} />
      <Tabs.Screen name="sessions/history/index" options={{ href: null, title: 'Recent bills' }} />
      <Tabs.Screen name="sessions/history/[historyId]" options={{ href: null, title: 'Bill details' }} />

    </Tabs>
  );
}

