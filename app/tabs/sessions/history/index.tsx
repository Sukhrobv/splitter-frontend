import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { YStack, XStack, Text, ScrollView, View } from 'tamagui';

import UserAvatar from '@/shared/ui/UserAvatar';
import type { SessionHistoryParticipant } from '@/features/sessions/api/history.api';
import { useSessionsHistoryStore } from '@/features/sessions/model/history.store';

const BULLET = '\u2022';
const HISTORY_LIMIT = 50;

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

function AvatarGroup({ participants }: { participants: SessionHistoryParticipant[] }) {
  const shown = participants.slice(0, 4);
  const extra = Math.max(0, participants.length - shown.length);
  return (
    <XStack ai="center">
      {shown.map((participant, idx) => (
        <View key={participant.uniqueId ?? idx} ml={idx === 0 ? 0 : -8}>
          <UserAvatar
            uri={participant.avatarUrl ?? undefined}
            label={(participant.username || 'U').slice(0, 1).toUpperCase()}
            size={28}
            textSize={12}
            backgroundColor="$gray5"
          />
        </View>
      ))}
      {extra > 0 && (
        <View
          w={28}
          h={28}
          br={14}
          backgroundColor="#CBD5F5"
          borderWidth={2}
          borderColor="white"
          ml={shown.length === 0 ? 0 : -8}
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
  participants: SessionHistoryParticipant[];
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
          <AvatarGroup participants={participants} />
        </XStack>
      </YStack>
    </Pressable>
  );
}

export default function SessionsHistoryScreen() {
  const router = useRouter();
  const sessions = useSessionsHistoryStore(state => state.sessions);
  const loading = useSessionsHistoryStore(state => state.loading);
  const initialized = useSessionsHistoryStore(state => state.initialized);
  const currentLimit = useSessionsHistoryStore(state => state.limit);
  const error = useSessionsHistoryStore(state => state.error);
  const fetchHistory = useSessionsHistoryStore(state => state.fetchHistory);

  useEffect(() => {
    if (loading) return;
    if (!initialized || (currentLimit ?? 0) < HISTORY_LIMIT) {
      fetchHistory(HISTORY_LIMIT).catch(() => {});
    }
  }, [initialized, loading, currentLimit, fetchHistory]);

  const history = useMemo(() => sessions, [sessions]);

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

        {loading && (
          <Text color="$gray10" fontSize={14}>
            Yuklanmoqda...
          </Text>
        )}
        {error && (
          <Text color="$red10" fontSize={14}>
            {error}
          </Text>
        )}
        {!loading && !error && !history.length && (
          <Text color="$gray10" fontSize={14}>
            Hali tarix mavjud emas
          </Text>
        )}

        {history.map((bill) => {
          const participants = bill.participants ?? [];
          const summary = `${formatSessionDate(bill.createdAt)} ${BULLET} ${participants.length} ishtirokchi`;
          const totalAmount = bill.totals?.grandTotal ?? 0;
          return (
            <HistoryCard
              key={bill.sessionId}
              title={bill.sessionName || 'Hisob'}
              summary={summary}
              amount={totalAmount}
              participants={participants}
              onPress={() =>
                router.push({
                  pathname: '/tabs/sessions/history/[historyId]',
                  params: { historyId: String(bill.sessionId) },
                })
              }
            />
          );
        })}
      </ScrollView>
    </YStack>
  );
}
