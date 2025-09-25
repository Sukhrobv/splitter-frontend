// app/tabs/index.tsx
import React from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, View, Circle } from 'tamagui';
import { ScanLine, Users, UserPlus } from '@tamagui/lucide-icons';

import { ScreenContainer } from '@/shared/ui/ScreenContainer';
import { BILL_HISTORY } from '@/features/sessions/mock/history';

const BULLET = '\u2022';

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

function BillCard({
  title,
  sub,
  amount,
  participants,
  onPress,
}: {
  title: string;
  sub: string;
  amount: number;
  participants: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        width: 358,
        opacity: onPress && pressed ? 0.9 : 1,
      })}
    >
      <YStack
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

        <XStack mt="auto" ai="center">
          <AvatarStack count={participants} />
        </XStack>
      </YStack>
    </Pressable>
  );
}

export default function HomePage() {
  const router = useRouter();

  const openFriends = () => {
    router.push('/tabs/friends');
  };

  const openGroups = () => {
    router.push('/tabs/groups');
  };

  const onScan = () => {
    router.push('/tabs/scan-receipt');
  };

  const recent = BILL_HISTORY.slice(0, 3);

  return (
    <ScreenContainer>
      <YStack f={1} ai="center" bg="white">
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

        <XStack w={358} jc="space-between" mb="$5">
          <ActionButton title="Friends" icon={<Users size={18} />} onPress={openFriends} />
          <ActionButton title="Groups" icon={<UserPlus size={18} />} onPress={openGroups} />
        </XStack>

        <XStack w={358} jc="space-between" ai="center" mb="$3">
          <Text fontSize={18} fontWeight="600">
            Recent bills
          </Text>
          <Pressable onPress={() => router.push('/tabs/sessions/history')}>
            <Text color="#2ECC71">Show more</Text>
          </Pressable>
        </XStack>

        <YStack gap="$3" pb="$6">
          {recent.map((bill) => {
            const summary = `${bill.date} ${BULLET} ${bill.participantsCount} ishtirokchi`;
            return (
              <BillCard
                key={bill.id}
                title={bill.title}
                sub={summary}
                amount={bill.totalAmount}
                participants={bill.participantsCount}
                onPress={() =>
                  router.push({ pathname: '/tabs/sessions/history/[historyId]', params: { historyId: bill.id } })
                }
              />
            );
          })}
        </YStack>
      </YStack>
    </ScreenContainer>
  );
}
