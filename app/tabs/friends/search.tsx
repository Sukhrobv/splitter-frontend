import { useMemo, useState, useEffect } from 'react';
import {
  YStack,
  XStack,
  Input,
  Button,
  Paragraph,
  ListItem,
  Separator,
  Spinner,
} from 'tamagui';
import { useTranslation } from 'react-i18next';

import { useFriendsStore } from '@/features/friends/model/friends.store';
import { useAppStore } from '@/shared/lib/stores/app-store';

function useAutoNotice() {
  const [text, setText] = useState<string | undefined>();
  const [kind, setKind] = useState<'success' | 'error' | undefined>();

  useEffect(() => {
    if (!text) return;
    const timeout = setTimeout(() => {
      setText(undefined);
      setKind(undefined);
    }, 2500);
    return () => clearTimeout(timeout);
  }, [text]);

  return {
    showSuccess: (message: string) => {
      setKind('success');
      setText(message);
    },
    showError: (message: string) => {
      setKind('error');
      setText(message);
    },
    node: text ? (
      <Paragraph col={kind === 'error' ? '$red10' : '$green10'}>{text}</Paragraph>
    ) : null,
  };
}

type UserLite = { uniqueId?: string; username?: string; displayName?: string; id?: number };

export default function FriendsSearchScreen() {
  const { search, send, requestsRaw, friends } = useFriendsStore();
  const meUniqueId = useAppStore((s) => s.user?.uniqueId);
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentLocal, setSentLocal] = useState<Set<string>>(new Set());
  const notice = useAutoNotice();

  const outgoingSet = useMemo(() => {
    const set = new Set<string>();
    (requestsRaw?.outgoing ?? []).forEach((request: any) => {
      const uid = request?.to?.uniqueId ?? request?.toUniqueId ?? request?.uniqueId;
      if (uid) set.add(uid);
    });
    return set;
  }, [requestsRaw?.outgoing]);

  const incomingSet = useMemo(() => {
    const set = new Set<string>();
    (requestsRaw?.incoming ?? []).forEach((request: any) => {
      const uid = request?.from?.uniqueId ?? request?.fromUniqueId ?? request?.uniqueId;
      if (uid) set.add(uid);
    });
    return set;
  }, [requestsRaw?.incoming]);

  const friendsSet = useMemo(() => {
    const set = new Set<string>();
    (friends ?? []).forEach((friend: any) => {
      const uid = friend?.user?.uniqueId ?? friend?.uniqueId;
      if (uid) set.add(uid);
    });
    return set;
  }, [friends]);

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await search(query.trim());
      setResults(response || []);
      if (!response || response.length === 0) {
        notice.showSuccess(t('friends.search.noResults', 'No results found'));
      }
    } catch (error: any) {
      notice.showError(error?.message ?? t('friends.search.error', 'Search failed'));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function sendInvite(uniqueId?: string, label?: string) {
    if (!uniqueId) return;
    setSendingId(uniqueId);
    try {
      await send(uniqueId);
      setSentLocal((prev) => new Set(prev).add(uniqueId));
      const target = label ?? uniqueId ?? t('friends.common.unknownUser', 'Unknown user');
      notice.showSuccess(t('friends.search.inviteSent', { target }));
    } catch (error: any) {
      notice.showError(error?.message ?? t('friends.search.inviteFailed', 'Could not send invite'));
    } finally {
      setSendingId(null);
    }
  }

  const onSubmit = () => {
    if (!loading) doSearch();
  };

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

  return (
    <YStack f={1} p="$4" gap="$3">
      <XStack gap="$2" ai="center">
        <Input
          f={1}
          value={query}
          onChangeText={setQuery}
          placeholder={t('friends.search.placeholder', 'Enter uniqueId, e.g. USER#1234')}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
        />
        <Button onPress={doSearch} disabled={!query || loading}>
          {loading ? <Spinner size="small" /> : t('friends.search.button', 'Search')}
        </Button>
      </XStack>

      {notice.node}
      <Separator />

      {loading ? (
        <YStack gap="$2">
          <Spinner />
        </YStack>
      ) : results.length === 0 ? (
        <Paragraph col="$gray10">{t('friends.search.hint', 'Search by uniqueId to find someone')}</Paragraph>
      ) : (
        results.map((user, index) => {
          const uid = user.uniqueId;
          const fallbackTitle = user.displayName || user.username || uid;
          const title = fallbackTitle ?? t('friends.common.unknownUser', 'Unknown user');

          const isMe = !!uid && !!meUniqueId && uid === meUniqueId;
          const isFriend = !!uid && friendsSet.has(uid);
          const isOutgoing = !!uid && (outgoingSet.has(uid) || sentLocal.has(uid));
          const isIncoming = !!uid && incomingSet.has(uid);

          let actionLabel = statusLabels.add;
          let disabled = false;

          if (isMe) {
            actionLabel = statusLabels.you;
            disabled = true;
          } else if (isFriend) {
            actionLabel = statusLabels.friend;
            disabled = true;
          } else if (isOutgoing) {
            actionLabel = statusLabels.requested;
            disabled = true;
          } else if (isIncoming) {
            actionLabel = statusLabels.incoming;
            disabled = true;
          }

          const isBusy = sendingId === uid;

          return (
            <ListItem
              key={`${uid ?? 'u'}-${index}`}
              title={title}
              subTitle={uid}
              hoverTheme
              pressTheme={false}
              iconAfter={
                <Button
                  size="$2"
                  onPress={() => sendInvite(uid, title)}
                  disabled={!uid || disabled || isBusy}
                >
                  {isBusy ? '...' : actionLabel}
                </Button>
              }
            />
          );
        })
      )}
    </YStack>
  );
}
