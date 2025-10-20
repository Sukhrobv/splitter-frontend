// app/tabs/index.tsx
import React, { useEffect, useMemo } from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, View, Circle } from 'tamagui';
import { ScanLine, Users, UserPlus } from '@tamagui/lucide-icons';

import { ScreenContainer } from '@/shared/ui/ScreenContainer';
import UserAvatar from '@/shared/ui/UserAvatar';
import type {
  SessionHistoryParticipant,
  SessionHistorySession,
} from '@/features/sessions/api/history.api';
import { useSessionsHistoryStore } from '@/features/sessions/model/history.store';
import { Button } from '@/shared/ui/Button';

const BULLET = '\u2022';
const HOME_HISTORY_LIMIT = 10;

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

function AvatarStack({ participants }: { participants: SessionHistoryParticipant[] }) {
  const shown = participants.slice(0, 3);
  const extra = Math.max(0, participants.length - shown.length);
  return (
    <XStack w={92} h={28} ai="center">
      {shown.map((participant, i) => (
        <View key={participant.uniqueId ?? i} ml={i === 0 ? 0 : -8}>
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
          backgroundColor="$gray3"
          borderWidth={2}
          borderColor="white"
          ml={shown.length === 0 ? 0 : -8}
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
  participants: SessionHistoryParticipant[];
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
          <AvatarStack participants={participants} />
        </XStack>
      </YStack>
    </Pressable>
  );
}

export default function HomePage() {
  const router = useRouter();
  const sessions = useSessionsHistoryStore(state => state.sessions);
  const loading = useSessionsHistoryStore(state => state.loading);
  const initialized = useSessionsHistoryStore(state => state.initialized);
  const currentLimit = useSessionsHistoryStore(state => state.limit);
  const error = useSessionsHistoryStore(state => state.error);
  const fetchHistory = useSessionsHistoryStore(state => state.fetchHistory);
  const openSettings = () => router.push('/tabs/settings');

  useEffect(() => {
    if (loading) return;
    if (!initialized || (currentLimit ?? 0) < HOME_HISTORY_LIMIT) {
      fetchHistory(HOME_HISTORY_LIMIT).catch(() => {});
    }
  }, [initialized, loading, currentLimit, fetchHistory]);

  const openFriends = () => {
    router.push('/tabs/friends');
  };

  const openGroups = () => {
    router.push('/tabs/groups');
  };

  const onScan = () => {
    router.push('/tabs/scan-receipt');
  };

  const recent = useMemo<SessionHistorySession[]>(() => sessions.slice(0, 3), [sessions]);

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
          {!loading && !error && !recent.length && (
            <Text color="$gray10" fontSize={14}>
              Hali hisoblar mavjud emas
            </Text>
          )}
          {recent.map((bill) => {
            const participants = bill.participants ?? [];
            const summary = `${formatSessionDate(bill.createdAt)} ${BULLET} ${participants.length} ishtirokchi`;
            const totalAmount = bill.totals?.grandTotal ?? 0;
            return (
              <BillCard
                key={bill.sessionId}
                title={bill.sessionName || 'Hisob'}
                sub={summary}
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
        </YStack>
      </YStack>
    </ScreenContainer>
  );
}
