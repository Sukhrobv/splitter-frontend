import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { YStack, XStack, Text, Button, Circle, ScrollView, Spinner } from 'tamagui';
import { Users as UsersIcon, Check, Plus, Minus, Package as PackageIcon } from '@tamagui/lucide-icons';

import { useAppStore } from '@/shared/lib/stores/app-store';
import { useReceiptSessionStore } from '@/features/receipt/model/receipt-session.store';
import type { ReceiptSplitItem } from '@/features/receipt/model/receipt-session.store';
import { ReceiptApi } from '@/features/receipt/api/receipt.api';
import type { FinalizeReceiptItemPayload, FinalizeTotalsByItem, FinalizeTotalsByParticipant, ReceiptAllocation } from '@/features/receipt/api/receipt.api';

// ===== Types =====
type Participant = { uniqueId: string; username: string };
type SplitMode = 'equal' | 'count' | undefined;
type Item = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedTo: string[];
  perPersonCount?: Record<string, number>;
  splitMode?: SplitMode;
  kind?: string;
  totalPrice?: number;
};

// ===== Mock Data =====
const MOCK_ITEMS: Item[] = [
  {
    id: '1',
    name: 'Pizza Margherita',
    price: 89000,
    quantity: 2,
    assignedTo: [],
    perPersonCount: {},
    splitMode: 'count',
    totalPrice: 178000
  },
  {
    id: '2',
    name: 'Caesar Salad',
    price: 45000,
    quantity: 1,
    assignedTo: [],
    perPersonCount: {},
    splitMode: 'equal',
    totalPrice: 45000
  },
  {
    id: '3',
    name: 'Cola',
    price: 10000,
    quantity: 5,
    assignedTo: [],
    perPersonCount: {},
    splitMode: 'count',
    totalPrice: 50000
  },
  {
    id: '4',
    name: 'Tiramisu',
    price: 32000,
    quantity: 1,
    assignedTo: [],
    perPersonCount: {},
    splitMode: 'equal',
    totalPrice: 32000
  },
  {
    id: '5',
    name: 'Soup of the day',
    price: 28000,
    quantity: 1,
    assignedTo: [],
    perPersonCount: {},
    splitMode: 'equal',
    totalPrice: 28000
  },
];

const cloneItems = (source: Item[]): Item[] =>
  source.map((item) => ({
    ...item,
    assignedTo: [...item.assignedTo],
    perPersonCount: item.perPersonCount ? { ...item.perPersonCount } : {},
  }));

const ensureMode = (item: Item): Exclude<SplitMode, undefined> =>
  item.splitMode === 'count' ? 'count' : 'equal';

const toLocalItems = (source: ReceiptSplitItem[]): Item[] =>
  source.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.unitPrice,
    quantity: item.quantity,
    assignedTo: [...item.assignedTo],
    perPersonCount: item.perPersonCount ? { ...item.perPersonCount } : {},
    splitMode: item.splitMode ?? (item.quantity > 1 ? 'count' : 'equal'),
    kind: item.kind,
    totalPrice: item.totalPrice,
  }));

const toStoreItems = (source: Item[]): ReceiptSplitItem[] =>
  source.map((item) => {
    const mode = ensureMode(item);
    const perPersonEntries = Object.entries(item.perPersonCount ?? {}).filter(
      ([, value]) => typeof value === 'number' && value > 0
    );
    const perPersonCount = perPersonEntries.reduce<Record<string, number>>((acc, [uid, count]) => {
      acc[uid] = count;
      return acc;
    }, {});

    // Ensure assignedTo is not empty for equal mode
    const assignedTo = mode === 'equal' ? [...(item.assignedTo || [])] : [];

    return {
      id: item.id,
      name: item.name,
      unitPrice: item.price,
      quantity: item.quantity,
      totalPrice: typeof item.totalPrice === 'number' ? item.totalPrice : item.price * item.quantity,
      kind: item.kind,
      splitMode: mode,
      assignedTo,
      perPersonCount: mode === 'count' ? perPersonCount : {},
    };
  });

const computeItemTotal = (item: Item) =>
  typeof item.totalPrice === 'number' ? item.totalPrice : item.price * item.quantity;

const buildLocalFinalization = (items: Item[], participants: Participant[]) => {
  const totalsByItem: FinalizeTotalsByItem[] = [];
  const allocations: ReceiptAllocation[] = [];

  const participantTotals = participants.reduce<Record<string, number>>((acc, participant) => {
    acc[participant.uniqueId] = 0;
    return acc;
  }, {});

  for (const item of items) {
    const total = computeItemTotal(item);
    totalsByItem.push({ itemId: item.id, name: item.name, total });

    const mode = ensureMode(item);

    if (mode === 'count') {
      const perPersonCount = item.perPersonCount ?? {};
      for (const [uid, rawCount] of Object.entries(perPersonCount)) {
        const count = Number(rawCount);
        if (!uid || Number.isNaN(count) || count <= 0) continue;

        const shareAmount = count * item.price;
        if (!(uid in participantTotals)) {
          participantTotals[uid] = 0;
        }
        participantTotals[uid] = (participantTotals[uid] ?? 0) + shareAmount;

        allocations.push({
          itemId: item.id,
          participantId: uid,
          shareAmount,
          shareUnits: count,
        });
      }

      continue;
    }

    const assigned = (item.assignedTo ?? []).filter(Boolean);
    const shareCount = assigned.length;
      if (shareCount === 0) {
      console.warn(`Item ${item.id} (${item.name}) has equal split mode but no assigned participants`);
    continue;
    } 

    const shareAmount = total / shareCount;
    const shareRatio = 1 / shareCount;

    assigned.forEach((uid) => {
      if (!(uid in participantTotals)) {
        participantTotals[uid] = 0;
      }
      participantTotals[uid] = (participantTotals[uid] ?? 0) + shareAmount;

      allocations.push({
        itemId: item.id,
        participantId: uid,
        shareAmount,
        shareRatio,
      });
    });
  }

  const totalsByParticipant: FinalizeTotalsByParticipant[] = participants.map((participant) => ({
    uniqueId: participant.uniqueId,
    username: participant.username,
    amountOwed: participantTotals[participant.uniqueId] ?? 0,
  }));

  const grandTotal = totalsByItem.reduce((acc, entry) => acc + entry.total, 0);

  return {
    totalsMap: participantTotals,
    totalsByParticipant,
    totalsByItem,
    allocations,
    grandTotal,
  };
};
// ===== Helpers =====
const parseParticipantsParam = (raw?: string): Participant[] => {
  if (!raw) return [];
  try {
    const decoded = decodeURIComponent(raw);
    return JSON.parse(decoded);
  } catch {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
};

export default function ItemsSplitScreen() {
  const { participants: participantsParam, receiptId } = useLocalSearchParams<{
    participants?: string;
    receiptId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const me = useAppStore((s) => s.user);
  const session = useReceiptSessionStore((s) => s.session);
  const storeItems = useReceiptSessionStore((s) => s.items);
  const storeParticipants = useReceiptSessionStore((s) => s.participants);
  const setStoreItems = useReceiptSessionStore((s) => s.setItems);

  const storeCurrency = useReceiptSessionStore((s) => s.currency);

  const fmtCurrency = useCallback((n: number) => {
    const currency = storeCurrency || 'UZS';
    return `${currency} ${Math.round(n).toLocaleString('en-US')}`;
  }, [storeCurrency]);

  const getCurrencyParts = useCallback((n: number) => {
    const formatted = fmtCurrency(n);
    const [currency, ...rest] = formatted.split(' ');
    return { currency, amount: rest.join(' ') || '0' };
  }, [fmtCurrency]);

  const [items, setLocalItems] = useState<Item[]>([]);

  type Editing = {
    id: string;
    splitMode: SplitMode;
    assignedTo: string[];
    perPersonCount: Record<string, number>;
  } | null;
  
  const [editing, setEditing] = useState<Editing>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const participantsFromParams = useMemo(
    () => parseParticipantsParam(participantsParam),
    [participantsParam]
  );

  const participants = useMemo<Participant[]>(() => {
    const source =
      (storeParticipants?.length ?? 0) > 0 ? storeParticipants : participantsFromParams;
    const base =
      source.length > 0
        ? source
        : me?.uniqueId
        ? [{ uniqueId: me.uniqueId, username: me.username || me.uniqueId }]
        : [];

    const normalized = base.map((p) => ({
      uniqueId: p.uniqueId,
      username: p.username || p.uniqueId,
    }));

    const meId = me?.uniqueId;
    const sorted = [...normalized].sort((a, b) => {
      if (meId && a.uniqueId === meId) return -1;
      if (meId && b.uniqueId === meId) return 1;
      return (a.username || '').localeCompare(b.username || '');
    });

    return sorted;
  }, [storeParticipants, participantsFromParams, me?.uniqueId, me?.username]);

  const isMockSession = receiptId === 'mock-001';
  const sessionReceiptId = receiptId ?? (session ? String(session.sessionId) : undefined);

  const loadItemsFromSource = useCallback(() => {
    const hasStoreItems = Array.isArray(storeItems) && storeItems.length > 0;
    if (hasStoreItems) {
      setLocalItems(toLocalItems(storeItems));
    } else if (isMockSession) {
      const fallback = cloneItems(MOCK_ITEMS);
      setLocalItems(fallback);
      setStoreItems(toStoreItems(fallback));
    } else {
      setLocalItems([]);
    }
    setEditing(null);
    setSaving(false);
    setShowSuccess(false);
  }, [storeItems, isMockSession, setStoreItems]);

  const resetState = useCallback(() => {
    loadItemsFromSource();
  }, [loadItemsFromSource]);

  useEffect(() => {
    resetState();
  }, [resetState]);

  useFocusEffect(
    useCallback(() => {
      resetState();
    }, [resetState])
  );

  const commitItems = useCallback(
    (updater: (prev: Item[]) => Item[]) => {
      setLocalItems((prev) => {
        const next = updater(prev);
        const changed =
          next.length !== prev.length || next.some((item, index) => item !== prev[index]);
        if (!changed) {
          return prev;
        }
        setStoreItems(toStoreItems(next));
        return next;
      });
    },
    [setStoreItems]
  );

  // --- derived ---
  const isAssigned = (it: Item) => {
    if (it.splitMode === 'count') {
      const c = it.perPersonCount || {};
      return Object.values(c).reduce((a, b) => a + (b || 0), 0) > 0;
    }
    return (it.assignedTo?.length ?? 0) > 0;
  };

  const assignedCount = useMemo(
    () => items.reduce((acc, it) => acc + (isAssigned(it) ? 1 : 0), 0),
    [items]
  );

  const totalItems = items.length;
  const canContinue = assignedCount === totalItems && totalItems > 0;

  useEffect(() => {
    if (!canContinue && submitError) {
      setSubmitError(null);
    }
  }, [canContinue, submitError]);

  // --- modal helpers ---
  const editingItem = editing ? items.find((it) => it.id === editing.id) : null;
  const editingTotal = editingItem
    ? typeof editingItem.totalPrice === 'number'
      ? editingItem.totalPrice
      : editingItem.price * editingItem.quantity
    : 0;
  const editingPriceParts = getCurrencyParts(editingTotal);
  const effectiveMode =
    editing?.splitMode || (editingItem?.quantity && editingItem.quantity > 1 ? 'count' : 'equal');
  const isEqualMode = effectiveMode === 'equal';
  const isCountMode = effectiveMode === 'count';

  function openAssignModal(it: Item) {
    const initialMode: SplitMode = it.splitMode ?? (it.quantity > 1 ? 'count' : 'equal');
    const assigned = initialMode === 'equal' ? [...(it.assignedTo || [])] : [];
    const perCount = initialMode === 'count' ? { ...(it.perPersonCount || {}) } : {};

    setEditing({
      id: it.id,
      splitMode: initialMode,
      assignedTo: assigned,
      perPersonCount: perCount,
    });
  }

  function closeAssignModal() {
    setEditing(null);
  }

  function modalAll() {
    if (!editing) return;
    setEditing({
      ...editing,
      splitMode: 'equal',
      assignedTo: participants.map((p) => p.uniqueId),
      perPersonCount: {},
    });
  }

  function modalClear() {
    if (!editing) return;
    setEditing({
      ...editing,
      splitMode: effectiveMode,
      assignedTo: [],
      perPersonCount: {},
    });
  }

  function switchToEqual() {
    if (!editing) return;
    const participantsWithUnits = Object.entries(editing.perPersonCount)
      .filter(([, value]) => (value || 0) > 0)
      .map(([uid]) => uid);
    const baseAssigned = editing.assignedTo.length ? editing.assignedTo : participantsWithUnits;

    setEditing({
      ...editing,
      splitMode: 'equal',
      assignedTo: baseAssigned,
      perPersonCount: {},
    });
  }

  function switchToCount() {
    if (!editing || !editingItem) return;

    const existing = Object.entries(editing.perPersonCount).filter(
      ([, value]) => (value || 0) > 0
    );

    if (existing.length === 0 && editing.assignedTo.length > 0) {
      let remaining = editingItem.quantity;
      const counts: Record<string, number> = {};
      editing.assignedTo.forEach((uid) => {
        if (remaining <= 0) return;
        counts[uid] = 1;
        remaining -= 1;
      });

      setEditing({
        ...editing,
        splitMode: 'count',
        assignedTo: [],
        perPersonCount: counts,
      });
      return;
    }

    setEditing({
      ...editing,
      splitMode: 'count',
      assignedTo: [],
      perPersonCount: { ...editing.perPersonCount },
    });
  }

  function modalToggleUser(uid: string) {
    if (!editing || !editingItem) return;

    if (effectiveMode === 'count') {
      const current = editing.perPersonCount[uid] || 0;
      const next = { ...editing.perPersonCount };

      if (current > 0) {
        delete next[uid];
      } else {
        const othersTotal = Object.entries(editing.perPersonCount)
          .filter(([key]) => key !== uid)
          .reduce((sum, [, value]) => sum + (value || 0), 0);

        if (othersTotal >= editingItem.quantity) return;
        next[uid] = 1;
      }

      setEditing({
        ...editing,
        splitMode: 'count',
        assignedTo: [],
        perPersonCount: next,
      });
      return;
    }

    const has = editing.assignedTo.includes(uid);
    const next = has
      ? editing.assignedTo.filter((x) => x !== uid)
      : [...editing.assignedTo, uid];

    setEditing({
      ...editing,
      splitMode: 'equal',
      assignedTo: next,
      perPersonCount: {},
    });
  }

  function modalInc(uid: string) {
    if (!editing || !editingItem) return;
    const next = { ...editing.perPersonCount };
    const sum = Object.values(next).reduce((a, b) => a + (b || 0), 0);
    if (sum >= editingItem.quantity) return;

    next[uid] = (next[uid] || 0) + 1;
    setEditing({
      ...editing,
      splitMode: 'count',
      perPersonCount: next,
      assignedTo: [],
    });
  }

  function modalDec(uid: string) {
    if (!editing) return;
    const next = { ...editing.perPersonCount };
    const v = (next[uid] || 0) - 1;
    if (v <= 0) delete next[uid];
    else next[uid] = v;

    setEditing({
      ...editing,
      splitMode: 'count',
      perPersonCount: next,
      assignedTo: [],
    });
  }

  async function modalSave() {
  if (!editing) return;
  const mode: Exclude<SplitMode, undefined> =
    editing.splitMode ?? ((editingItem?.quantity && editingItem.quantity > 1) ? 'count' : 'equal');

  setSaving(true);
  try {
    commitItems((prev) =>
      prev.map((it) => {
        if (it.id !== editing.id) return it;
        
        // Ensure we preserve the assignments correctly
        const assignedTo = mode === 'equal' ? [...(editing.assignedTo || [])] : [];
        const perPersonCount = mode === 'count' ? { ...(editing.perPersonCount || {}) } : {};
        
        return {
          ...it,
          splitMode: mode,
          assignedTo,
          perPersonCount,
        };
      })
    );
    setEditing(null);
  } finally {
    setSaving(false);
  }
}

  // --- finalize and navigate ---
  const onContinue = useCallback(async () => {
  if (!canContinue || finalizing) return;

  setSubmitError(null);
  setFinalizing(true);

  try {
    setStoreItems(toStoreItems(items));

    const finalizeItems: FinalizeReceiptItemPayload[] = items.map((item) => {
      const mode = ensureMode(item);

      const payload: FinalizeReceiptItemPayload = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        kind: item.kind,
        splitMode: mode,
        assignedTo: mode === 'equal' ? (item.assignedTo || []) : undefined,
        perPersonCount: mode === 'count' ? (item.perPersonCount || {}) : undefined,
      };

  // Debug log
  console.log('Finalizing item:', {
    id: item.id,
    name: item.name,
    mode,
    assignedTo: payload.assignedTo,
    perPersonCount: payload.perPersonCount,
  });

  return payload;
});

      const effectiveSessionId =
      session?.sessionId ??
      (sessionReceiptId && !isMockSession ? parseInt(sessionReceiptId, 10) : undefined);

    if (!effectiveSessionId) {
      throw new Error('Session ID is required');
    }

      const fallbackFinalization = buildLocalFinalization(items, participants);

      const result = await ReceiptApi.finalize({
      sessionId: effectiveSessionId,
      sessionName: session?.sessionName || 'Split Session',
      participants: participants.map((p) => ({
        uniqueId: p.uniqueId,
        username: p.username,
      })),
      items: finalizeItems,
      currency: storeCurrency, // ✅ Добавьте эту строку
    });

      const backendByParticipant = result.totals?.byParticipant ?? [];
      const hasBackendByParticipant = backendByParticipant.length > 0;

      const effectiveByParticipant = hasBackendByParticipant
        ? backendByParticipant
        : fallbackFinalization.totalsByParticipant;

      const totalsFromResponse = hasBackendByParticipant
        ? backendByParticipant.reduce<Record<string, number>>((acc, entry) => {
            acc[entry.uniqueId] = entry.amountOwed;
            return acc;
          }, {})
        : { ...fallbackFinalization.totalsMap };

      const backendByItem = result.totals?.byItem ?? [];
      const totalsByItem = backendByItem.length > 0 ? backendByItem : fallbackFinalization.totalsByItem;

      const backendAllocations = result.allocations ?? [];
      const allocations = backendAllocations.length > 0 ? backendAllocations : fallbackFinalization.allocations;

      const grandTotal =
        typeof result.totals?.grandTotal === 'number'
          ? result.totals.grandTotal
          : fallbackFinalization.grandTotal;

      const finalCurrency = result.totals?.currency || storeCurrency;

      const finishPayload = {
  sessionId: result.sessionId,
  sessionName: result.sessionName,
  receiptId: sessionReceiptId ?? (isMockSession ? 'mock-001' : undefined),
  participants,
  totalsByParticipant: effectiveByParticipant,
  totalsByItem,
  allocations,
  grandTotal,
  currency: finalCurrency,
  status: result.status,
  createdAt: result.createdAt,
};

      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setFinalizing(false);

        try {
          const q = encodeURIComponent(JSON.stringify(finishPayload));
          router.push({
            pathname: '/tabs/sessions/finish',
            params: { data: q },
          });
        } catch {
          router.push('/tabs');
        }

        resetState();
      }, 1200);
    } catch (error) {
      setShowSuccess(false);
      setFinalizing(false);

      const message = error instanceof Error ? error.message : 'Failed to finalize session';
      setSubmitError(message);
      console.error('Finalize error:', error);
    }
  }, [
    canContinue,
    finalizing,
    items,
    session,
    sessionReceiptId,
    isMockSession,
    participants,
    storeCurrency,
    setStoreItems,
    router,
    resetState,
  ]);

  // --- UI atoms ---
  const Avatar = ({ name }: { name: string }) => (
    <Circle size={28} bg="$gray5" ai="center" jc="center">
      <Text color="white" fontWeight="700">
        {name?.[0]?.toUpperCase() || '?'}
      </Text>
    </Circle>
  );

  const ProgressBar = ({ value }: { value: number }) => (
    <YStack h={8} w="100%" br={999} bg="$gray5" overflow="hidden">
      <YStack h="100%" w={`${Math.max(0, Math.min(100, value))}%`} bg="#2ECC71" />
    </YStack>
  );

  const ModeToggleButton = ({
    label,
    icon,
    active,
    onPress,
  }: {
    label: string;
    icon: React.ReactNode;
    active: boolean;
    onPress: () => void;
  }) => (
    <Button
      unstyled
      onPress={onPress}
      px={12}
      py={10}
      borderRadius={8}
      bg={active ? '#2ECC71' : '$backgroundPress'}
      borderWidth={1}
      borderColor={active ? '#2ECC71' : '#E4E7EB'}
    >
      <XStack ai="center" gap="$2">
        {icon}
        <Text fontSize={13} fontWeight="600" color={active ? 'white' : '$gray11'}>
          {label}
        </Text>
      </XStack>
    </Button>
  );

  const gapBottom = (insets?.bottom ?? 0) + 72;

  return (
    <YStack f={1} bg="$background" position="relative">
      {/* Header */}
      <YStack bg="$background" p="$4" pb="$2">
        <XStack w="100%" ai="center" jc="flex-start" mb="$3">
          <YStack ai="flex-start">
            <Text fontSize={16} fontWeight="700">
              Orders
            </Text>
            <Text fontSize={12} color="$gray10">
              {sessionReceiptId ?? (isMockSession ? 'mock-001' : 'N/A')}
            </Text>
          </YStack>
        </XStack>
      </YStack>

      {/* Content */}
      <ScrollView
        f={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: gapBottom }}
      >
        <YStack px="$4" gap="$3">
          {/* Participants */}
          <YStack>
            <XStack w="100%" ai="center" jc="flex-start" mb="$2">
              <XStack ai="center" gap="$2">
                <UsersIcon size={18} color="$gray10" />
                <Text fontWeight="700">Participants ({participants.length})</Text>
              </XStack>
            </XStack>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack gap="$2" pr="$4">
                {participants.map((p) => (
                  <XStack
                    key={p.uniqueId}
                    ai="center"
                    gap="$2"
                    px="$2"
                    py="$1"
                    borderWidth={1}
                    borderColor="$gray6"
                    borderRadius={16}
                    minWidth={100}
                  >
                    <Avatar name={p.username} />
                    <Text numberOfLines={1} fontSize={13}>
                      {p.username}
                    </Text>
                  </XStack>
                ))}
              </XStack>
            </ScrollView>
          </YStack>

          {/* Items */}
          <YStack gap="$3" mt="$2">
            {items.map((it) => {
              const total =
                typeof it.totalPrice === 'number' ? it.totalPrice : it.price * it.quantity;
              const assigned = isAssigned(it);
              const singleOwner = it.splitMode !== 'count' && it.assignedTo.length === 1;
              const ownerName = singleOwner
                ? participants.find((p) => p.uniqueId === it.assignedTo[0])?.username
                : undefined;
              const priceParts = getCurrencyParts(total);
              const assignedUnits =
                it.splitMode === 'count'
                  ? Object.values(it.perPersonCount || {}).reduce((a, b) => a + (b || 0), 0)
                  : 0;

              let summaryText = '';
              if (it.splitMode === 'count') {
                summaryText = `${assignedUnits}/${it.quantity} assigned`;
              } else if (singleOwner) {
                summaryText = ownerName ?? '';
              } else if (it.quantity > 1) {
                summaryText = `1x ${fmtCurrency(it.price)}`;
              }

              const showUnitIcon = it.quantity > 1 && summaryText !== '';

              return (
                <YStack
                  key={it.id}
                  w="100%"
                  borderWidth={1}
                  borderColor={assigned ? '#2ECC71' : '#E4E7EB'}
                  borderRadius={12}
                  bg="$color1"
                >
                  <XStack w="100%" ai="center" jc="space-between" px={16} py="$3" gap="$3">
                    <YStack f={1} pr={12} gap="$1">
                      <Text fontSize={16} fontWeight="700" numberOfLines={1}>
                        {it.name}
                        {it.quantity > 1 ? ` (${it.quantity}x)` : ''}
                      </Text>
                      {summaryText && (
                        <XStack ai="center" gap="$1">
                          {showUnitIcon && <PackageIcon size={14} color="$gray10" />}
                          <Text fontSize={12} color="$gray10" numberOfLines={1}>
                            {summaryText}
                          </Text>
                        </XStack>
                      )}
                    </YStack>

                    <YStack ai="flex-end" gap="$2" flexShrink={0}>
                      <XStack ai="baseline" gap="$1">
                        <Text fontSize={12} color="$gray10">
                          {priceParts.currency}
                        </Text>
                        <Text fontSize={16} fontWeight="700" color="#2ECC71">
                          {priceParts.amount}
                        </Text>
                      </XStack>

                      <Button
                        unstyled
                        onPress={() => openAssignModal(it)}
                        width={assigned ? 109 : undefined}
                        minHeight={assigned ? 29 : 32}
                        px={assigned ? 16 : 12}
                        py={assigned ? 6 : undefined}
                        borderRadius={assigned ? 5 : 6}
                        bg={assigned ? '#2ECC711A' : '$backgroundPress'}
                        borderWidth={assigned ? 0 : 1}
                        borderColor={assigned ? 'transparent' : '#E4E7EB'}
                        ai="center"
                        jc="center"
                      >
                        <Text
                          fontSize={14}
                          fontWeight="600"
                          color={assigned ? '#2ECC71' : '$gray11'}
                        >
                          {assigned ? 'Change' : 'Who?'}
                        </Text>
                      </Button>
                    </YStack>
                  </XStack>
                </YStack>
              );
            })}
          </YStack>
        </YStack>
      </ScrollView>

      {/* Bottom progress -> button */}
      <YStack
        position="absolute"
        left={0}
        right={0}
        bottom={(insets?.bottom ?? 0) + 8}
        px="$4"
      >
        {!canContinue ? (
          <YStack p="$3" borderWidth={1} borderColor="$gray5" borderRadius={12} bg="$color1">
            <XStack w="100%" ai="center" jc="space-between" mb="$2">
              <Text color="$gray10" fontSize={13}>
                Assignment progress
              </Text>
              <Text fontSize={13} fontWeight="700">
                {assignedCount}/{totalItems}
              </Text>
            </XStack>
            <ProgressBar
              value={Math.round((assignedCount / Math.max(1, totalItems)) * 100)}
            />
          </YStack>
        ) : (
          <YStack>
            <Button
              unstyled
              onPress={onContinue}
              height={41}
              borderRadius={10}
              bg="#2ECC71"
              ai="center"
              jc="center"
              pressStyle={finalizing ? undefined : { opacity: 0.9 }}
              disabled={finalizing}
              opacity={finalizing ? 0.6 : 1}
            >
              <Text fontSize={16} fontWeight="600" color="white">
                {finalizing ? 'Saving...' : 'Continue'}
              </Text>
            </Button>
            {submitError && (
              <Text mt="$2" color="$red10" fontSize={13} textAlign="center">
                {submitError}
              </Text>
            )}
          </YStack>
        )}
      </YStack>

      {/* Assign Modal */}
      {editing && (
        <YStack
          position="absolute"
          inset={0}
          bg="rgba(0,0,0,0.35)"
          ai="center"
          pt={insets.top + 12}
        >
          <YStack
            w={358}
            maxWidth={358}
            h={(editingItem?.quantity || 1) > 1 ? 666 : 588}
            bg="$color1"
            borderRadius={8}
            p="$3"
          >
            {/* Header product + price */}
            <XStack w="100%" ai="center" jc="space-between" mb="$3">
              <Text fontSize={16} fontWeight="700" numberOfLines={1}>
                {editingItem?.name}
                {editingItem && editingItem.quantity > 1 ? ` (${editingItem.quantity}x)` : ''}
              </Text>
              <XStack ai="baseline" gap="$1">
                <Text fontSize={12} color="$gray10">
                  {editingPriceParts.currency}
                </Text>
                <Text fontSize={16} fontWeight="700" color="#2ECC71">
                  {editingPriceParts.amount}
                </Text>
              </XStack>
            </XStack>

            {editingItem && editingItem.quantity > 1 && (
              <XStack gap="$2" mb="$2">
                <ModeToggleButton
                  label="Equal split"
                  icon={<UsersIcon size={16} color={isEqualMode ? 'white' : '#2C3D4F'} />}
                  active={isEqualMode}
                  onPress={switchToEqual}
                />
                <ModeToggleButton
                  label="By units"
                  icon={<PackageIcon size={16} color={isCountMode ? 'white' : '#2C3D4F'} />}
                  active={isCountMode}
                  onPress={switchToCount}
                />
              </XStack>
            )}

            <XStack w="100%" ai="center" jc="space-between" mb="$2">
              <Text fontWeight="600">Assign to:</Text>
              <XStack ai="center" gap="$2">
                <Button chromeless onPress={modalAll}>
                  <Text color="#2ECC71" fontWeight="700">
                    All
                  </Text>
                </Button>
                <Text color="$gray8">|</Text>
                <Button chromeless onPress={modalClear}>
                  <Text color="#E74C3C" fontWeight="700">
                    Clear
                  </Text>
                </Button>
              </XStack>
            </XStack>

            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator>
              <YStack gap="$2" pb="$2">
                {participants.map((p) => {
                  const mode = effectiveMode;
                  const isCountRow = mode === 'count';
                  const assignedQty = editing.perPersonCount?.[p.uniqueId] || 0;
                  const isSelected = isCountRow
                    ? assignedQty > 0
                    : editing.assignedTo.includes(p.uniqueId);

                  return (
                    <Pressable
                      key={`m-${editing.id}-${p.uniqueId}`}
                      onPress={() => modalToggleUser(p.uniqueId)}
                      style={({ pressed }) => ({
                        width: '100%',
                        opacity: pressed ? 0.95 : 1,
                      })}
                    >
                      <XStack
                        h={60}
                        ai="center"
                        jc="space-between"
                        px={16}
                        borderWidth={1}
                        borderColor={isSelected ? '#2ECC71' : '#E4E7EB'}
                        borderRadius={12}
                        bg="$color1"
                      >
                        <XStack ai="center" gap="$3">
                          <Avatar name={p.username} />
                          <Text fontWeight="600">{p.username}</Text>
                        </XStack>

                        <XStack ai="center" gap="$3">
                          {isCountRow && (
                            <XStack ai="center" gap="$2">
                              <Button
                                unstyled
                                onPress={(e: any) => {
                                  e?.stopPropagation?.();
                                  modalDec(p.uniqueId);
                                }}
                                width={28}
                                height={28}
                                br={999}
                                bg="#E4E7EB"
                                ai="center"
                                jc="center"
                              >
                                <Minus size={16} color="#2C3D4F" />
                              </Button>
                              <Text minWidth={12} textAlign="center">
                                {assignedQty}
                              </Text>
                              <Button
                                unstyled
                                onPress={(e: any) => {
                                  e?.stopPropagation?.();
                                  modalInc(p.uniqueId);
                                }}
                                width={28}
                                height={28}
                                br={999}
                                bg="#E4E7EB"
                                ai="center"
                                jc="center"
                              >
                                <Plus size={16} color="#2C3D4F" />
                              </Button>
                            </XStack>
                          )}

                          <Circle
                            size={22}
                            borderColor="#2ECC71"
                            borderWidth={2}
                            ai="center"
                            jc="center"
                            bg={isSelected ? '#2ECC71' : 'transparent'}
                          >
                            {isSelected && <Check size={14} color="white" />}
                          </Circle>
                        </XStack>
                      </XStack>
                    </Pressable>
                  );
                })}
              </YStack>
            </ScrollView>

            {effectiveMode === 'equal' && editing.assignedTo.length > 0 && (
              <YStack mt="$2" p={8} borderRadius={5} bg="#2ECC711A">
                <Text fontSize={13} fontWeight="700" color="#2ECC71">
                  Assigned to {editing.assignedTo.length} participant(s)
                </Text>
                <Text fontSize={12} color="#2ECC71">
                  Price split equally:{' '}
                  {fmtCurrency(editingTotal / Math.max(1, editing.assignedTo.length))} each
                </Text>
              </YStack>
            )}

            {effectiveMode === 'count' &&
              Object.values(editing.perPersonCount).reduce((a, b) => a + (b || 0), 0) > 0 && (
                <YStack mt="$2" p={8} borderRadius={5} bg="#2ECC711A">
                  <Text fontSize={13} fontWeight="700" color="#2ECC71">
                    {Object.values(editing.perPersonCount).reduce((a, b) => a + (b || 0), 0)}{' '}
                    unit(s) assigned
                  </Text>
                  <Text fontSize={12} color="#2ECC71">
                    Per unit: {fmtCurrency(editingItem?.price || 0)}
                  </Text>
                </YStack>
              )}

            <XStack mt="auto" gap="$2">
              <Button
                unstyled
                onPress={closeAssignModal}
                width={155}
                height={41}
                borderRadius={10}
                borderWidth={1}
                borderColor="#E4E7EB"
                ai="center"
                jc="center"
              >
                <Text>Cancel</Text>
              </Button>
              <Button
                unstyled
                onPress={modalSave}
                width={155}
                height={41}
                borderRadius={10}
                bg="#2ECC71"
                ai="center"
                jc="center"
                disabled={saving}
                pressStyle={{ opacity: 0.9 }}
              >
                <Text color="white" fontWeight="600">
                  Save
                </Text>
              </Button>
            </XStack>
          </YStack>
        </YStack>
      )}

      {/* Finalizing spinner */}
      {finalizing && !showSuccess && (
        <YStack
          position="absolute"
          inset={0}
          ai="center"
          jc="center"
          bg="rgba(0,0,0,0.25)"
        >
          <YStack w={390} h={156} ai="center" jc="center" bg="$color1" br={12}>
            <Spinner size="large" color="#2ECC71" />
            <Text mt="$2" color="#2ECC71" fontSize={16} fontWeight="600">
              Saving split...
            </Text>
          </YStack>
        </YStack>
      )}

      {/* Success overlay */}
      {showSuccess && (
        <YStack
          position="absolute"
          inset={0}
          ai="center"
          jc="center"
          bg="rgba(0,0,0,0.25)"
        >
          <YStack w={390} h={156} ai="center" jc="center" bg="#2ECC71" br={12}>
            <Check size={42} color="white" />
            <Text mt="$2" color="white" fontSize={18} fontWeight="700">
              Bill confirmed
            </Text>
          </YStack>
        </YStack>
      )}
    </YStack>
  );
}
