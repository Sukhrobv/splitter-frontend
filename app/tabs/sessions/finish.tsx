import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, Circle, ScrollView } from 'tamagui';
import { Check } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FinalizeTotalsByItem, FinalizeTotalsByParticipant, ReceiptAllocation } from '@/features/receipt/api/receipt.api';

type Participant = { uniqueId: string; username: string };

type FinishPayload = {
  sessionId?: number;
  sessionName?: string;
  receiptId?: string;
  participants?: Participant[];
  totals?: Record<string, number>;
  totalsByParticipant?: FinalizeTotalsByParticipant[];
  totalsByItem?: FinalizeTotalsByItem[];
  allocations?: ReceiptAllocation[];
  status?: string;
  createdAt?: string;
  grandTotal?: number;
};

type ParticipantAmount = { uniqueId: string; username: string; amount: number };
type ItemSummary = {
  itemId: string;
  name: string;
  total: number;
  allocations: ParticipantAmount[];
};

const pickFirstNumber = (...values: Array<number | null | undefined>) => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
};
const fmtUZS = (n: number) => `UZS ${Math.round(n).toLocaleString('en-US')}`;

const getCurrencyParts = (n: number) => {
  const [currency, ...rest] = fmtUZS(n).split(' ');
  return { currency, amount: rest.join(' ') || '0' };
};

export default function FinishScreen() {
  const { data } = useLocalSearchParams<{ data?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const payload = useMemo<FinishPayload | null>(() => {
    try {
      return data ? (JSON.parse(decodeURIComponent(data)) as FinishPayload) : null;
    } catch {
      return null;
    }
  }, [data]);

  const participants: Participant[] = payload?.participants ?? [];
  const totals: Record<string, number> = payload?.totals ?? {};
  const totalsByParticipantList: FinalizeTotalsByParticipant[] = payload?.totalsByParticipant ?? [];
  const totalsByItemList: FinalizeTotalsByItem[] = payload?.totalsByItem ?? [];
  const allocationsList: ReceiptAllocation[] = payload?.allocations ?? [];
  const knownGrandTotal = payload?.grandTotal;
  const sessionName = payload?.sessionName;
  const status = payload?.status;
  const receiptId = payload?.receiptId;

  const { participantSummaries, itemSummaries, effectiveGrandTotal } = useMemo(() => {
    type RawParticipantTotal = FinalizeTotalsByParticipant & {
      participantId?: string;
      userId?: string;
      id?: string | number;
      amount?: number;
      total?: number;
      shareAmount?: number;
      balance?: number;
      value?: number;
      owed?: number;
      participantName?: string;
      displayName?: string;
      participant?: {
        id?: string | number;
        uniqueId?: string;
        userId?: string;
        username?: string;
        name?: string;
        displayName?: string;
      };
      user?: {
        id?: string | number;
        uniqueId?: string;
        username?: string;
        name?: string;
      };
      amountDetails?: {
        value?: number;
        total?: number;
      };
      totals?: {
        amount?: number;
        total?: number;
      };
      meta?: {
        amount?: number;
      };
    };

    const normalizeId = (value?: string | null): string | undefined => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
      if (typeof value !== 'string') return undefined;
      const trimmed = value.trim();
      if (trimmed.length === 0) return undefined;
      if (trimmed === 'undefined' || trimmed === 'null') return undefined;
      return trimmed;
    };

    const toMaybeNumber = (value: unknown): number | undefined => {
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim().replace(/\s+/g, '');
        if (trimmed.length === 0) return undefined;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    };

    const pickFromArray = <T,>(value: unknown, index: number): T | undefined => {
      if (!Array.isArray(value)) return undefined;
      return value[index] as T | undefined;
    };

    const totalsEntries = Object.entries(totals ?? {}).reduce<Array<[string, number]>>(
      (acc, [rawId, value]) => {
        const id = normalizeId(rawId);
        if (!id) return acc;
        if (typeof value !== 'number' || !Number.isFinite(value)) return acc;
        acc.push([id, value]);
        return acc;
      },
      []
    );
    const totalsMap = new Map<string, number>(totalsEntries);

    const normalizedParticipantTotals = (totalsByParticipantList as unknown[]).reduce<
      Array<{ uniqueId: string; username: string; amountOwed: number }>
    >((acc, rawEntry) => {
      const raw = rawEntry as RawParticipantTotal;
      if (!raw) return acc;
      const candidate = raw as RawParticipantTotal;

      const candidateId =
        normalizeId(candidate.uniqueId) ??
        normalizeId(candidate.participantId) ??
        normalizeId(candidate.userId) ??
        normalizeId(
          typeof candidate.id === 'number' ? String(candidate.id) : (candidate.id as string | undefined)
        ) ??
        normalizeId(candidate.participant?.uniqueId) ??
        normalizeId(
          typeof candidate.participant?.id === 'number'
            ? String(candidate.participant?.id)
            : (candidate.participant?.id as string | undefined)
        ) ??
        normalizeId(candidate.participant?.userId) ??
        normalizeId(candidate.user?.uniqueId) ??
        normalizeId(
          typeof candidate.user?.id === 'number'
            ? String(candidate.user?.id)
            : (candidate.user?.id as string | undefined)
        ) ??
        normalizeId(candidate.user?.name) ??
        normalizeId(pickFromArray<string>(rawEntry, 0));

      const rawId = candidateId;
      if (!rawId) return acc;

      const username =
        candidate.username ??
        candidate.participant?.username ??
        candidate.participant?.name ??
        candidate.participantName ??
        candidate.displayName ??
        candidate.user?.username ??
        candidate.user?.name ??
        participants.find(
          (participant) => normalizeId(participant.uniqueId) === rawId
        )?.username ??
        rawId;

      const amount = pickFirstNumber(
        toMaybeNumber(candidate.amountOwed),
        toMaybeNumber(candidate.amount),
        toMaybeNumber(candidate.total),
        toMaybeNumber(candidate.shareAmount),
        toMaybeNumber(candidate.balance),
        toMaybeNumber(candidate.value),
        toMaybeNumber(candidate.owed),
        toMaybeNumber(candidate.amountDetails?.value),
        toMaybeNumber(candidate.amountDetails?.total),
        toMaybeNumber(candidate.totals?.amount),
        toMaybeNumber(candidate.totals?.total),
        toMaybeNumber(candidate.meta?.amount),
        toMaybeNumber(pickFromArray(rawEntry, 1))
      );

      acc.push({ uniqueId: rawId, username, amountOwed: amount });
      return acc;
    }, []);

    const totalsFromList = new Map<string, number>();
    const nameMap = new Map<string, string>();

    const pushName = (value?: string, username?: string) => {
      const id = normalizeId(value);
      if (!id) return;
      const safeName = (username ?? '').trim() || id;
      if (!nameMap.has(id)) {
        nameMap.set(id, safeName);
      }
    };

    participants.forEach((participant) =>
      pushName(participant.uniqueId, participant.username)
    );
    normalizedParticipantTotals.forEach((entry) => {
      pushName(entry.uniqueId, entry.username);
      totalsFromList.set(entry.uniqueId, entry.amountOwed);
    });
    totalsEntries.forEach(([id]) => {
      const candidateName =
        normalizedParticipantTotals.find((entry) => entry.uniqueId === id)?.username ??
        participants.find(
          (participant) => normalizeId(participant.uniqueId) === id
        )?.username;
      pushName(id, candidateName);
    });

    const participantOrder: string[] = [];
    const seenParticipants = new Set<string>();
    const pushParticipant = (value?: string) => {
      const id = normalizeId(value);
      if (!id || seenParticipants.has(id)) return;
      seenParticipants.add(id);
      participantOrder.push(id);
    };

    participants.forEach((participant) => pushParticipant(participant.uniqueId));
    normalizedParticipantTotals.forEach((entry) => pushParticipant(entry.uniqueId));
    totalsEntries.forEach(([id]) => pushParticipant(id));

    const allocationsByItem = new Map<
      string,
      { total: number; allocations: Map<string, ParticipantAmount> }
    >();
    const allocationTotalsByParticipant = new Map<string, number>();

    const ensureName = (value: string) => {
      const id = normalizeId(value);
      if (!id) return value;
      if (!nameMap.has(id)) {
        const fallback =
          normalizedParticipantTotals.find((entry) => entry.uniqueId === id)?.username ??
          participants.find(
            (participant) => normalizeId(participant.uniqueId) === id
          )?.username ??
          id;
        nameMap.set(id, fallback);
      }
      return nameMap.get(id) ?? id;
    };

    allocationsList.forEach((allocation) => {
      if (!allocation) return;
      const { participantId, itemId, shareAmount } = allocation;
      if (!participantId || !itemId || typeof shareAmount !== 'number') return;

      const normalizedParticipantId = normalizeId(participantId);
      if (!normalizedParticipantId) return;

      pushParticipant(normalizedParticipantId);
      const username = ensureName(normalizedParticipantId);

      allocationTotalsByParticipant.set(
        normalizedParticipantId,
        (allocationTotalsByParticipant.get(normalizedParticipantId) ?? 0) + shareAmount
      );

      const itemEntry =
        allocationsByItem.get(itemId) ??
        { total: 0, allocations: new Map<string, ParticipantAmount>() };

      itemEntry.total += shareAmount;

      const existing = itemEntry.allocations.get(normalizedParticipantId);
      if (existing) {
        existing.amount += shareAmount;
      } else {
        itemEntry.allocations.set(normalizedParticipantId, {
          uniqueId: normalizedParticipantId,
          username,
          amount: shareAmount,
        });
      }

      allocationsByItem.set(itemId, itemEntry);
    });

    const resolveAmount = (value: string) => {
      const id = normalizeId(value);
      if (!id) return 0;
      if (totalsMap.has(id)) return totalsMap.get(id)!;
      if (totalsFromList.has(id)) return totalsFromList.get(id)!;
      if (allocationTotalsByParticipant.has(id)) return allocationTotalsByParticipant.get(id)!;
      return 0;
    };

    const resolveName = (value: string) => ensureName(value);

    const summaries: ParticipantAmount[] = participantOrder.map((id) => ({
      uniqueId: id,
      username: resolveName(id),
      amount: resolveAmount(id),
    }));

    allocationTotalsByParticipant.forEach((_value, id) => {
      if (!seenParticipants.has(id)) {
        seenParticipants.add(id);
        summaries.push({
          uniqueId: id,
          username: resolveName(id),
          amount: resolveAmount(id),
        });
      }
    });

    totalsEntries.forEach(([id]) => {
      if (!seenParticipants.has(id)) {
        seenParticipants.add(id);
        summaries.push({
          uniqueId: id,
          username: resolveName(id),
          amount: resolveAmount(id),
        });
      }
    });

    const itemOrder: string[] = [];
    const seenItems = new Set<string>();
    const pushItem = (id?: string) => {
      if (!id || seenItems.has(id)) return;
      seenItems.add(id);
      itemOrder.push(id);
    };

    totalsByItemList.forEach((entry) => pushItem(entry.itemId));
    allocationsByItem.forEach((_value, key) => pushItem(key));

    const totalsByItemMap = new Map<string, FinalizeTotalsByItem>();
    totalsByItemList.forEach((entry) => {
      totalsByItemMap.set(entry.itemId, entry);
    });

    const items: ItemSummary[] = itemOrder.map((itemId) => {
      const totalsEntry = totalsByItemMap.get(itemId);
      const allocationEntry = allocationsByItem.get(itemId);
      const allocations =
        allocationEntry
          ? Array.from(allocationEntry.allocations.values()).map((entry) => ({
              uniqueId: entry.uniqueId,
              username: entry.username,
              amount: entry.amount,
            }))
          : [];
      return {
        itemId,
        name: totalsEntry?.name ?? itemId,
        total: totalsEntry?.total ?? allocationEntry?.total ?? 0,
        allocations,
      };
    });

    const allocationsSum = Array.from(allocationsByItem.values()).reduce(
      (acc, entry) => acc + entry.total,
      0
    );
    const participantsSum = summaries.reduce((acc, entry) => acc + entry.amount, 0);
    const itemsSum = totalsByItemList.reduce((acc, entry) => acc + entry.total, 0);

    const effectiveGrandTotal = pickFirstNumber(
      knownGrandTotal,
      totalsByItemList.length > 0 ? itemsSum : undefined,
      summaries.length > 0 ? participantsSum : undefined,
      allocationsByItem.size > 0 ? allocationsSum : undefined
    );

    return {
      participantSummaries: summaries,
      itemSummaries: items,
      effectiveGrandTotal,
    };
  }, [participants, totals, totalsByParticipantList, totalsByItemList, allocationsList, knownGrandTotal]);

  const showGrandTotal = participantSummaries.length > 0 || itemSummaries.length > 0;
  const grandTotalParts = showGrandTotal ? getCurrencyParts(effectiveGrandTotal) : null;

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
        <XStack w="100%" ai="center" jc="flex-start" mb="$3">
          <YStack ai="flex-start">
            <Text fontSize={16} fontWeight="700">
              Bill Summary
            </Text>
            {receiptId && (
              <Text fontSize={12} color="$gray10">
                Receipt #{receiptId}
              </Text>
            )}
          </YStack>
        </XStack>

        {/* Session info */}
        {sessionName && (
          <YStack ai="flex-start" mb="$2">
            <Text fontSize={14} color="$gray11">
              {sessionName}
            </Text>
          </YStack>
        )}

        {/* Status badge */}
        {status && (
          <XStack w="100%" ai="center" jc="flex-start" mb="$3">
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
          {participantSummaries.length > 0 ? (
            participantSummaries.map((summary) => {
              const parts = getCurrencyParts(summary.amount);

              return (
                <XStack
                  key={summary.uniqueId}
                  h={60}
                  ai="center"
                  jc="space-between"
                  w="100%"
                  px={16}
                  borderWidth={1}
                  borderColor="$gray5"
                  borderRadius={12}
                  bg="$color1"
                >
                  <XStack ai="center" gap="$3">
                    <Avatar name={summary.username} />
                    <Text fontWeight="600" fontSize={15}>
                      {summary.username}
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
            })
          ) : (
            <Text fontSize={13} color="$gray10">
              No participant data available yet.
            </Text>
          )}
        </YStack>

        {itemSummaries.length > 0 && (
          <YStack gap="$2" mt="$4">
            <Text fontSize={14} fontWeight="600" color="$gray11" mb="$1">
              Split by item:
            </Text>
            {itemSummaries.map((item) => {
              const itemParts = getCurrencyParts(item.total);
              return (
                <YStack
                  key={item.itemId}
                  p="$3"
                  borderWidth={1}
                  borderColor="$gray5"
                  borderRadius={12}
                  bg="$color1"
                  gap="$2"
                >
                  <XStack w="100%" ai="center" jc="space-between">
                    <Text fontWeight="600" fontSize={15}>
                      {item.name}
                    </Text>
                    <XStack ai="baseline" gap="$1">
                      <Text fontSize={12} color="$gray10">
                        {itemParts.currency}
                      </Text>
                      <Text fontSize={16} fontWeight="700" color="$gray11">
                        {itemParts.amount}
                      </Text>
                    </XStack>
                  </XStack>
                  {item.allocations.length > 0 ? (
                    <YStack gap="$1">
                      {item.allocations.map((allocation) => {
                        const allocationParts = getCurrencyParts(allocation.amount);
                        return (
                          <XStack
                            key={`${item.itemId}-${allocation.uniqueId}`}
                            ai="center"
                            jc="space-between"
                            w="100%"
                          >
                            <Text fontSize={13} color="$gray11">
                              {allocation.username}
                            </Text>
                            <XStack ai="baseline" gap="$1">
                              <Text fontSize={11} color="$gray10">
                                {allocationParts.currency}
                              </Text>
                              <Text fontSize={14} fontWeight="600" color="$gray11">
                                {allocationParts.amount}
                              </Text>
                            </XStack>
                          </XStack>
                        );
                      })}
                    </YStack>
                  ) : (
                    <Text fontSize={12} color="$gray9">
                      No allocation details available.
                    </Text>
                  )}
                </YStack>
              );
            })}
          </YStack>
        )}
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
