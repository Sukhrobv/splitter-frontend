import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, Circle, ScrollView } from 'tamagui';
import { ChevronLeft, Check } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Participant = { uniqueId: string; username: string };

const fmtUZS = (n: number) => `UZS ${Math.round(n).toLocaleString('en-US')}`;

const getCurrencyParts = (n: number) => {
  const [currency, ...rest] = fmtUZS(n).split(' ');
  return { currency, amount: rest.join(' ') || '0' };
};

export default function FinishScreen() {
  const { data } = useLocalSearchParams<{ data?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const payload = useMemo(() => {
    try {
      return data ? JSON.parse(decodeURIComponent(data)) : null;
    } catch {
      return null;
    }
  }, [data]);

  const participants: Participant[] = payload?.participants ?? [];
  const totals: Record<string, number> = payload?.totals ?? {};
  const grandTotal = payload?.grandTotal;
  const sessionName = payload?.sessionName;
  const status = payload?.status;
  const receiptId = payload?.receiptId;

  const grandTotalParts = grandTotal ? getCurrencyParts(grandTotal) : null;

  const Avatar = ({ name }: { name: string }) => (
    <Circle size={32} bg="$gray5" ai="center" jc="center">
      <Text color="white" fontWeight="700" fontSize={14}>
        {name?.[0]?.toUpperCase() || '?'}
      </Text>
    </Circle>
  );

  return (
    <YStack f={1} bg="$background" position="relative">
      {/* Header */}
      <YStack bg="$background" p="$4" pb="$2">
        <XStack ai="center" jc="space-between" mb="$3">
          <Button
            size="$2"
            h={28}
            chromeless
            onPress={() => router.back()}
            icon={<ChevronLeft size={18} />}
          >
            Back
          </Button>
          <YStack ai="center">
            <Text fontSize={16} fontWeight="700">
              Bill Summary
            </Text>
            {receiptId && (
              <Text fontSize={12} color="$gray10">
                Receipt #{receiptId}
              </Text>
            )}
          </YStack>
          <YStack w={54} />
        </XStack>

        {/* Session info */}
        {sessionName && (
          <YStack ai="center" mb="$2">
            <Text fontSize={14} color="$gray11">
              {sessionName}
            </Text>
          </YStack>
        )}

        {/* Status badge */}
        {status && (
          <XStack ai="center" jc="center" mb="$3">
            <XStack
              ai="center"
              gap="$1"
              px="$3"
              py="$1"
              bg="#2ECC711A"
              borderRadius={16}
            >
              <Check size={14} color="#2ECC71" />
              <Text fontSize={12} fontWeight="600" color="#2ECC71" textTransform="capitalize">
                {status}
              </Text>
            </XStack>
          </XStack>
        )}

        {/* Grand Total */}
        {grandTotalParts && (
          <YStack
            p="$3"
            borderWidth={1}
            borderColor="#2ECC71"
            borderRadius={12}
            bg="#2ECC711A"
            mb="$3"
          >
            <Text fontSize={13} color="$gray11" mb="$1">
              Total Amount
            </Text>
            <XStack ai="baseline" gap="$1">
              <Text fontSize={14} color="#2ECC71">
                {grandTotalParts.currency}
              </Text>
              <Text fontSize={24} fontWeight="700" color="#2ECC71">
                {grandTotalParts.amount}
              </Text>
            </XStack>
          </YStack>
        )}
      </YStack>

      {/* Content */}
      <ScrollView
        f={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: (insets?.bottom ?? 0) + 96 }}
      >
        <YStack gap="$2">
          <Text fontSize={14} fontWeight="600" color="$gray11" mb="$1">
            Split by participant:
          </Text>
          {participants.map((p) => {
            const amount = totals[p.uniqueId] || 0;
            const parts = getCurrencyParts(amount);

            return (
              <XStack
                key={p.uniqueId}
                h={60}
                ai="center"
                jc="space-between"
                px={16}
                borderWidth={1}
                borderColor="$gray5"
                borderRadius={12}
                bg="$color1"
              >
                <XStack ai="center" gap="$3">
                  <Avatar name={p.username} />
                  <Text fontWeight="600" fontSize={15}>
                    {p.username}
                  </Text>
                </XStack>
                <XStack ai="baseline" gap="$1">
                  <Text fontSize={12} color="$gray10">
                    {parts.currency}
                  </Text>
                  <Text fontSize={18} fontWeight="700" color="#2ECC71">
                    {parts.amount}
                  </Text>
                </XStack>
              </XStack>
            );
          })}
        </YStack>
      </ScrollView>

      {/* Fixed bottom button */}
      <YStack
        position="absolute"
        left={0}
        right={0}
        bottom={(insets?.bottom ?? 0) + 8}
        px="$4"
      >
        <Button
          unstyled
          height={41}
          borderRadius={10}
          bg="#2ECC71"
          ai="center"
          jc="center"
          onPress={() => router.replace('/tabs')}
          pressStyle={{ opacity: 0.9 }}
        >
          <Text fontSize={16} fontWeight="600" color="white">
            Complete settlement
          </Text>
        </Button>
      </YStack>
    </YStack>
  );
}