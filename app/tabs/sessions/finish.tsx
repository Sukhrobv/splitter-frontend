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
    const totalsFromList = new Map<string, number>();
    const nameMap = new Map<string, string>();

    const pushName = (id?: string, username?: string) => {
      if (!id || !username) return;
      if (!nameMap.has(id)) {
        nameMap.set(id, username);
      }
    };

    participants.forEach((participant) => pushName(participant.uniqueId, participant.username));
    totalsByParticipantList.forEach((entry) => {
      pushName(entry.uniqueId, entry.username);
      totalsFromList.set(entry.uniqueId, entry.amountOwed);
    });

    Object.keys(totals).forEach((id) => {
      if (!nameMap.has(id)) {
        const candidate =
          totalsByParticipantList.find((entry) => entry.uniqueId === id)?.username ??
          participants.find((participant) => participant.uniqueId === id)?.username;
        if (candidate) {
          nameMap.set(id, candidate);
        }
      }
    });

    const participantOrder: string[] = [];
    const seenParticipants = new Set<string>();
    const pushParticipant = (id?: string) => {
      if (!id || seenParticipants.has(id)) return;
      seenParticipants.add(id);
      participantOrder.push(id);
    };

    participants.forEach((participant) => pushParticipant(participant.uniqueId));
    totalsByParticipantList.forEach((entry) => pushParticipant(entry.uniqueId));
    Object.keys(totals).forEach((id) => pushParticipant(id));

    const allocationsByItem = new Map<
      string,
      { total: number; allocations: Map<string, ParticipantAmount> }
    >();
    const allocationTotalsByParticipant = new Map<string, number>();

    const ensureName = (id: string) => {
      if (!nameMap.has(id)) {
        const fallback =
          totalsByParticipantList.find((entry) => entry.uniqueId === id)?.username ??
          participants.find((participant) => participant.uniqueId === id)?.username ??
          id;
        nameMap.set(id, fallback);
      }
      return nameMap.get(id) ?? id;
    };

    allocationsList.forEach((allocation) => {
      if (!allocation) return;
      const { participantId, itemId, shareAmount } = allocation;
      if (!participantId || !itemId || typeof shareAmount !== 'number') return;

      pushParticipant(participantId);
      const username = ensureName(participantId);

      allocationTotalsByParticipant.set(
        participantId,
        (allocationTotalsByParticipant.get(participantId) ?? 0) + shareAmount
      );

      const itemEntry =
        allocationsByItem.get(itemId) ??
        { total: 0, allocations: new Map<string, ParticipantAmount>() };

      itemEntry.total += shareAmount;

      const existing = itemEntry.allocations.get(participantId);
      if (existing) {
        existing.amount += shareAmount;
      } else {
        itemEntry.allocations.set(participantId, {
          uniqueId: participantId,
          username,
          amount: shareAmount,
        });
      }

      allocationsByItem.set(itemId, itemEntry);
    });

    const resolveAmount = (id: string) => {
      if (typeof totals[id] === 'number') return totals[id];
      if (totalsFromList.has(id)) return totalsFromList.get(id)!;
      if (allocationTotalsByParticipant.has(id)) return allocationTotalsByParticipant.get(id)!;
      return 0;
    };

    const resolveName = (id: string) => ensureName(id);

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

    Object.keys(totals).forEach((id) => {
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
