import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import {
  YStack, XStack, Text, Button, Circle, ScrollView, View
} from 'tamagui';
import { ChevronLeft, Users as UsersIcon, Check, Plus, Minus, Package as PackageIcon } from '@tamagui/lucide-icons';
import { useAppStore } from '@/shared/lib/stores/app-store';

// ===== Types =====
type Participant = { uniqueId: string; username: string };
type SplitMode = 'equal' | 'count' | undefined;
type Item = {
  id: string;
  name: string;
  price: number;      // price per unit
  quantity: number;
  // equal mode
  assignedTo: string[];
  // count mode
  perPersonCount?: Record<string, number>;
  splitMode?: SplitMode;
};

// ===== Mock Data =====
const MOCK_ITEMS: Item[] = [
  { id: '1', name: 'Pizza Margherita', price: 89000, quantity: 2, assignedTo: [] },
  { id: '2', name: 'Caesar Salad',     price: 45000, quantity: 1, assignedTo: [] },
  { id: '3', name: 'Cola',             price: 10000, quantity: 5, assignedTo: [] },
  { id: '4', name: 'Tiramisu',         price: 32000, quantity: 1, assignedTo: [] },
  { id: '5', name: 'Soup of the day',  price: 28000, quantity: 1, assignedTo: [] },
];

// ===== Helpers =====
const parseParticipantsParam = (raw?: string): Participant[] => {
  if (!raw) return [];
  try {
    const decoded = decodeURIComponent(raw);
    return JSON.parse(decoded);
  } catch {
    try { return JSON.parse(raw); } catch { return []; }
  }
};

const fmtUZS = (n: number) => `UZS ${Math.round(n).toLocaleString('en-US')}`;
const getCurrencyParts = (n: number) => {
  const [currency, ...rest] = fmtUZS(n).split(' ');
  return { currency, amount: rest.join(' ') || '0' };
};


export default function ItemsSplitScreen() {
  const { participants: participantsParam, receiptId } =
    useLocalSearchParams<{ participants?: string; receiptId?: string }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useAppStore(s => s.user);

  // --- participants ---
  const participants = useMemo<Participant[]>(() => {
    const parsed = parseParticipantsParam(participantsParam);
    const base = (parsed && parsed.length > 0)
      ? parsed
      : (me?.uniqueId ? [{ uniqueId: me.uniqueId, username: me.username || me.uniqueId }] : []);
    const meId = me?.uniqueId;
    const sorted = [...base].sort((a, b) => {
      if (meId && a.uniqueId === meId) return -1;
      if (meId && b.uniqueId === meId) return 1;
      return (a.username || '').localeCompare(b.username || '');
    });
    return sorted;
  }, [participantsParam, me?.uniqueId, me?.username]);

  // --- items state ---
  const [items, setItems] = useState<Item[]>(() => JSON.parse(JSON.stringify(MOCK_ITEMS)));

  // modal editing state
  type Editing = { id: string; splitMode: SplitMode; assignedTo: string[]; perPersonCount: Record<string, number> } | null;
  const [editing, setEditing] = useState<Editing>(null);
  const [saving, setSaving] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  const resetState = useCallback(() => {
    setItems(JSON.parse(JSON.stringify(MOCK_ITEMS)));
    setEditing(null);
    setSaving(false);
    setShowSuccess(false);
  }, [setItems, setEditing, setSaving, setShowSuccess]);

  useEffect(() => {
    resetState();
  }, [receiptId, resetState]);

  useFocusEffect(
    useCallback(() => {
      resetState();
    }, [resetState])
  );

  // --- derived ---
  const isAssigned = (it: Item) => {
    if (it.splitMode === 'count') {
      const c = it.perPersonCount || {};
      return Object.values(c).reduce((a, b) => a + (b || 0), 0) > 0;
    }
    return (it.assignedTo?.length ?? 0) > 0;
  };
  const assignedCount = useMemo(() => items.reduce((acc, it) => acc + (isAssigned(it) ? 1 : 0), 0), [items]);
  const totalItems = items.length;
  const canContinue = assignedCount === totalItems && totalItems > 0;

  const totalsByParticipant = useMemo(() => {
    const totals: Record<string, number> = {};
    participants.forEach(p => (totals[p.uniqueId] = 0));
    for (const it of items) {
      const total = it.price * it.quantity;
      if (it.splitMode === 'count' && it.perPersonCount) {
        for (const [uid, cnt] of Object.entries(it.perPersonCount)) {
          if (!cnt) continue;
          totals[uid] = (totals[uid] || 0) + cnt * it.price;
        }
        continue;
      }
      const k = it.assignedTo.length;
      if (k === 0) continue;
      const share = total / k;
      for (const uid of it.assignedTo) totals[uid] = (totals[uid] || 0) + share;
    }
    return totals;
  }, [items, participants]);

  // --- modal helpers ---
  function openAssignModal(it: Item) {
    const initialMode: SplitMode = it.splitMode ?? (it.quantity > 1 ? "count" : "equal");
    const assigned = initialMode === "equal" ? [...(it.assignedTo || [])] : [];
    const perCount = initialMode === "count" ? { ...(it.perPersonCount || {}) } : {};
    setEditing({ id: it.id, splitMode: initialMode, assignedTo: assigned, perPersonCount: perCount });
  }
  function closeAssignModal() { setEditing(null); }
  function modalAll() {
    if (!editing) return;
    setEditing({ ...editing, splitMode: 'equal', assignedTo: participants.map(p => p.uniqueId), perPersonCount: {} });
  }
  function modalClear() {
    if (!editing) return;
    setEditing({ ...editing, splitMode: effectiveMode, assignedTo: [], perPersonCount: {} });
  }

  function switchToEqual() {
    if (!editing) return;
    const participantsWithUnits = Object.entries(editing.perPersonCount).filter(([, value]) => (value || 0) > 0).map(([uid]) => uid);
    const baseAssigned = editing.assignedTo.length ? editing.assignedTo : participantsWithUnits;
    setEditing({ ...editing, splitMode: 'equal', assignedTo: baseAssigned, perPersonCount: {} });
  }
  function switchToCount() {
    if (!editing || !editingItem) return;
    const existing = Object.entries(editing.perPersonCount).filter(([, value]) => (value || 0) > 0);
    if (existing.length === 0 && editing.assignedTo.length > 0) {
      let remaining = editingItem.quantity;
      const counts: Record<string, number> = {};
      editing.assignedTo.forEach((uid) => {
        if (remaining <= 0) return;
        counts[uid] = 1;
        remaining -= 1;
      });
      setEditing({ ...editing, splitMode: 'count', assignedTo: [], perPersonCount: counts });
      return;
    }
    setEditing({ ...editing, splitMode: 'count', assignedTo: [], perPersonCount: { ...editing.perPersonCount } });
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
      setEditing({ ...editing, splitMode: 'count', assignedTo: [], perPersonCount: next });
      return;
    }
    const has = editing.assignedTo.includes(uid);
    const next = has ? editing.assignedTo.filter(x => x !== uid) : [...editing.assignedTo, uid];
    setEditing({ ...editing, splitMode: 'equal', assignedTo: next, perPersonCount: {} });
  }
  function modalInc(uid: string) {
    if (!editing || !editingItem) return;
    const next = { ...editing.perPersonCount };
    const sum = Object.values(next).reduce((a, b) => a + (b || 0), 0);
    if (sum >= editingItem.quantity) return; // don't exceed total qty
    next[uid] = (next[uid] || 0) + 1;
    setEditing({ ...editing, splitMode: 'count', perPersonCount: next, assignedTo: [] });
  }
  function modalDec(uid: string) {
    if (!editing) return;
    const next = { ...editing.perPersonCount };
    const v = (next[uid] || 0) - 1;
    if (v <= 0) delete next[uid]; else next[uid] = v;
    setEditing({ ...editing, splitMode: 'count', perPersonCount: next, assignedTo: [] });
  }
  async function modalSave() {
    if (!editing) return;
    const mode = effectiveMode;
    setSaving(true);
    try {
      setItems(prev => prev.map(it => {
        if (it.id !== editing.id) return it;
        return {
          ...it,
          splitMode: mode,
          assignedTo: mode === 'equal' ? [...editing.assignedTo] : [],
          perPersonCount: mode === 'count' ? { ...editing.perPersonCount } : undefined,
        } as Item;
      }));
      setEditing(null);
    } finally { setSaving(false); }
  }

  // Add missing variables that are referenced in the component
  const editingItem = editing ? items.find(it => it.id === editing.id) : null;
  const editingTotal = editingItem ? editingItem.price * editingItem.quantity : 0;
  const editingPriceParts = getCurrencyParts(editingTotal);
  const effectiveMode = editing?.splitMode || (editingItem?.quantity && editingItem.quantity > 1 ? 'count' : 'equal');
  const isEqualMode = effectiveMode === 'equal';
  const isCountMode = effectiveMode === 'count';

  // --- success after-delay ---
  const onContinue = () => {
    if (!canContinue) return;
    setShowSuccess(true);
    const payload = { participants, totals: totalsByParticipant, items, receiptId: receiptId || 'mock-001' };
    setTimeout(() => {
      setShowSuccess(false);
      try {
        const q = encodeURIComponent(JSON.stringify(payload));
        router.push({ pathname: '/tabs/sessions/finish', params: { data: q } });
      } catch { router.push('/tabs'); }
      resetState();
    }, 2000);
  };

  // --- UI atoms ---
  const Avatar = ({ name }: { name: string }) => (
    <Circle size={28} bg="$gray5" ai="center" jc="center">
      <Text color="white" fontWeight="700">{name?.[0]?.toUpperCase() || '?'}</Text>
    </Circle>
  );

  const ProgressBar = ({ value }: { value: number }) => (
    <YStack h={8} w="100%" br={999} bg="$gray5" overflow="hidden">
      <YStack h="100%" w={`${Math.max(0, Math.min(100, value))}%`} bg="#2ECC71" />
    </YStack>
  );

  const ModeToggleButton = ({ label, icon, active, onPress }: { label: string; icon: React.ReactNode; active: boolean; onPress: () => void }) => (
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
        <Text fontSize={13} fontWeight="600" color={active ? 'white' : '$gray11'}>{label}</Text>
      </XStack>
    </Button>
  );

  const gapBottom = (insets?.bottom ?? 0) + 72;

  return (
    <YStack f={1} bg="$background" position="relative">
      {/* Header */}
      <YStack bg="$background" p="$4" pb="$2">
        <XStack ai="center" jc="space-between" mb="$3">
          <Button size="$2" h={28} chromeless onPress={() => router.back()} icon={<ChevronLeft size={18} />}>Back</Button>
          <YStack ai="center">
            <Text fontSize={16} fontWeight="700">Orders</Text>
            <Text fontSize={12} color="$gray10">{receiptId || 'mock-001'}</Text>
          </YStack>
          <View w={54} />
        </XStack>
      </YStack>

      {/* Content */}
      <ScrollView f={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: gapBottom }}>
        <YStack px="$4" gap="$3">
          {/* Participants */}
          <YStack>
            <XStack ai="center" jc="space-between" mb="$2">
              <XStack ai="center" gap="$2">
                <UsersIcon size={18} color="$gray10" />
                <Text fontWeight="700">Participants ({participants.length})</Text>
              </XStack>
            </XStack>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack gap="$2" pr="$4">
                {participants.map(p => (
                  <XStack key={p.uniqueId} ai="center" gap="$2" px="$2" py="$1" borderWidth={1} borderColor="$gray6" borderRadius={16} minWidth={100}>
                    <Avatar name={p.username} />
                    <Text numberOfLines={1} fontSize={13}>{p.username}</Text>
                  </XStack>
                ))}
              </XStack>
            </ScrollView>
          </YStack>

          {/* Items */}
          <YStack gap="$3" mt="$2">
            {items.map((it) => {
              const total = it.price * it.quantity;
              const assigned = isAssigned(it);
              const singleOwner = it.splitMode !== 'count' && it.assignedTo.length === 1;
              const ownerName = singleOwner ? participants.find(p => p.uniqueId === it.assignedTo[0])?.username : undefined;
              const priceParts = getCurrencyParts(total);
              const assignedUnits = it.splitMode === 'count'
                ? Object.values(it.perPersonCount || {}).reduce((a, b) => a + (b || 0), 0)
                : 0;
              let summaryText = '';
              if (it.splitMode === 'count') {
                summaryText = `${assignedUnits}/${it.quantity} assigned`;
              } else if (singleOwner) {
                summaryText = ownerName ?? '';
              } else if (it.quantity > 1) {
                summaryText = `1x ${fmtUZS(it.price)}`;
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
                        {it.name}{it.quantity > 1 ? ` (${it.quantity}x)` : ''}
                      </Text>
                      {summaryText && (
                        <XStack ai="center" gap="$1">
                          {showUnitIcon && <PackageIcon size={14} color="$gray10" />}
                          <Text fontSize={12} color="$gray10" numberOfLines={1}>{summaryText}</Text>
                        </XStack>
                      )}
                    </YStack>
                    <YStack ai="flex-end" gap="$2" flexShrink={0}>
                      <XStack ai="baseline" gap="$1">
                        <Text fontSize={12} color="$gray10">{priceParts.currency}</Text>
                        <Text fontSize={16} fontWeight="700" color="#2ECC71">{priceParts.amount}</Text>
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
                        <Text fontSize={14} fontWeight="600" color={assigned ? '#2ECC71' : '$gray11'}>
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

      {/* Bottom progress → button */}
      <YStack position="absolute" left={0} right={0} bottom={(insets?.bottom ?? 0) + 8} px="$4">
        {!canContinue ? (
          <YStack p="$3" borderWidth={1} borderColor="$gray5" borderRadius={12} bg="$color1">
            <XStack jc="space-between" mb="$2">
              <Text color="$gray10" fontSize={13}>Assignment progress</Text>
              <Text fontSize={13} fontWeight="700">{assignedCount}/{totalItems}</Text>
            </XStack>
            <ProgressBar value={Math.round((assignedCount/Math.max(1,totalItems))*100)} />
          </YStack>
        ) : (
          <Button unstyled onPress={onContinue} height={41} borderRadius={10} bg="#2ECC71" ai="center" jc="center" pressStyle={{ opacity: 0.9 }}>
            <Text fontSize={16} fontWeight="600" color="white">Continue</Text>
          </Button>
        )}
      </YStack>

      {/* Assign Modal */}
      {editing && (
        <YStack position="absolute" inset={0} bg="rgba(0,0,0,0.35)" ai="center" pt={insets.top + 12}>
          <YStack w={358} maxWidth={358} h={(editingItem?.quantity || 1) > 1 ? 666 : 588} bg="$color1" borderRadius={8} p="$3">
            {/* Header product + price */}
            <XStack jc="space-between" ai="center" mb="$3">
              <Text fontSize={16} fontWeight="700" numberOfLines={1}>
                {editingItem?.name}
                {editingItem && editingItem.quantity > 1 ? ` (${editingItem.quantity}x)` : ''}
              </Text>
              <XStack ai="baseline" gap="$1">
                <Text fontSize={12} color="$gray10">{editingPriceParts.currency}</Text>
                <Text fontSize={16} fontWeight="700" color="#2ECC71">{editingPriceParts.amount}</Text>
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

            <XStack jc="space-between" ai="center" mb="$2">
              <Text fontWeight="600">Assign to:</Text>
              <XStack ai="center" gap="$2">
                <Button chromeless onPress={modalAll}><Text color="#2ECC71" fontWeight="700">All</Text></Button>
                <Text color="$gray8">|</Text>
                <Button chromeless onPress={modalClear}><Text color="#E74C3C" fontWeight="700">Clear</Text></Button>
              </XStack>
            </XStack>

            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator>
              <YStack gap="$2" pb="$2">
                {participants.map((p) => {
                  const mode = effectiveMode;
                  const isCountRow = mode === 'count';
                  const assignedQty = editing.perPersonCount?.[p.uniqueId] || 0;
                  const isSelected = isCountRow ? assignedQty > 0 : editing.assignedTo.includes(p.uniqueId);
                  return (
                    <Pressable
                      key={`m-${editing.id}-${p.uniqueId}`}
                      onPress={() => modalToggleUser(p.uniqueId)}
                      style={({ pressed }) => ({ width: '100%', opacity: pressed ? 0.95 : 1 })}
                    >
                      <XStack h={60} ai="center" jc="space-between" px={16} borderWidth={1} borderColor={isSelected ? '#2ECC71' : '#E4E7EB'} borderRadius={12} bg="$color1">
                        <XStack ai="center" gap="$3">
                          <Avatar name={p.username} />
                          <Text fontWeight="600">{p.username}</Text>
                        </XStack>
                        <XStack ai="center" gap="$3">
                          {isCountRow && (
                            <XStack ai="center" gap="$2">
                              <Button
                                unstyled
                                onPress={(e: any) => { e?.stopPropagation?.(); modalDec(p.uniqueId); }}
                                width={28}
                                height={28}
                                br={999}
                                bg="#E4E7EB"
                                ai="center"
                                jc="center"
                              >
                                <Minus size={16} color="#2C3D4F" />
                              </Button>
                              <Text minWidth={12} textAlign="center">{assignedQty}</Text>
                              <Button
                                unstyled
                                onPress={(e: any) => { e?.stopPropagation?.(); modalInc(p.uniqueId); }}
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
                          <Circle size={22} borderColor="#2ECC71" borderWidth={2} ai="center" jc="center" bg={isSelected ? '#2ECC71' : 'transparent'}>
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
                <Text fontSize={13} fontWeight="700" color="#2ECC71">Assigned to {editing.assignedTo.length} participant(s)</Text>
                <Text fontSize={12} color="#2ECC71">
                  Price split equally: {fmtUZS(editingTotal / Math.max(1, editing.assignedTo.length))} each
                </Text>
              </YStack>
            )}

            {effectiveMode === 'count' && Object.values(editing.perPersonCount).reduce((a,b)=>a+(b||0),0) > 0 && (
              <YStack mt="$2" p={8} borderRadius={5} bg="#2ECC711A">
                <Text fontSize={13} fontWeight="700" color="#2ECC71">{Object.values(editing.perPersonCount).reduce((a,b)=>a+(b||0),0)} unit(s) assigned</Text>
                <Text fontSize={12} color="#2ECC71">Per unit: {fmtUZS(editingItem?.price || 0)}</Text>
              </YStack>
            )}

            <XStack mt="auto" gap="$2">
              <Button unstyled onPress={closeAssignModal} width={155} height={41} borderRadius={10} borderWidth={1} borderColor="#E4E7EB" ai="center" jc="center">
                <Text>Cancel</Text>
              </Button>
              <Button unstyled onPress={modalSave} width={155} height={41} borderRadius={10} bg="#2ECC71" ai="center" jc="center" disabled={saving} pressStyle={{ opacity: 0.9 }}>
                <Text color="white" fontWeight="600">Save</Text>
              </Button>
            </XStack>
          </YStack>
        </YStack>
      )}

      {/* success after-delay */}
      {showSuccess && (
        <YStack position="absolute" inset={0} ai="center" jc="center" bg="rgba(0,0,0,0.25)">
          <YStack w={390} h={156} ai="center" jc="center" bg="#2ECC71" br={12}>
            <Check size={42} color="white" />
            <Text mt="$2" color="white" fontSize={18} fontWeight="700">Bill confirmed</Text>
          </YStack>
        </YStack>
      )}
    </YStack>
  );
}
