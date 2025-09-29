import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { YStack, XStack, Text, View, Button, Separator, ListItem } from 'tamagui';
import { Copy, Settings, LogOut, ChevronRight } from '@tamagui/lucide-icons';

import { ScreenContainer } from '@/shared/ui/ScreenContainer';
import { useAppStore } from '@/shared/lib/stores/app-store';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAppStore();

  const displayName = user?.username || 'Guest';
  const userInitial = displayName.slice(0, 1).toUpperCase();
  const email = user?.email;
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

  const handleOpenSettings = useCallback(() => {
    router.push({ pathname: '/tabs/settings' });
  }, [router]);

  const handleLogout = useCallback(() => {
    logout()
      .then(() => router.replace({ pathname: '/' }))
      .catch(() => Alert.alert('Error', 'Could not log out. Please try again.'));
  }, [logout, router]);

  return (
    <ScreenContainer>
      <YStack gap="$6">
        <YStack ai="center" gap="$3" mt="$4">
          <View w={72} h={72} br={36} backgroundColor="$gray5" ai="center" jc="center">
            <Text fontSize={28} fontWeight="700">
              {userInitial}
            </Text>
          </View>
          <YStack ai="center" gap="$1">
            <Text fontSize={20} fontWeight="700">
              {displayName}
            </Text>
            {email && (
              <Text color="$gray9">
                {email}
              </Text>
            )}
          </YStack>
        </YStack>

        <YStack gap="$3">
          <YStack gap="$1">
            <Text fontSize={12} color="$gray9">
              User ID
            </Text>
            <XStack ai="center" jc="space-between">
              <Text fontSize={16} fontWeight="600">
                {visibleUserId}
              </Text>
              <Button
                size="$2"
                variant="outlined"
                icon={<Copy size={16} color="$gray11" />}
                onPress={handleCopyId}
              >
                Copy
              </Button>
            </XStack>
          </YStack>

          <Separator />

          <YStack gap="$3">
            <YStack borderWidth={1} borderColor="$gray5" borderRadius={12} overflow="hidden">
              <ListItem
                hoverTheme
                pressTheme
                onPress={handleOpenSettings}
                icon={<Settings size={18} color="$gray11" />}
                iconAfter={<ChevronRight size={16} color="$gray9" />}
                title="Settings"
              />
            </YStack>

            <Button
              size="$3"
              bg="$red4"
              color="$red11"
              hoverStyle={{ bg: '$red5' }}
              pressStyle={{ bg: '$red6' }}
              icon={<LogOut size={18} color="$red11" />}
              onPress={handleLogout}
            >
              Log out
            </Button>
          </YStack>
        </YStack>
      </YStack>
    </ScreenContainer>
  );
}
