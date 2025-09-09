// app/tabs/index.tsx
import React from 'react';
import { Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, View, Circle } from 'tamagui';
import { ScanLine, Users, UserPlus } from '@tamagui/lucide-icons';

import { ScreenContainer } from '@/shared/ui/ScreenContainer';

// кнопка действия 171×48 (из фигмы)
function ActionButton({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <XStack
      onPress={onPress}
      width={171}
      height={48}
      borderRadius={12}
      alignItems="center"
      justifyContent="center"
      gap={6}
      borderWidth={1}
      borderColor="$gray6"
      backgroundColor="transparent"
      pressStyle={{ backgroundColor: '$gray2' }}
      hoverStyle={{ backgroundColor: '$gray2' }}
      focusStyle={{ borderColor: '$gray7' }}
    >
      {icon}
      <Text fontSize={14}>{title}</Text>
    </XStack>
  );
}

// стек аватаров 92×28 (заглушки)
function AvatarStack({ count }: { count: number }) {
  const shown = Math.min(3, count);
  const extra = Math.max(0, count - shown);
  return (
    <XStack w={92} h={28} ai="center">
      {Array.from({ length: shown }).map((_, i) => (
        <View
          key={i}
          w={28}
          h={28}
          br={14}
          backgroundColor="$gray5"
          borderWidth={2}
          borderColor="white"
          ml={i === 0 ? 0 : -8}
        />
      ))}
      {extra > 0 && (
        <View
          w={28}
          h={28}
          br={14}
          backgroundColor="$gray3"
          borderWidth={2}
          borderColor="white"
          ml={shown === 0 ? 0 : -8}
          ai="center"
          jc="center"
        >
          <Text fontSize={10} color="$gray11">
            +{extra}
          </Text>
        </View>
      )}
    </XStack>
  );
}

// карточка 358×110
function BillCard({
  title,
  sub,
  amount,
  participants,
}: {
  title: string;
  sub: string;
  amount: number;
  participants: number;
}) {
  return (
    <YStack
      w={358}
      h={110}
      br={12}
      borderWidth={1}
      borderColor="$gray6"
      p="$3"
      backgroundColor="white"
    >
      <XStack jc="space-between" ai="center">
        <YStack>
          <Text fontSize={16} fontWeight="600" lineHeight={19}>
            {title}
          </Text>
          <Text mt="$1" fontSize={12} lineHeight={12} color="$gray10">
            {sub}
          </Text>
        </YStack>
        <Text fontSize={14} lineHeight={22} fontWeight="700" color="#2ECC71">
          UZS {amount.toLocaleString()}
        </Text>
      </XStack>

      <XStack mt="auto" jc="space-between" ai="center">
        <AvatarStack count={participants} />
        <View w={36} h={36} br={18} backgroundColor="$gray5" />
      </XStack>
    </YStack>
  );
}

export default function HomePage() {
  const router = useRouter();

  // Можешь вернуть Alert, если это отдельно "скан чека".
  // Для MVP инвайтов удобнее сразу открыть наш экран сканера:

  const openFriends = () => {
    router.push('/tabs/friends');
  };

  const openGroups = () => {
    router.push('/tabs/groups');
  };

  const onScan = () => {
    router.push('./scan-invite');
  };

  // временные карточки
  const recent = [
    { id: 1, title: 'Sushi kechasi', sub: '25-avgust • 5 participants', amount: 95000, participants: 5 },
    { id: 2, title: 'Evos',          sub: '25-avgust • 3 participants', amount: 55000, participants: 3 },
    { id: 3, title: "Tug'ilgan kun", sub: '25-avgust • 11 participants', amount: 55000, participants: 11 },
  ];

  return (
    <ScreenContainer>
      <YStack f={1} ai="center" bg="white">
        {/* Scan: circle 64, icon 26 */}
        <YStack ai="center" mt="$6" mb="$4">
          <Pressable onPress={onScan}>
            <Circle size={64} bg="#2ECC71" ai="center" jc="center" elevationAndroid={4}>
              <ScanLine size={26} color="white" />
            </Circle>
          </Pressable>
          <Text mt="$2" color="$gray10" fontSize={13}>
            Scan invite
          </Text>
        </YStack>

        {/* Friends / Groups — 171×48 */}
        <XStack w={358} jc="space-between" mb="$5">
          <ActionButton title="Friends" icon={<Users size={18} />} onPress={openFriends} />
          <ActionButton title="Groups" icon={<UserPlus size={18} />} onPress={openGroups} />
        </XStack>

        {/* Recent bills */}
        <XStack w={358} jc="space-between" ai="center" mb="$3">
          <Text fontSize={18} fontWeight="600">
            Recent bills
          </Text>
          <Pressable onPress={() => Alert.alert('Coming soon')}>
            <Text color="#2ECC71">Show more</Text>
          </Pressable>
        </XStack>

        <YStack gap="$3" pb="$6">
          {recent.map((b) => (
            <BillCard
              key={b.id}
              title={b.title}
              sub={b.sub}
              amount={b.amount}
              participants={b.participants}
            />
          ))}
        </YStack>
      </YStack>
    </ScreenContainer>
  );
}
