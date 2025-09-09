import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  YStack, XStack, Text, Button, Input, Separator, Circle, ScrollView, View, Spinner
} from 'tamagui';
import { ChevronLeft, Edit3, Users as UsersIcon, Calculator, Check, ChevronUp, ChevronDown } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/shared/lib/stores/app-store';

// ===== Types =====
type Participant = { uniqueId: string; username: string };
type Item = {
  id: string;
  name: string;
  price: number;   // price per unit
  quantity: number;
  assignedTo: string[]; // array of participant uniqueIds
  splitMode?: 'equal' | 'custom';
};

// ===== Mock Items (reused every time) =====
const MOCK_ITEMS: Item[] = [
  { id: '1', name: 'Pizza Margherita',  price: 89000, quantity: 2, assignedTo: [], splitMode: undefined },
  { id: '2', name: 'Caesar Salad',      price: 45000, quantity: 1, assignedTo: [], splitMode: undefined },
  { id: '3', name: 'Coca-Cola 0.5L',    price: 12000, quantity: 4, assignedTo: [], splitMode: undefined },
  { id: '4', name: 'Tiramisu',          price: 32000, quantity: 1, assignedTo: [], splitMode: undefined },
  { id: '5', name: 'Soup of the day',   price: 28000, quantity: 1, assignedTo: [], splitMode: undefined },
];

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

const fmtUZS = (n: number) => `UZS ${Math.round(n).toLocaleString('en-US')}`;

// ===== Screen =====
export default function ItemsSplitScreen() {
  const { participants: participantsParam, receiptId } =
    useLocalSearchParams<{ participants?: string; receiptId?: string }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useAppStore(s => s.user);

  // participants come from query; fallback to `me` to avoid empty set
  const participantsFromRoute = useMemo<Participant[]>(() => {
    const parsed = parseParticipantsParam(participantsParam);
    if (parsed && parsed.length > 0) return parsed;
    if (me?.uniqueId) return [{ uniqueId: me.uniqueId, username: me.username || me.uniqueId }];
    return [];
  }, [participantsParam, me?.uniqueId, me?.username]);

  // Keep items in state (we will mutate assignments)
  const [items, setItems] = useState<Item[]>(() => JSON.parse(JSON.stringify(MOCK_ITEMS)));

  // Expand/collapse inline assignment block per item
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Bottom totals panel: collapsible
  const [totalsExpanded, setTotalsExpanded] = useState<boolean>(false);

  useEffect(() => {
    setItems(JSON.parse(JSON.stringify(MOCK_ITEMS)));
  }, [receiptId]);

  // ===== Derived =====
  const totalItems = items.length;
  const assignedCount = useMemo(
    () => items.reduce((acc, it) => acc + (it.assignedTo.length > 0 ? 1 : 0), 0),
    [items]
  );
  const progressPct = totalItems > 0 ? Math.round((assignedCount / totalItems) * 100) : 0;

  const perParticipantTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    participantsFromRoute.forEach(p => { totals[p.uniqueId] = 0; });
    for (const it of items) {
      const totalPrice = it.price * it.quantity;
      const k = it.assignedTo.length || 1;
      const share = totalPrice / k;
      if (it.assignedTo.length === 0) continue;
      for (const uid of it.assignedTo) {
        if (totals[uid] === undefined) totals[uid] = 0;
        totals[uid] += share;
      }
    }
    return totals;
  }, [items, participantsFromRoute]);

  const canCalculate = assignedCount === totalItems;

  // Calculate visible participants count for +N indicator
  const VISIBLE_PARTICIPANTS = 3;
  const hiddenCount = Math.max(0, participantsFromRoute.length - VISIBLE_PARTICIPANTS);

  // ===== Actions =====
  const toggleAssign = useCallback((itemId: string, uid: string) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== itemId) return it;
        const has = it.assignedTo.includes(uid);
        const nextAssigned = has
          ? it.assignedTo.filter(x => x !== uid)
          : [...it.assignedTo, uid];
        return {
          ...it,
          assignedTo: nextAssigned,
          splitMode: undefined,
        };
      })
    );
  }, []);

  const splitEqually = useCallback((itemId: string) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== itemId) return it;
        // Toggle: если уже равномерно разделено, то очищаем
        if (it.splitMode === 'equal') {
          return { ...it, assignedTo: [], splitMode: undefined };
        }
        // Иначе назначаем всех
        const all = participantsFromRoute.map(p => p.uniqueId);
        return { ...it, assignedTo: all, splitMode: 'equal' };
      })
    );
  }, [participantsFromRoute]);

  const clearAssignment = useCallback((itemId: string) => {
    setItems(prev =>
      prev.map(it => (it.id === itemId ? { ...it, assignedTo: [], splitMode: undefined } : it))
    );
  }, []);

  const goBack = () => router.back();

  const onCalculate = () => {
    if (!canCalculate) return;
    const lines = participantsFromRoute
      .map(p => `${p.username}: ${fmtUZS(perParticipantTotals[p.uniqueId] || 0)}`)
      .join('\n');
    Alert.alert('Totals', lines);
  };

  // ===== UI subcomponents =====
  const ProgressBar = ({ value }: { value: number }) => (
    <YStack h={8} w="100%" br={999} bg="$gray5" overflow="hidden">
      <YStack h="100%" w={`${Math.max(0, Math.min(100, value))}%`} bg="#2ECC71" />
    </YStack>
  );

  const Avatar = ({ name, color }: { name: string; color?: string }) => (
    <Circle size={28} bg={color || '$gray5'} ai="center" jc="center">
      <Text color="white" fontWeight="700">
        {name?.[0]?.toUpperCase() || '?'}
      </Text>
    </Circle>
  );

  const Chip = ({
    active,
    label,
    onPress,
  }: { active?: boolean; label: string; onPress?: () => void }) => (
    <Button
      unstyled
      onPress={onPress}
      h={32}
      px={12}
      borderRadius={16}
      borderWidth={1}
      borderColor={active ? '#2ECC71' : '$gray6'}
      backgroundColor={active ? '#2ECC71' : 'transparent'}
      ai="center"
      jc="center"
      pressStyle={{ opacity: 0.9 }}
    >
      <XStack ai="center" gap="$2">
        <Text fontSize={14} fontWeight="600" color={active ? 'white' : '$gray12'}>
          {label}
        </Text>
        {active && <Check size={14} color="white" />}
      </XStack>
    </Button>
  );

  const ClickableUserChip = ({ 
    participant, 
    selected, 
    onPress 
  }: { 
    participant: Participant; 
    selected?: boolean; 
    onPress?: () => void 
  }) => (
    <Button
      unstyled
      onPress={onPress}
      borderWidth={1}
      borderColor={selected ? '#2ECC71' : '$gray6'}
      backgroundColor={selected ? '#2ECC71' : 'transparent'}
      borderRadius={16}
      px="$2"
      py="$1"
      pressStyle={{ opacity: 0.9 }}
    >
      <XStack ai="center" gap="$2">
        <Avatar name={participant.username} />
        <Text fontSize={13} color={selected ? 'white' : '$gray12'} numberOfLines={1}>
          {participant.username}
        </Text>
        {selected && <Check size={14} color="white" />}
      </XStack>
    </Button>
  );

  // ===== Layout paddings (dynamic for bottom panel) =====
  const PANEL_H_COLLAPSED = 64;   // только кнопка
  const PANEL_H_EXPANDED  = 240;  // список тоталсов + кнопка
  const bottomPad = (insets?.bottom ?? 0) + (totalsExpanded ? PANEL_H_EXPANDED : PANEL_H_COLLAPSED) + 12;

  return (
    <YStack f={1} bg="$background" position="relative">
      {/* Fixed Header + Progress */}
      <YStack bg="$background" p="$4" pb="$2">
        {/* Header */}
        <XStack ai="center" jc="space-between" mb="$3">
          <Button size="$2" h={28} chromeless onPress={goBack} icon={<ChevronLeft size={18} />}>
            Back
          </Button>
          <YStack ai="center">
            <Text fontSize={16} fontWeight="700">Receipt</Text>
            <Text fontSize={12} color="$gray10">{receiptId || 'mock-001'}</Text>
          </YStack>
          <View w={54} />
        </XStack>

        {/* Progress */}
        <YStack gap="$2">
          <XStack jc="space-between">
            <Text color="$gray10" fontSize={13}>Assignment progress</Text>
            <Text fontSize={13} fontWeight="700">{assignedCount}/{totalItems}</Text>
          </XStack>
          <ProgressBar value={progressPct} />
        </YStack>
      </YStack>

      {/* Scrollable Content */}
      <ScrollView
        f={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad }}
      >
        <YStack px="$4" gap="$3">
          {/* Participants section (now scrollable) */}
          <YStack>
            <XStack ai="center" jc="space-between" mb="$2">
              <XStack ai="center" gap="$2">
                <UsersIcon size={18} color="$gray10" />
                <Text fontWeight="700">Participants ({participantsFromRoute.length})</Text>
              </XStack>
              
              {/* Always visible +N indicator in header */}
              {hiddenCount > 0 && (
                <XStack
                  ai="center"
                  jc="center"
                  px="$2"
                  py="$1"
                  borderWidth={1}
                  borderColor="$gray6"
                  borderRadius={12}
                  bg="$gray2"
                >
                  <Text fontSize={12} color="$gray10" fontWeight="600">+{hiddenCount}</Text>
                </XStack>
              )}
            </XStack>
            
            {/* Horizontal scroll with ALL participants */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack gap="$2" pr="$4">
                {participantsFromRoute.map(p => (
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
                    <Text numberOfLines={1} fontSize={13}>{p.username}</Text>
                  </XStack>
                ))}
              </XStack>
            </ScrollView>
          </YStack>

          <Separator />

          {/* Items list */}
          <YStack gap="$3" mt="$2">
            {items.map((it) => {
              const total = it.price * it.quantity;
              const perHead = it.assignedTo.length > 0 ? total / it.assignedTo.length : 0;
              const expanded = expandedItemId === it.id;

              return (
                <YStack key={it.id} p="$3" borderWidth={1} borderColor="$gray5" borderRadius={12} bg="$color1">
                  {/* Header row */}
                  <XStack jc="space-between" ai="flex-start">
                    <YStack f={1}>
                      <Text fontSize={16} fontWeight="700" numberOfLines={2}>{it.name}</Text>
                      <XStack ai="center" gap="$3" mt="$1">
                        <Text fontSize={15} fontWeight="700">{fmtUZS(it.price)}</Text>
                        <Text fontSize={12} color="$gray10">× {it.quantity}</Text>
                      </XStack>
                    </YStack>
                    <Button chromeless size="$2" circular icon={<Edit3 size={16} color="$gray11" />} />
                  </XStack>

                  {/* Actions */}
                  <XStack mt="$2" gap="$2" ai="center" fw="wrap">
                    <Chip
                      label="Split equally"
                      active={it.splitMode === 'equal'}
                      onPress={() => splitEqually(it.id)}
                    />
                    <Chip
                      label={expanded ? 'Hide assign' : 'Assign'}
                      active={expanded}
                      onPress={() => setExpandedItemId(expanded ? null : it.id)}
                    />
                    {it.assignedTo.length > 0 && (
                      <Chip label="Clear" onPress={() => clearAssignment(it.id)} />
                    )}
                  </XStack>

                  {/* Inline assign grid (2 in a row, clickable chips) */}
                  {expanded && (
                    <YStack mt="$2" gap="$2">
                      <XStack gap="$2" flexWrap="wrap">
                        {participantsFromRoute.map((p, index) => {
                          const selected = it.assignedTo.includes(p.uniqueId);
                          return (
                            <View
                              key={`${it.id}-${p.uniqueId}`}
                              width="48%"  // 2 in a row
                            >
                              <ClickableUserChip
                                participant={p}
                                selected={selected}
                                onPress={() => toggleAssign(it.id, p.uniqueId)}
                              />
                            </View>
                          );
                        })}
                      </XStack>
                      {it.assignedTo.length > 0 && (
                        <Text fontSize={12} color="$gray10">
                          ~ {fmtUZS(perHead)} per person
                        </Text>
                      )}
                    </YStack>
                  )}
                </YStack>
              );
            })}
          </YStack>
        </YStack>
      </ScrollView>

      {/* Bottom totals panel (collapsible) */}
      <YStack
        position="absolute"
        left={0}
        right={0}
        bottom={(insets?.bottom ?? 0) + 8}
        px="$4"
        pointerEvents="box-none"
      >
        <YStack
          p="$3"
          borderWidth={1}
          borderColor="$gray5"
          borderRadius={12}
          bg="$color1"
          pointerEvents="auto"
          maxHeight={totalsExpanded ? PANEL_H_EXPANDED : PANEL_H_COLLAPSED}
          overflow="hidden"
        >
          <XStack ai="center" jc="space-between" mb="$2">
            <Text fontWeight="700">Totals by participant</Text>
            <Button
              chromeless
              size="$2"
              onPress={() => setTotalsExpanded(v => !v)}
              icon={totalsExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            >
              {totalsExpanded ? 'Hide' : 'Show'}
            </Button>
          </XStack>

          {totalsExpanded && (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 140 }}>
              <YStack gap="$2" mb="$2">
                {participantsFromRoute.map(p => {
                  const total = perParticipantTotals[p.uniqueId] || 0;
                  if (total <= 0) return null;
                  return (
                    <XStack key={`total-${p.uniqueId}`} jc="space-between" ai="center">
                      <XStack ai="center" gap="$2">
                        <Avatar name={p.username} />
                        <Text fontWeight="600">{p.username}</Text>
                      </XStack>
                      <Text fontWeight="700">{fmtUZS(total)}</Text>
                    </XStack>
                  );
                })}
              </YStack>
            </ScrollView>
          )}

          <Button
            unstyled
            onPress={onCalculate}
            disabled={!canCalculate}
            height={41}
            borderRadius={10}
            bg="#2ECC71"
            ai="center"
            jc="center"
            pressStyle={{ opacity: 0.9 }}
            opacity={canCalculate ? 1 : 0.5}
          >
            <XStack ai="center" gap="$2">
              <Calculator size={18} color="white" />
              <Text fontSize={16} fontWeight="500" color="white" style={{ lineHeight: 25 }}>
                Calculate ({assignedCount}/{totalItems})
              </Text>
            </XStack>
          </Button>
        </YStack>
      </YStack>
    </YStack>
  );
}