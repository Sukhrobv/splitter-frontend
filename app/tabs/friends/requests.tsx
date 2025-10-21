import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  YStack,
  XStack,
  Paragraph,
  Separator,
  Button,
  Spinner,
  Input,
  Text,
} from 'tamagui';
import { useRouter } from 'expo-router';
import { CircleCheck, CircleX, QrCode, Scan } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';

import { useFriendsStore } from '@/features/friends/model/friends.store';
import UserAvatar from '@/shared/ui/UserAvatar';
import { FriendsApi } from '@/features/friends/api/friends.api';
import { useAppStore } from '@/shared/lib/stores/app-store';

const LIST_W = 358;
const ROW_H = 60;
const TAB_W = 171;
const TAB_H = 37;

const TINT_REJECT = '#E74C3C1A';
const TINT_ACCEPT = '#2ECC711A';

function useAutoNotice() {
  const [text, setText] = useState<string | undefined>();
  const [kind, setKind] = useState<'success' | 'error' | undefined>();

  useEffect(() => {
    if (!text) return;
    const timeout = setTimeout(() => {
      setText(undefined);
      setKind(undefined);
    }, 2200);
    return () => clearTimeout(timeout);
  }, [text]);

  return {
    ok: (message: string) => {
      setKind('success');
      setText(message);
    },
    err: (message: string) => {
      setKind('error');
      setText(message);
    },
    node: text ? (
      <Paragraph col={kind === 'error' ? '$red10' : '$green10'}>{text}</Paragraph>
    ) : null,
  };
}

function IconPill({
  onPress,
  disabled,
  tint,
  children,
}: {
  onPress?: () => void;
  disabled?: boolean;
  tint: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      chromeless
      circular
      w={28}
      h={28}
      p={0}
      bg={tint}
      onPress={onPress}
      disabled={disabled}
      pressStyle={{ opacity: 0.9 }}
    >
      {children}
    </Button>
  );
}

type UserLite = { uniqueId?: string; username?: string; displayName?: string; id?: number };

interface UserRowProps {
  title: string;
  uid?: string;
  right?: React.ReactNode;
  index: number;
  total: number;
  avatarUrl?: string;
}

function UserRow({ title, uid, right, index, total, avatarUrl }: UserRowProps) {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const avatarLabel = (title || 'U').slice(0, 1).toUpperCase() || 'U';

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
      borderTopWidth={isFirst ? 1 : 0}
      borderBottomWidth={isLast ? 1 : 0}
    >
      <XStack ai="center" gap="$3">
        <UserAvatar
          uri={avatarUrl ?? undefined}
          label={avatarLabel}
          size={36}
          textSize={14}
          backgroundColor="$gray5"
        />
        <YStack>
          <Text fontSize={17} fontWeight="600">
            {title}
          </Text>
          {!!uid && (
            <Paragraph fontSize={14} color="$gray10">
              {uid}
            </Paragraph>
          )}
        </YStack>
      </XStack>
      {right}
    </XStack>
  );
}

export default function FriendsRequestsUnified() {
  const router = useRouter();
  const notice = useAutoNotice();
  const { t } = useTranslation();

  const { requestsRaw, fetchAll, loading, error, search, send, friends } = useFriendsStore();
  const meUniqueId = useAppStore((s) => s.user?.uniqueId);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserLite[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [tab, setTab] = useState<'outgoing' | 'incoming'>('incoming');

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const incoming = useMemo(() => requestsRaw?.incoming ?? [], [requestsRaw]);
  const outgoing = useMemo(() => requestsRaw?.outgoing ?? [], [requestsRaw]);

  const friendsSet = useMemo(() => {
    const set = new Set<string>();
    (friends ?? []).forEach((friend: any) => {
      const uid = friend?.user?.uniqueId ?? friend?.uniqueId;
      if (uid) set.add(uid);
    });
    return set;
  }, [friends]);

  const outgoingSet = useMemo(() => {
    const set = new Set<string>();
    (outgoing ?? []).forEach((request: any) => {
      const uid = request?.to?.uniqueId ?? request?.toUniqueId ?? request?.uniqueId;
      if (uid) set.add(uid);
    });
    return set;
  }, [outgoing]);

  const incomingSet = useMemo(() => {
    const set = new Set<string>();
    (incoming ?? []).forEach((request: any) => {
      const uid = request?.from?.uniqueId ?? request?.fromUniqueId ?? request?.uniqueId;
      if (uid) set.add(uid);
    });
    return set;
  }, [incoming]);

  const statusLabels = useMemo(
    () => ({
      add: t('friends.status.add', 'Add'),
      you: t('friends.status.you', 'You'),
      friend: t('friends.status.friend', 'Friend'),
      requested: t('friends.status.requested', 'Requested'),
      incoming: t('friends.status.incoming', 'Incoming'),
    }),
    [t]
  );

  const unknownUser = t('friends.common.unknownUser', 'Unknown user');

  const wrap = useCallback(
    async (fn: () => Promise<any>, id: number, successMessage: string) => {
      setBusyId(id);
      try {
        await fn();
        notice.ok(successMessage);
        await fetchAll();
      } catch (error: any) {
        notice.err(error?.message || t('friends.common.error', 'Something went wrong'));
      } finally {
        setBusyId(null);
      }
    },
    [fetchAll, notice, t]
  );

  const accept = (fromId: number, name?: string, uid?: string) => {
    const target = name ?? uid ?? unknownUser;
    return wrap(
      () => FriendsApi.accept(meUniqueId!, fromId),
      fromId,
      t('friends.requests.accepted', { target })
    );
  };

  const reject = (fromId: number, name?: string, uid?: string) => {
    const target = name ?? uid ?? unknownUser;
    return wrap(
      () => FriendsApi.reject(meUniqueId!, fromId),
      fromId,
      t('friends.requests.rejected', { target })
    );
  };

  async function doSearch() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const response = await search(query.trim());
      setResults(response || []);
      if (!response || response.length === 0) {
        notice.ok(t('friends.search.noResults', 'No results found'));
      }
    } catch (error: any) {
      notice.err(error?.message ?? t('friends.search.error', 'Search failed'));
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function sendInvite(uniqueId?: string, label?: string) {
    if (!uniqueId) return;
    setSendingId(uniqueId);
    try {
      await send(uniqueId);
      const target = label ?? uniqueId ?? unknownUser;
      notice.ok(t('friends.search.inviteSent', { target }));
    } catch (error: any) {
      notice.err(error?.message ?? t('friends.search.inviteFailed', 'Could not send invite'));
    } finally {
      setSendingId(null);
    }
  }

  const onSubmitSearch = () => {
    if (!searching) doSearch();
  };

  const tabLabels = useMemo(
    () => ({
      outgoing: t('friends.requests.tabOutgoing', 'Outgoing'),
      incoming: t('friends.requests.tabIncoming', 'Incoming'),
    }),
    [t]
  );

  return (
    <YStack f={1} p="$4" gap="$4">
      {notice.node}
      {error && <Paragraph col="$red10">{error}</Paragraph>}

      {/* Invite quick actions */}
      <XStack jc="space-between" ai="center" alignSelf="center" w={LIST_W}>
        <Button
          onPress={() =>
            router.push({ pathname: '/tabs/scan-invite', params: { from: 'friends-requests' } } as never)
          }
          size="$3"
          borderRadius="$3"
          theme="active"
          icon={<Scan size={18} />}
        >
          {t('friends.requests.scanInvite', 'Scan invite')}
        </Button>
        <Button
          onPress={() => router.push('/tabs/friends/invite' as never)}
          size="$3"
          borderRadius="$3"
          theme="gray"
          icon={<QrCode size={18} />}
        >
          {t('friends.requests.showMyQr', 'Show my QR')}
        </Button>
      </XStack>

      {/* Search */}
      <XStack ai="center" alignSelf="center">
        <Input
          w={LIST_W}
          value={query}
          onChangeText={setQuery}
          placeholder={t('friends.search.placeholder', 'Enter uniqueId, e.g. USER#1234')}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={onSubmitSearch}
          h={41}
          px={16}
          borderRadius={10}
          fontSize={14}
          fontWeight="500"
          bg="$backgroundPress"
          borderWidth={0}
          color="$gray12"
          placeholderTextColor="$gray10"
        />
      </XStack>

      {/* Search results */}
      {searching ? (
        <Spinner />
      ) : results.length > 0 ? (
        <>
          <Separator />
          {results.map((user, index) => {
            const uid = user.uniqueId;
            const avatarUrl = (user as any)?.avatarUrl ?? (user as any)?.user?.avatarUrl ?? undefined;
            const fallbackTitle = user.displayName || user.username || uid;
            const title = fallbackTitle || unknownUser;

            const isMe = !!uid && !!meUniqueId && uid === meUniqueId;
            const isFriend = !!uid && friendsSet.has(uid);
            const isOutgoing = !!uid && outgoingSet.has(uid);
            const isIncoming = !!uid && incomingSet.has(uid);

            let label = statusLabels.add;
            let disabled = false;
            if (isMe) {
              label = statusLabels.you;
              disabled = true;
            } else if (isFriend) {
              label = statusLabels.friend;
              disabled = true;
            } else if (isOutgoing) {
              label = statusLabels.requested;
              disabled = true;
            } else if (isIncoming) {
              label = statusLabels.incoming;
              disabled = true;
            }

            const isBusy = sendingId === uid;

            return (
              <UserRow
                key={`${uid ?? 'u'}-${index}`}
                index={index}
                total={results.length}
                title={title}
                uid={uid}
                avatarUrl={avatarUrl}
                right={
                  <Button
                    size="$2"
                    borderRadius={10}
                    borderWidth={1}
                    h={37}
                    px={10}
                    gap={10}
                    w={TAB_W}
                    onPress={() => sendInvite(uid, title)}
                    disabled={!uid || disabled || isBusy}
                  >
                    {isBusy ? '...' : label}
                  </Button>
                }
              />
            );
          })}
        </>
      ) : (
        <Paragraph col="$gray10">{t('friends.search.hint', 'Search by uniqueId to find someone')}</Paragraph>
      )}

      {/* Tabs */}
      <Separator />
      <XStack gap={10} ai="center" jc="center" alignSelf="center">
        <Button
          w={TAB_W}
          h={TAB_H}
          gap={10}
          onPress={() => setTab('outgoing')}
          variant="outlined"
          borderColor={tab === 'outgoing' ? '$green8' : '$gray6'}
          bg={tab === 'outgoing' ? '$green3' : '$color1'}
          color="$gray12"
          borderRadius={10}
          borderWidth={1}
          p="$2"
        >
          {tabLabels.outgoing}
        </Button>
        <Button
          w={TAB_W}
          h={TAB_H}
          gap={10}
          onPress={() => setTab('incoming')}
          variant="outlined"
          borderColor={tab === 'incoming' ? '$green8' : '$gray6'}
          bg={tab === 'incoming' ? '$green3' : '$color1'}
          color="$gray12"
          borderRadius={10}
          borderWidth={1}
          p="$2"
        >
          {tabLabels.incoming}
        </Button>
      </XStack>

      {/* Lists */}
      {tab === 'incoming' ? (
        <>
          <Separator />
          {incoming.length === 0 ? (
            <Paragraph col="$gray10">{t('friends.requests.emptyIncoming', 'No incoming requests')}</Paragraph>
          ) : (
            incoming.map((request: any, index: number) => {
              const name =
                request.from?.displayName ||
                request.from?.username ||
                (request.from?.id ? `User #${request.from.id}` : undefined) ||
                unknownUser;
              const uid = request.from?.uniqueId;
              const fromId = request.from?.id as number;
              const avatarUrl = request.from?.avatarUrl ?? null;
              const isBusy = busyId === fromId;

              return (
                <UserRow
                  key={`in-${fromId}-${index}`}
                  index={index}
                  total={incoming.length}
                  title={name}
                  uid={uid}
                  avatarUrl={avatarUrl ?? undefined}
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
            <Paragraph col="$gray10">{t('friends.requests.emptyOutgoing', 'No outgoing requests')}</Paragraph>
          ) : (
            outgoing.map((request: any, index: number) => {
              const name =
                request.to?.displayName ||
                request.to?.username ||
                request.to?.uniqueId ||
                unknownUser;
              const uid = request.to?.uniqueId;
              const avatarUrl = request.to?.avatarUrl ?? null;

              return (
                <UserRow
                  key={`out-${uid ?? index}`}
                  index={index}
                  total={outgoing.length}
                  title={name}
                  uid={uid}
                  avatarUrl={avatarUrl ?? undefined}
                  right={
                    <Paragraph size="$2" col="$gray10">
                      {t('friends.requests.requestedLabel', 'Requested')}
                    </Paragraph>
                  }
                />
              );
            })
          )}
        </>
      )}
    </YStack>
  );
}
