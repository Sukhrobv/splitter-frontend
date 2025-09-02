import { useMemo, useState, useEffect } from 'react';
import {
  YStack, XStack, Input, Button, Paragraph, ListItem, Separator, Spinner
} from 'tamagui';
import { useFriendsStore } from '@/features/friends/model/friends.store';
import { useAppStore } from '@/shared/lib/stores/app-store';

function useAutoNotice() {
  const [text, setText] = useState<string | undefined>();
  const [kind, setKind] = useState<'success' | 'error' | undefined>();
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => { setText(undefined); setKind(undefined); }, 2500);
    return () => clearTimeout(t);
  }, [text]);
  return {
    showSuccess: (t: string) => { setKind('success'); setText(t); },
    showError:   (t: string) => { setKind('error');   setText(t); },
    node: text ? (
      <Paragraph col={kind === 'error' ? '$red10' : '$green10'}>{text}</Paragraph>
    ) : null,
  };
}

type UserLite = { uniqueId?: string; username?: string; displayName?: string; id?: number };

export default function FriendsSearchScreen() {
  const { search, send, requestsRaw, friends } = useFriendsStore();
  const meUniqueId = useAppStore(s => s.user?.uniqueId);

  const [q, setQ] = useState('');
  const [res, setRes] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentLocal, setSentLocal] = useState<Set<string>>(new Set());
  const notice = useAutoNotice();

  const outgoingSet = useMemo(() => {
    const s = new Set<string>();
    (requestsRaw?.outgoing ?? []).forEach((r: any) => {
      const uid = r?.to?.uniqueId ?? r?.toUniqueId ?? r?.uniqueId;
      if (uid) s.add(uid);
    });
    return s;
  }, [requestsRaw?.outgoing]);

  const incomingSet = useMemo(() => {
    const s = new Set<string>();
    (requestsRaw?.incoming ?? []).forEach((r: any) => {
      const uid = r?.from?.uniqueId ?? r?.fromUniqueId ?? r?.uniqueId;
      if (uid) s.add(uid);
    });
    return s;
  }, [requestsRaw?.incoming]);

  const friendsSet = useMemo(() => {
    const s = new Set<string>();
    (friends ?? []).forEach((f: any) => {
      const uid = f?.user?.uniqueId ?? f?.uniqueId;
      if (uid) s.add(uid);
    });
    return s;
  }, [friends]);

  async function doSearch() {
    if (!q) return;
    setLoading(true);
    try {
      const r = await search(q.trim());
      setRes(r || []);
      if (!r || r.length === 0) notice.showSuccess('No results found');
    } catch (e: any) {
      notice.showError(e?.message ?? 'Search failed');
      setRes([]);
    } finally {
      setLoading(false);
    }
  }

  async function sendInvite(uniqueId?: string, label?: string) {
    if (!uniqueId) return;
    setSendingId(uniqueId);
    try {
      await send(uniqueId);
      setSentLocal(prev => new Set(prev).add(uniqueId));
      notice.showSuccess(`Invite sent to ${label ?? uniqueId}`);
    } catch (e: any) {
      notice.showError(e?.message ?? 'Could not send invite');
    } finally {
      setSendingId(null);
    }
  }

  const onSubmit = () => { if (q && !loading) doSearch(); };

  return (
    <YStack f={1} p="$4" gap="$3">
      <XStack gap="$2" ai="center">
        <Input
          f={1}
          value={q}
          onChangeText={setQ}
          placeholder="Enter uniqueId, e.g. USER#1234"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
        />
        <Button onPress={doSearch} disabled={!q || loading}>
          {loading ? <Spinner size="small" /> : 'Search'}
        </Button>
      </XStack>

      {notice.node}
      <Separator />

      {loading ? (
        <YStack gap="$2"><Spinner /></YStack>
      ) : res.length === 0 ? (
        <Paragraph col="$gray10">Search by uniqueId to find someone</Paragraph>
      ) : (
        res.map((u, i) => {
          const uid = u.uniqueId;
          const title = u.displayName || u.username || uid || '—';

          const isMe = !!uid && !!meUniqueId && uid === meUniqueId;
          const isFriend = !!uid && friendsSet.has(uid);
          const isOutgoing = !!uid && (outgoingSet.has(uid) || sentLocal.has(uid));
          const isIncoming = !!uid && incomingSet.has(uid);

          let actionLabel = 'Add';
          let disabled = false;

          if (isMe)         { actionLabel = 'You';      disabled = true; }
          else if (isFriend){ actionLabel = 'Friend';   disabled = true; }
          else if (isOutgoing){ actionLabel = 'Requested'; disabled = true; }
          else if (isIncoming){ actionLabel = 'Incoming';  disabled = true; }

          const isBusy = sendingId === uid;

          return (
            <ListItem
              key={`${uid ?? 'u'}-${i}`}
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
