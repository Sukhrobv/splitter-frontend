// app/tabs/friends/requests.tsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  YStack, XStack, Paragraph, Separator, Button, Spinner, Input, Circle, Text
} from 'tamagui';
import { useRouter } from 'expo-router';
import { ChevronLeft, CircleCheck, CircleX } from '@tamagui/lucide-icons';

import { useFriendsStore } from '@/features/friends/model/friends.store';
import { FriendsApi } from '@/features/friends/api/friends.api';
import { useAppStore } from '@/shared/lib/stores/app-store';

const LIST_W = 358;
const ROW_H  = 60;
const TAB_W  = 171;
const TAB_H  = 37;

const TINT_REJECT = '#E74C3C1A';
const TINT_ACCEPT = '#2ECC711A';

function useAutoNotice() {
  const [text, setText] = useState<string | undefined>();
  const [kind, setKind] = useState<'success' | 'error' | undefined>();
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => { setText(undefined); setKind(undefined); }, 2200);
    return () => clearTimeout(t);
  }, [text]);
  return {
    ok:  (t: string) => { setKind('success'); setText(t); },
    err: (t: string) => { setKind('error');   setText(t); },
    node: text ? <Paragraph col={kind === 'error' ? '$red10' : '$green10'}>{text}</Paragraph> : null,
  };
}

function IconPill({
  onPress, disabled, tint, children,
}: { onPress?: () => void; disabled?: boolean; tint: string; children: React.ReactNode }) {
  return (
    <Button
      chromeless circular w={28} h={28} p={0}
      bg={tint} onPress={onPress} disabled={disabled}
      pressStyle={{ opacity: 0.9 }}
    >
      {children}
    </Button>
  );
}

type UserLite = { uniqueId?: string; username?: string; displayName?: string; id?: number };

export default function FriendsRequestsUnified() {
  const router = useRouter();
  const notice = useAutoNotice();

  const { requestsRaw, fetchAll, loading, error, search, send, friends } = useFriendsStore();
  const meUniqueId = useAppStore(s => s.user?.uniqueId);

  const [q, setQ] = useState('');
  const [res, setRes] = useState<UserLite[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [tab, setTab] = useState<'outgoing' | 'incoming'>('incoming');

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const incoming = useMemo(() => requestsRaw?.incoming ?? [], [requestsRaw]);
  const outgoing = useMemo(() => requestsRaw?.outgoing ?? [], [requestsRaw]);

  const friendsSet = useMemo(() => {
    const s = new Set<string>();
    (friends ?? []).forEach((f: any) => {
      const uid = f?.user?.uniqueId ?? f?.uniqueId;
      if (uid) s.add(uid);
    });
    return s;
  }, [friends]);

  const outgoingSet = useMemo(() => {
    const s = new Set<string>();
    (outgoing ?? []).forEach((r: any) => {
      const uid = r?.to?.uniqueId ?? r?.toUniqueId ?? r?.uniqueId;
      if (uid) s.add(uid);
    });
    return s;
  }, [outgoing]);

  const incomingSet = useMemo(() => {
    const s = new Set<string>();
    (incoming ?? []).forEach((r: any) => {
      const uid = r?.from?.uniqueId ?? r?.fromUniqueId ?? r?.uniqueId;
      if (uid) s.add(uid);
    });
    return s;
  }, [incoming]);

  const wrap = useCallback(
    async (fn: () => Promise<any>, id: number, okMsg: string) => {
      setBusyId(id);
      try {
        await fn();
        notice.ok(okMsg);
        await fetchAll();
      } catch (e: any) {
        notice.err(e?.message || 'Something went wrong');
      } finally {
        setBusyId(null);
      }
    },
    [fetchAll, notice]
  );

  const accept = (fromId: number, name?: string, uid?: string) =>
    wrap(() => FriendsApi.accept(meUniqueId!, fromId), fromId,
      `Accepted ${name ?? ''}${name && uid ? ' ' : ''}${uid ? `(${uid})` : ''}`.trim());

  const reject = (fromId: number, name?: string, uid?: string) =>
    wrap(() => FriendsApi.reject(meUniqueId!, fromId), fromId,
      `Rejected ${name ?? ''}${name && uid ? ' ' : ''}${uid ? `(${uid})` : ''}`.trim());

  async function doSearch() {
    if (!q) return;
    setSearching(true);
    try {
      const r = await search(q.trim());
      setRes(r || []);
      if (!r || r.length === 0) notice.ok('No results found');
    } catch (e: any) {
      notice.err(e?.message ?? 'Search failed');
      setRes([]);
    } finally {
      setSearching(false);
    }
  }

  async function sendInvite(uniqueId?: string, label?: string) {
    if (!uniqueId) return;
    setSendingId(uniqueId);
    try {
      await send(uniqueId);
      notice.ok(`Invite sent to ${label ?? uniqueId}`);
      await fetchAll();
    } catch (e: any) {
      notice.err(e?.message ?? 'Could not send invite');
    } finally {
      setSendingId(null);
    }
  }

  const fmtUid = (uid?: string) => (uid ? `@${uid.toLowerCase().replace('user#', 'user')}` : '');

  // слитная строка списка: боковые бордеры всегда, верхний как разделитель, нижний только у последнего
  function UserRow({
    title, uid, right, index, total,
  }: { title: string; uid?: string; right?: React.ReactNode; index: number; total: number }) {
    const isFirst = index === 0;
    const isLast  = index === total - 1;
    return (
      <XStack
        w={LIST_W}
        h={ROW_H}
        ai="center"
        jc="space-between"
        px={16}
        alignSelf="center"
        bg="$color1"
        borderColor="$gray5"
        borderLeftWidth={1}
        borderRightWidth={1}
        borderTopWidth={1}               // разделитель сверху
        borderBottomWidth={isLast ? 1 : 0}
        borderTopLeftRadius={isFirst ? 8 : 0}
        borderTopRightRadius={isFirst ? 8 : 0}
        borderBottomLeftRadius={isLast ? 8 : 0}
        borderBottomRightRadius={isLast ? 8 : 0}
      >
        <XStack ai="center" gap="$3">
          <Circle size={36} backgroundColor="$gray5" />
          <YStack>
            <Text fontSize={17} fontWeight="600">{title}</Text>
            {!!uid && <Paragraph fontSize={14} color="$gray10">{fmtUid(uid)}</Paragraph>}
          </YStack>
        </XStack>
        <XStack ai="center" gap="$2">{right}</XStack>
      </XStack>
    );
  }

  if (loading && !requestsRaw) return <Spinner />;

  return (
    <YStack f={1} ai="center" bg="$color1">
      <YStack w={LIST_W} gap="$3" p="$4">
        {/* Back */}
        <XStack>
          <Button
            size="$2" h={22} px={0}
            unstyled chromeless bg="transparent" borderWidth={0}
            color="$gray12" pressStyle={{ opacity: 0.6 }}
            icon={<ChevronLeft size={18} color="$gray12" />}
            onPress={() => router.replace('/tabs/friends')}
          >
            Back to Friends
          </Button>
        </XStack>

        {notice.node}
        {error && <Paragraph col="$red10">{error}</Paragraph>}

        {/* SEARCH */}
        <XStack ai="center" alignSelf="center">
          <Input
            w={LIST_W}
            value={q}
            onChangeText={setQ}
            placeholder="Enter uniqueId, e.g. USER#1234"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={doSearch}
            h={41} px={16} borderRadius={10}
            fontSize={14} fontWeight="500"
            bg="$backgroundPress" borderWidth={0}
            color="$gray12" placeholderTextColor="$gray10"
          />
        </XStack>

        {/* SEARCH RESULTS (слитный список) */}
        {res.length > 0 && (
          <>
            <Separator />
            {res.map((u, i) => {
              const uid = u.uniqueId;
              const title = u.displayName || u.username || uid || '—';
              const isMe = !!uid && !!meUniqueId && uid === meUniqueId;
              const isFriend = !!uid && friendsSet.has(uid);
              const isOutgoing = !!uid && outgoingSet.has(uid);
              const isIncoming = !!uid && incomingSet.has(uid);

              let label = 'Add';
              let disabled = false;
              if (isMe) { label = 'You'; disabled = true; }
              else if (isFriend) { label = 'Friend'; disabled = true; }
              else if (isOutgoing) { label = 'Requested'; disabled = true; }
              else if (isIncoming) { label = 'Incoming'; disabled = true; }

              const isBusy = sendingId === uid;

              return (
                <UserRow
                  key={`${uid ?? 'u'}-${i}`}
                  index={i} total={res.length}
                  title={title!} uid={uid}
                  right={
                    <Button
                      size="$2" borderRadius={10} borderWidth={1}
                      h={37} px={10} gap={10} w={171}
                      onPress={() => sendInvite(uid, title!)}
                      disabled={!uid || disabled || isBusy}
                    >
                      {isBusy ? '...' : label}
                    </Button>
                  }
                />
              );
            })}
          </>
        )}

        {/* TABS */}
        <Separator />
        <XStack gap={10} ai="center" jc="center" alignSelf="center">
          <Button
            w={TAB_W} h={TAB_H} gap={10}
            onPress={() => setTab('outgoing')}
            variant="outlined"
            borderColor={tab === 'outgoing' ? '$green8' : '$gray6'}
            bg={tab === 'outgoing' ? '$green3' : '$color1'}
            color="$gray12"
            borderRadius={10} borderWidth={1}
            p="$2"
          >
            Outgoing
          </Button>
          <Button
            w={TAB_W} h={TAB_H} gap={10}
            onPress={() => setTab('incoming')}
            variant="outlined"
            borderColor={tab === 'incoming' ? '$green8' : '$gray6'}
            bg={tab === 'incoming' ? '$green3' : '$color1'}
            color="$gray12"
            borderRadius={10} borderWidth={1}
            p="$2"
          >
            Incoming
          </Button>
        </XStack>

        {/* LISTS — слитные */}
        {tab === 'incoming' ? (
          <>
            <Separator />
            {incoming.length === 0 ? (
              <Paragraph col="$gray10">No incoming requests</Paragraph>
            ) : (
              incoming.map((r: any, idx: number) => {
                const name = r.from?.displayName || r.from?.username || `User #${r.from?.id}`;
                const uid  = r.from?.uniqueId;
                const fromId = r.from?.id as number;
                const isBusy = busyId === fromId;

                return (
                  <UserRow
                    key={`in-${fromId}-${idx}`}
                    index={idx} total={incoming.length}
                    title={name} uid={uid}
                    right={
                      <XStack gap={10}>
                        <IconPill
                          tint={TINT_REJECT}
                          onPress={() => reject(fromId, name, uid)}
                          disabled={isBusy}
                        >
                          <CircleX size={16} color="#E74C3C" />
                        </IconPill>
                        <IconPill
                          tint={TINT_ACCEPT}
                          onPress={() => accept(fromId, name, uid)}
                          disabled={isBusy}
                        >
                          <CircleCheck size={16} color="#2ECC71" />
                        </IconPill>
                      </XStack>
                    }
                  />
                );
              })
            )}
          </>
        ) : (
          <>
            <Separator />
            {outgoing.length === 0 ? (
              <Paragraph col="$gray10">No outgoing requests</Paragraph>
            ) : (
              outgoing.map((r: any, idx: number) => {
                const name = r.to?.displayName || r.to?.username || r.to?.uniqueId || '—';
                const uid  = r.to?.uniqueId;

                return (
                  <UserRow
                    key={`out-${uid ?? idx}`}
                    index={idx} total={outgoing.length}
                    title={name} uid={uid}
                    right={<Paragraph size="$2" col="$gray10">Requested</Paragraph>}
                  />
                );
              })
            )}
          </>
        )}
      </YStack>
    </YStack>
  );
}
