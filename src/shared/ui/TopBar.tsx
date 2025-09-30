import React from 'react';
import { Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack, Text, Circle } from 'tamagui';
import { Bell } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useAppStore } from '@/shared/lib/stores/app-store';
import UserAvatar from '@/shared/ui/UserAvatar';
import { useFriendsStore } from '@/features/friends/model/friends.store';

type Props = {
  title?: string;
  greeting?: boolean; // если true — "Hi, <name>!"
};

export default function TopBar({ title, greeting = false }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAppStore();
  const userInitial = (user?.username?.[0] ?? 'U').toUpperCase();

  // безопасно читаем количество заявок (без жёстких типов)
  const requestsCount = useFriendsStore((s: any) =>
    Array.isArray(s?.incoming)
      ? s.incoming.length
      : Array.isArray(s?.requests?.incoming)
      ? s.requests.incoming.length
      : 0
  );

  const onBellPress = () => router.push('/tabs/friends/requests');

  const onAvatarPress = () => {
    Alert.alert(
      user?.username ?? 'Profile',
      `${user?.email ?? ''}\nID: ${user?.uniqueId ?? '—'}`,
      [
        {
          text: 'Copy ID',
          onPress: async () => user?.uniqueId && (await Clipboard.setStringAsync(user.uniqueId)),
        },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Log out?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Log out',
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

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: 'white', paddingTop: insets.top }}>
      <XStack
        ai="center"
        jc="space-between"
        px="$4"
        py="$3"
        borderBottomWidth={1}
        borderColor="$gray5"
      >
        <YStack>
          {greeting && user?.username ? (
            <Text fontSize="$6" fontWeight="700">Hi, {user.username}!</Text>
          ) : (
            <Text fontSize="$6" fontWeight="700">{title ?? ''}</Text>
          )}
        </YStack>

        <XStack ai="center" gap="$3">
          <XStack ai="center" position="relative" pressStyle={{ opacity: 0.7 }} onPress={onBellPress}>
            <Bell size={20} color="$gray11" />
            {requestsCount > 0 && (
              <Circle
                size={10}
                backgroundColor="#2ECC71"
                position="absolute"
                top={-2}
                right={-2}
                borderWidth={1}
                borderColor="$background"
              />
            )}
          </XStack>

          {/* Аватар по первой букве имени */}
          <XStack pressStyle={{ opacity: 0.8 }} onPress={onAvatarPress}>
            <UserAvatar uri={user?.avatarUrl ?? undefined} label={userInitial} size={28} textSize={14} backgroundColor="$gray4" />
          </XStack>
        </XStack>
      </XStack>
    </SafeAreaView>
  );
}
