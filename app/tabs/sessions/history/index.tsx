import React from 'react';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { YStack, XStack, Text, ScrollView, View } from 'tamagui';

import { BILL_HISTORY } from '@/features/sessions/mock/history';

const BULLET = '\u2022';

function AvatarGroup({ count }: { count: number }) {
  const shown = Math.min(4, count);
  const extra = Math.max(0, count - shown);
  return (
    <XStack ai="center">
      {Array.from({ length: shown }).map((_, idx) => (
        <View
          key={idx}
          w={28}
          h={28}
          br={14}
          backgroundColor="#E4E7EB"
          borderWidth={2}
          borderColor="white"
          ml={idx === 0 ? 0 : -8}
        />
      ))}
      {extra > 0 && (
        <View
          w={28}
          h={28}
          br={14}
          backgroundColor="#CBD5F5"
          borderWidth={2}
          borderColor="white"
          ml={shown === 0 ? 0 : -8}
          ai="center"
          jc="center"
        >
          <Text fontSize={10} color="$gray11">+{extra}</Text>
        </View>
      )}
    </XStack>
  );
}

function HistoryCard({
  title,
  summary,
  amount,
  participants,
  onPress,
}: {
  title: string;
  summary: string;
  amount: number;
  participants: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ width: 358, opacity: pressed ? 0.9 : 1 })}
    >
      <YStack
        h={110}
        br={12}
        borderWidth={1}
        borderColor="#E4E7EB"
        p="$3"
        backgroundColor="white"
      >
        <XStack jc="space-between" ai="center">
          <YStack>
            <Text fontSize={16} fontWeight="600" lineHeight={19}>
              {title}
            </Text>
            <Text mt="$1" fontSize={12} lineHeight={12} color="$gray10">
              {summary}
            </Text>
          </YStack>
          <Text fontSize={14} lineHeight={22} fontWeight="700" color="#2ECC71">
            UZS {amount.toLocaleString()}
          </Text>
        </XStack>

        <XStack mt="auto" ai="center">
          <AvatarGroup count={participants} />
        </XStack>
      </YStack>
    </Pressable>
  );
}

export default function SessionsHistoryScreen() {
  const router = useRouter();

  return (
    <YStack f={1} bg="$background" px="$4" pt="$4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 32, gap: 16 }}
      >
        <YStack w={358} gap="$1" mb="$2">
          <Text fontSize={24} fontWeight="700">Oxirgi hisoblar</Text>
          <Text fontSize={12} color="$gray10">Bosh sahifa</Text>
        </YStack>

        {BILL_HISTORY.map((bill) => {
          const summary = `${bill.date} ${BULLET} ${bill.participantsCount} ishtirokchi`;
          return (
            <HistoryCard
              key={bill.id}
              title={bill.title}
              summary={summary}
              amount={bill.totalAmount}
              participants={bill.participantsCount}
              onPress={() =>
                router.push({ pathname: '/tabs/sessions/history/[historyId]', params: { historyId: bill.id } })
              }
            />
          );
        })}
      </ScrollView>
    </YStack>
  );
}
