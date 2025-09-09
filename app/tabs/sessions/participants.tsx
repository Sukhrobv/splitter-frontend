import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  YStack, XStack, Button, Spinner, Text, Circle, Input, ScrollView
} from 'tamagui';
import { ChevronLeft, Users as UsersIcon, Check } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFriendsStore } from '@/features/friends/model/friends.store';
import { useAppStore } from '@/shared/lib/stores/app-store';
import { useGroupsStore } from '@/features/groups/model/groups.store';

type LiteUser = { uniqueId: string; username: string };

export default function SessionParticipantsScreen() {
  const { receiptId } = useLocalSearchParams<{ receiptId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // stores
  const me = useAppStore(s => s.user);
  const { friends, loading: friendsLoading, error: friendsError, fetchAll: fetchFriends } = useFriendsStore();
  const { groups, counts, fetchGroups, openGroup } = useGroupsStore();

  // -------- state --------
  const [q, setQ] = useState('');
  // Инициализируем пусто: «меня» добавим эффектом, когда будет доступен user
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [groupMembers, setGroupMembers] = useState<Record<number, LiteUser[]>>({});
  const [groupLoading, setGroupLoading] = useState<Record<number, boolean>>({});
  // авто-добавленные из активной группы (чтобы корректно снимать при переключениях)
  const [autoFromGroup, setAutoFromGroup] = useState<Record<string, number | undefined>>({});
  const autoRef = useRef(autoFromGroup);
  useEffect(() => { autoRef.current = autoFromGroup; }, [autoFromGroup]);

  // -------- boot --------
  useEffect(() => { fetchFriends(); }, [fetchFriends]);
  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  // robust me: берём uniqueId, иначе username, иначе id
  const meUid = useMemo(() => {
    return (me?.uniqueId || me?.username || (typeof me?.id === 'number' ? `id:${me.id}` : '')) as string;
  }, [me?.uniqueId, me?.username, me?.id]);
  const meName = useMemo(() => (me?.username || 'You') as string, [me?.username]);

  // гарантируем, что «я» всегда в selected = true при появлении user
  useEffect(() => {
    if (!meUid) return;
    setSelected(prev => ({ ...prev, [meUid]: true }));
  }, [meUid]);

  // helpers
  const dedupByUniqueId = (arr: LiteUser[]) => {
    const seen = new Set<string>();
    const out: LiteUser[] = [];
    for (const u of arr) {
      if (!u.uniqueId || seen.has(u.uniqueId)) continue;
      seen.add(u.uniqueId);
      out.push(u);
    }
    return out;
  };

  // Me FIRST + Friends («я» всегда есть в кандидатах)
  const basePeople: LiteUser[] = useMemo(() => {
    const res: LiteUser[] = [];
    if (meUid) res.push({ uniqueId: meUid, username: meName });
    (friends ?? []).forEach((f: any) => {
      const uid = f?.user?.uniqueId ?? f?.uniqueId;
      if (!uid) return;
      const uname = f?.user?.username ?? f?.username ?? uid;
      res.push({ uniqueId: uid, username: uname });
    });
    return res;
  }, [friends, meUid, meName]);

  // cache group members
  async function loadGroupMembers(gid: number): Promise<LiteUser[]> {
    if (groupMembers[gid]) return groupMembers[gid];
    setGroupLoading(m => ({ ...m, [gid]: true }));
    try {
      await openGroup(gid);
      const st = (useGroupsStore as any)?.getState?.();
      const raw = st?.current?.members ?? [];
      const mapped: LiteUser[] = raw
        .map((m: any) => ({
          uniqueId: m?.uniqueId ?? '',
          username: m?.username ?? (m?.uniqueId ?? ''),
        }))
        .filter((m: LiteUser) => !!m.uniqueId);
      setGroupMembers(mm => ({ ...mm, [gid]: mapped }));
      return mapped;
    } finally {
      setGroupLoading(m => ({ ...m, [gid]: false }));
    }
  }

  // снять авто-выбор конкретной группы из selected
  function stripAutoOfGroup(next: Record<string, boolean>, gid: number) {
    const auto = autoRef.current;
    Object.entries(auto).forEach(([uid, g]) => {
      if (g === gid) delete next[uid];
    });
  }

  // deactivate current group (toggle off)
  function deactivateGroup(gid: number) {
    setActiveGroupId(null);
    setSelected(prev => {
      const next = { ...prev };
      stripAutoOfGroup(next, gid);
      if (meUid) next[meUid] = true; // гарантируем «я»
      return next;
    });
    setAutoFromGroup(prev => {
      const cp: Record<string, number | undefined> = {};
      Object.entries(prev).forEach(([uid, g]) => { if (g !== gid) cp[uid] = g; });
      return cp;
    });
  }

  // activate / toggle group
  async function activateGroup(gid: number) {
    if (activeGroupId === gid) { deactivateGroup(gid); return; }

    // убираем авто-добавления предыдущей группы
    if (typeof activeGroupId === 'number') {
      setSelected(prev => {
        const next = { ...prev };
        stripAutoOfGroup(next, activeGroupId);
        if (meUid) next[meUid] = true;
        return next;
      });
      setAutoFromGroup(prev => {
        const cp: Record<string, number | undefined> = {};
        Object.entries(prev).forEach(([uid, g]) => { if (g !== activeGroupId) cp[uid] = g; });
        return cp;
      });
    }

    setActiveGroupId(gid);

    // если есть кэш — сразу применяем; иначе покажем «меня», потом дополним
    if (groupMembers[gid]) {
      const members = groupMembers[gid]!;
      setSelected(prev => {
        const next = { ...prev };
        const added: Record<string, number> = {};
        members.forEach(m => {
          if (!next[m.uniqueId]) { next[m.uniqueId] = true; added[m.uniqueId] = gid; }
        });
        if (meUid) next[meUid] = true;
        setAutoFromGroup(prevAuto => ({ ...prevAuto, ...added }));
        return next;
      });
      return;
    }

    setSelected(prev => {
      const next = { ...prev };
      if (meUid) next[meUid] = true;
      return next;
    });

    const members = await loadGroupMembers(gid);
    setSelected(prev => {
      const next = { ...prev };
      const added: Record<string, number> = {};
      members.forEach(m => {
        if (!next[m.uniqueId]) { next[m.uniqueId] = true; added[m.uniqueId] = gid; }
      });
      if (meUid) next[meUid] = true;
      setAutoFromGroup(prevAuto => ({ ...prevAuto, ...added }));
      return next;
    });
  }

  // candidates = Me + Friends + active group members (if any)
  const unionPeople: LiteUser[] = useMemo(() => {
    const fromGroup = activeGroupId ? (groupMembers[activeGroupId] || []) : [];
    return dedupByUniqueId([...basePeople, ...fromGroup]);
  }, [basePeople, activeGroupId, groupMembers]);

  const filtered = useMemo(() => {
    if (!q) return unionPeople;
    const qq = q.toLowerCase();
    return unionPeople.filter(p =>
      p.username.toLowerCase().includes(qq) || p.uniqueId.toLowerCase().includes(qq)
    );
  }, [unionPeople, q]);

  // manual toggle: если юзера авто-добавила группа — снимаем метку, чтобы он остался при снятии группы
  const toggleUser = (uid: string) => {
    setSelected(s => ({ ...s, [uid]: !s[uid] }));
    setAutoFromGroup(prev => {
      if (prev[uid] !== undefined) {
        const cp = { ...prev };
        delete cp[uid];
        return cp;
      }
      return prev;
    });
  };

  const selectedList = Object.keys(selected).filter(k => selected[k]);
  const canNext = selectedList.length >= 2;

  const fmtUid = (uid: string) => `@${uid.toLowerCase().replace('user#', 'user')}`;
  const goBack = () => router.back();
  const goNext = () => {
    const participants = unionPeople
      .filter(p => selected[p.uniqueId])
      .map(p => ({ uniqueId: p.uniqueId, username: p.username }));
    const qs = new URLSearchParams({
      receiptId: receiptId ?? 'mock-001',
      participants: encodeURIComponent(JSON.stringify(participants)),
    }).toString();
    router.push(`/tabs/sessions/items-split?${qs}` as any);
  };

  // UI: Select pill (84×29)
  const SelectPill = ({ on, onPress }: { on: boolean; onPress: () => void }) => (
    <Button
      unstyled
      onPress={onPress}
      animation="bouncy"
      pressStyle={{ transform: [{ scale: 0.98 }] }}
      width={84}
      height={29}
      borderRadius={10}
      borderWidth={1}
      borderColor="#D9D9D9"
      backgroundColor={on ? '#2ECC71' : 'transparent'}
      ai="center"
      jc="center"
    >
      <Text fontSize={14} fontWeight="500" color={on ? '#FFFFFF' : '#2C3D4FCC'}>
        {on ? 'Selected' : 'Select'}
      </Text>
    </Button>
  );

  // group chip
  const GroupChip = ({
    id, name, count, active, loading, onPress,
  }: { id: number; name: string; count?: number; active?: boolean; loading?: boolean; onPress: () => void }) => (
    <Button
      unstyled
      onPress={onPress}
      animation="bouncy"
      pressStyle={{ transform: [{ scale: 0.98 }] }}
      h={32}
      px={12}
      borderRadius={18}
      borderWidth={1}
      borderColor={active ? '#2ECC71' : '#D9D9D9'}
      backgroundColor={active ? '#2ECC71' : 'transparent'}
      ai="center"
      jc="center"
    >
      <XStack ai="center" gap="$1">
        <UsersIcon size={14} color={active ? '#FFFFFF' : '#2C3D4FCC'} />
        <Text fontSize={14} fontWeight="500" color={active ? '#FFFFFF' : '#2C3D4FCC'}>
          {name}
        </Text>
        <Text fontSize={12} color={active ? '#FFFFFF' : '#2C3D4FCC'}>
          · {typeof count === 'number' ? count : (loading ? '…' : '—')}
        </Text>
        {loading && <Spinner size="small" color={active ? 'white' : '$gray10'} />}
        {active && !loading && <Check size={14} color="#FFFFFF" />}
      </XStack>
    </Button>
  );

  const groupCount = (id: number) =>
    (typeof counts?.[id] === 'number' ? counts![id] : (groupMembers[id]?.length));

  // space for fixed Next
  const bottomPad = (insets?.bottom ?? 0) + 72;

  return (
    <YStack f={1} bg="$background" p="$4" position="relative">
      {/* Back */}
      <XStack ai="center" jc="flex-start" mb="$2">
        <Button size="$2" h={28} chromeless onPress={goBack} icon={<ChevronLeft size={18} />}>Back</Button>
      </XStack>

      {/* Groups */}
      {(groups ?? []).length > 0 && (
        <XStack flexWrap="wrap" gap="$2" mb="$2">
          {(groups ?? []).map((g: any) => (
            <GroupChip
              key={g.id}
              id={g.id}
              name={g.name ?? `Group #${g.id}`}
              count={groupCount(g.id)}
              active={activeGroupId === g.id}
              loading={!!groupLoading[g.id]}
              onPress={() => activateGroup(g.id)}
            />
          ))}
        </XStack>
      )}

      {/* Search */}
      <Input
        placeholder="Search…"
        value={q}
        onChangeText={setQ}
        h={41}
        px={16}
        borderRadius={10}
        bg="$backgroundPress"
        borderWidth={0}
        mb="$3"
      />

      {/* List */}
      <ScrollView
        f={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad }}
      >
        <YStack borderWidth={1} borderColor="$gray5" borderRadius={8} overflow="hidden">
          {(friendsLoading && basePeople.length === 0) && (
            <XStack h={56} ai="center" jc="center"><Spinner /></XStack>
          )}

          {!!friendsError && (
            <XStack h={56} ai="center" jc="center">
              <Text color="$red10">{String(friendsError)}</Text>
            </XStack>
          )}

          {dedupByUniqueId(filtered).map((p, idx) => {
            const on = !!selected[p.uniqueId];
            return (
              <React.Fragment key={p.uniqueId}>
                <XStack h={56} ai="center" jc="space-between" px="$4" bg="$color1">
                  <XStack ai="center" gap="$3">
                    <Circle size={32} backgroundColor="$gray5" />
                    <YStack>
                      <Text fontSize={16} fontWeight="600">{p.username}</Text>
                      <Text fontSize={12} color="$gray10">
                        @{p.uniqueId.toLowerCase().replace('user#', 'user')}
                      </Text>
                    </YStack>
                  </XStack>
                  <SelectPill on={on} onPress={() => toggleUser(p.uniqueId)} />
                </XStack>
                {idx < filtered.length - 1 && <XStack h={1} bg="$gray5" />}
              </React.Fragment>
            );
          })}
        </YStack>
      </ScrollView>

      {/* Fixed Next button */}
      <YStack
        position="absolute"
        left={0}
        right={0}
        bottom={(insets?.bottom ?? 0) + 8}
        ai="center"
        pointerEvents="box-none"
      >
        <Button
          unstyled
          onPress={goNext}
          disabled={!canNext}
          width={358}
          height={41}
          borderRadius={10}
          backgroundColor="#2ECC71"
          ai="center"
          jc="center"
          opacity={canNext ? 1 : 0.5}
        >
          <Text fontSize={16} fontWeight="500" color="#FFFFFF" style={{ lineHeight: 25 }}>
            Next
          </Text>
        </Button>
      </YStack>
    </YStack>
  );
}
