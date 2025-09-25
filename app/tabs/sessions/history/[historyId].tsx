import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView, Button, Circle } from 'tamagui';

import { BILL_HISTORY, findBill } from '@/features/sessions/mock/history';

const fmtUZS = (value: number) => `UZS ${value.toLocaleString()}`;
const BULLET = '\u2022';

export default function HistoryDetailsScreen() {
  const { historyId } = useLocalSearchParams<{ historyId: string }>();
  const router = useRouter();

  const bill = useMemo(() => (historyId ? findBill(historyId) : undefined), [historyId]);

  if (!bill) {
    return (
      <YStack f={1} bg="$background" ai="center" jc="center" gap="$3">
        <Text fontSize={16} fontWeight="600">History not found</Text>
        <Button onPress={() => router.back()}>Go back</Button>
      </YStack>
    );
  }

  return (
    <YStack f={1} bg="$background" px="$4" pt="$4" pb="$4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 32, gap: 16 }}
      >
        <YStack w={358} gap="$3">
          <Text fontSize={24} fontWeight="700">{bill.title}</Text>
          <Button unstyled alignSelf="flex-start" onPress={() => router.back()}>
            <Text color="#2ECC71">{'< Ortga'}</Text>
          </Button>
          <Text fontSize={14} color="$gray10">
            {`${bill.date} ${BULLET} ${bill.participantsCount} ishtirokchi`}
          </Text>
          <Text fontSize={16} fontWeight="700" color="#2ECC71">
            {fmtUZS(bill.totalAmount)}
          </Text>
        </YStack>

        {bill.participants.map((participant) => (
          <YStack
            key={participant.id}
            w={358}
            borderWidth={1}
            borderColor="#2ECC71"
            br={12}
            bg="white"
            px={16}
            py={12}
            gap="$3"
          >
            <XStack jc="space-between" ai="center">
              <XStack ai="center" gap="$2">
                <Circle size={40} backgroundColor={participant.avatarColor || '#E4E7EB'} />
                <Text fontSize={16} fontWeight="600">{participant.name}</Text>
              </XStack>
              <Text fontSize={16} fontWeight="700" color="#2ECC71">
                {fmtUZS(participant.amount)}
              </Text>
            </XStack>

            <YStack gap={8}>
              {participant.items.map((item) => (
                <XStack key={item.id} jc="space-between" ai="center">
                  <XStack ai="center" gap="$2">
                    {item.icon && <Text fontSize={18}>{item.icon}</Text>}
                    <Text fontSize={14}>{item.title}</Text>
                  </XStack>
                  <Text fontSize={14} fontWeight="600" color="#2ECC71">
                    {fmtUZS(item.price)}
                  </Text>
                </XStack>
              ))}
            </YStack>
          </YStack>
        ))}
      </ScrollView>
    </YStack>
  );
}
