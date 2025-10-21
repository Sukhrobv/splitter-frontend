import React, { useEffect, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView, Button } from 'tamagui';

import UserAvatar from '@/shared/ui/UserAvatar';
import { useSessionsHistoryStore } from '@/features/sessions/model/history.store';
import type {
  SessionHistoryEntry,
  SessionHistoryAllocation,
  SessionHistoryItem,
  SessionHistoryParticipantLight,
  SessionHistoryTotalsByParticipant,
} from '@/features/sessions/api/history.api';

const fmtUZS = (value: number) => `UZS ${value.toLocaleString()}`;
const BULLET = '\u2022';
const DETAIL_LIMIT = 50;

const formatSessionDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('uz-UZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

type ParticipantView = {
  participant: SessionHistoryParticipantLight;
  avatarUrl?: string | null;
  amount: number;
  items: {
    id: string;
    title: string;
    price: number;
  }[];
};

const buildParticipantsView = (bill?: SessionHistoryEntry): ParticipantView[] => {
  if (!bill) return [];

  const totalsByParticipant = new Map<string, SessionHistoryTotalsByParticipant>();
  (bill.totals?.byParticipant ?? []).forEach(item => {
    totalsByParticipant.set(item.uniqueId, item);
  });

  const itemsById = new Map<string, SessionHistoryItem>();
  (bill.totals?.byItem ?? []).forEach(item => {
    itemsById.set(item.itemId, item);
  });

  const allocationsByParticipant = new Map<string, SessionHistoryAllocation[]>();
  (bill.allocations ?? []).forEach(alloc => {
    const collection = allocationsByParticipant.get(alloc.participantId) ?? [];
    collection.push(alloc);
    allocationsByParticipant.set(alloc.participantId, collection);
  });

  return (bill.participants ?? []).map(p => {
    const totals = totalsByParticipant.get(p.uniqueId);
    const allocations = allocationsByParticipant.get(p.uniqueId) ?? [];
    const items = allocations.map((allocation, index) => {
      const itemMeta = itemsById.get(allocation.itemId);
      return {
        id: `${allocation.itemId}-${p.uniqueId}-${index}`,
        title: itemMeta?.name || 'Tovar',
        price: allocation.shareAmount,
      };
    });
    return {
      participant: {
        uniqueId: p.uniqueId,
        username: totals?.username || p.username || 'U',
        avatarUrl: p.avatarUrl ?? null,
      },
      avatarUrl: p.avatarUrl ?? null,
      amount: totals?.amountOwed ?? 0,
      items,
    };
  });
};

export default function HistoryDetailsScreen() {
  const { historyId } = useLocalSearchParams<{ historyId: string }>();
  const router = useRouter();
  const sessions = useSessionsHistoryStore(state => state.sessions);
  const loading = useSessionsHistoryStore(state => state.loading);
  const initialized = useSessionsHistoryStore(state => state.initialized);
  const currentLimit = useSessionsHistoryStore(state => state.limit);
  const error = useSessionsHistoryStore(state => state.error);
  const fetchHistory = useSessionsHistoryStore(state => state.fetchHistory);

  const bill: SessionHistoryEntry | undefined = useMemo(() => {
    if (!historyId) return undefined;
    const id = Number(historyId);
    if (Number.isNaN(id)) return undefined;
    return sessions.find(session => session.sessionId === id);
  }, [historyId, sessions]);

  useEffect(() => {
    if (loading) return;
    const hasBill = Boolean(bill);
    if (!initialized || (!hasBill && (currentLimit ?? 0) < DETAIL_LIMIT)) {
      fetchHistory(DETAIL_LIMIT).catch(() => {});
    }
  }, [initialized, loading, currentLimit, fetchHistory, bill]);

  const participants = useMemo(() => buildParticipantsView(bill), [bill]);

  if (!bill && loading) {
    return (
      <YStack f={1} bg="$background" ai="center" jc="center">
        <Text fontSize={16}>Yuklanmoqda...</Text>
      </YStack>
    );
  }

  if (!bill) {
    return (
      <YStack f={1} bg="$background" ai="center" jc="center" gap="$3">
        <Text fontSize={16} fontWeight="600">History not found</Text>
        {error && (
          <Text fontSize={14} color="$red10">
            {error}
          </Text>
        )}
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
          <Text fontSize={24} fontWeight="700">{bill.sessionName || 'Hisob'}</Text>
          <Button unstyled alignSelf="flex-start" onPress={() => router.back()}>
            <Text color="#2ECC71">{'< Ortga'}</Text>
          </Button>
          <Text fontSize={14} color="$gray10">
            {`${formatSessionDate(bill.finalizedAt || bill.createdAt)} ${BULLET} ${(bill.participants ?? []).length} ishtirokchi`}
          </Text>
          <Text fontSize={16} fontWeight="700" color="#2ECC71">
            {fmtUZS(bill.grandTotal ?? 0)}
          </Text>
        </YStack>

        {participants.map(({ participant, avatarUrl, amount, items }) => (
          <YStack
            key={participant.uniqueId}
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
                <UserAvatar
                  uri={avatarUrl ?? undefined}
                  label={(participant.username || 'U').slice(0, 1).toUpperCase()}
                  size={40}
                  textSize={16}
                  backgroundColor="$gray5"
                />
                <Text fontSize={16} fontWeight="600">{participant.username}</Text>
              </XStack>
              <Text fontSize={16} fontWeight="700" color="#2ECC71">
                {fmtUZS(amount)}
              </Text>
            </XStack>

            <YStack gap={8}>
              {items.length ? (
                items.map(item => (
                  <XStack key={item.id} jc="space-between" ai="center">
                    <Text fontSize={14}>{item.title}</Text>
                    <Text fontSize={14} fontWeight="600" color="#2ECC71">
                      {fmtUZS(item.price)}
                    </Text>
                  </XStack>
                ))
              ) : (
                <Text fontSize={12} color="$gray9">
                  Hech qanday element biriktirilmagan
                </Text>
              )}
            </YStack>
          </YStack>
        ))}
      </ScrollView>
    </YStack>
  );
}
