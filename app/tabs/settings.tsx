import React from 'react';
import { YStack, Text } from 'tamagui';
import { ScreenContainer } from '@/shared/ui/ScreenContainer';

export default function SettingsScreen() {
  return (
    <ScreenContainer>
      <YStack f={1} ai="center" jc="center">
        <Text fontSize={18} fontWeight="600">Settings</Text>
        <Text mt="$2" color="$gray10">Coming soon</Text>
      </YStack>
    </ScreenContainer>
  );
}
