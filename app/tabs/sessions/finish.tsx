import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, Circle, ScrollView } from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';

type Participant = { uniqueId: string; username: string };

const fmtUZS = (n: number) => `UZS ${Math.round(n).toLocaleString('en-US')}`;

export default function FinishScreen() {
  const { data } = useLocalSearchParams<{ data?: string }>();
  const router = useRouter();

  const payload = useMemo(() => {
    try { return data ? JSON.parse(decodeURIComponent(data)) : null; } catch { return null; }
  }, [data]);

  const participants: Participant[] = payload?.participants ?? [];
  const totals: Record<string, number> = payload?.totals ?? {};

  return (
    <YStack f={1} bg="$background" p="$4">
      <XStack ai="center" jc="space-between" mb="$3">
        <Button size="$2" h={28} chromeless onPress={() => router.back()} icon={<ChevronLeft size={18} />}>Back</Button>
        <Text fontSize={16} fontWeight="700">Finish bill</Text>
        <YStack w={54} />
      </XStack>

      <Text fontSize={12} color="$gray10" mb="$2">
        {payload?.receiptId ? `Receipt ${payload.receiptId}` : ''}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        <YStack gap="$2">
          {participants.map(p => (
            <XStack key={p.uniqueId} h={60} ai="center" jc="space-between" px={16} borderWidth={1} borderColor="$gray5" borderRadius={12} bg="$color1">
              <XStack ai="center" gap="$3">
                <Circle size={32} backgroundColor="$gray5" />
                <Text fontWeight="600">{p.username}</Text>
              </XStack>
              <Text fontWeight="700" color="#2ECC71">{fmtUZS(totals[p.uniqueId] || 0)}</Text>
            </XStack>
          ))}
        </YStack>
      </ScrollView>

      <YStack position="absolute" left={0} right={0} bottom={12} px="$4">
        <Button unstyled height={41} borderRadius={10} bg="#2ECC71" ai="center" jc="center" onPress={() => router.replace('/tabs')}>
          <Text color="white" fontWeight="700">Complete settlement</Text>
        </Button>
      </YStack>
    </YStack>
  );
}


