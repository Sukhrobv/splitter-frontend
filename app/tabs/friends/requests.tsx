// app/tabs/friends/requests.tsx

import { useEffect, useMemo, useState, useCallback } from 'react';
import { YStack, XStack, Paragraph, Separator, Button, Spinner, Card } from 'tamagui';
import { useFriendsStore } from '@/features/friends/model/friends.store';
import { FriendsApi } from '@/features/friends/api/friends.api';
import { useAppStore } from '@/shared/lib/stores/app-store';
import { useRouter } from 'expo-router';
import { ArrowLeft } from '@tamagui/lucide-icons';

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

export default function RequestsScreen() {
  const { requestsRaw, fetchAll, loading, error } = useFriendsStore();
  const meUniqueId = useAppStore((s) => s.user?.uniqueId);
  const [busyId, setBusyId] = useState<number | null>(null);
  const notice = useAutoNotice();
  const router = useRouter();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const incoming = useMemo(() => requestsRaw?.incoming ?? [], [requestsRaw]);
  const outgoing = useMemo(() => requestsRaw?.outgoing ?? [], [requestsRaw]);

  const wrap = useCallback(
    async (fn: () => Promise<any>, id: number, okMsg: string) => {
      setBusyId(id);
      try {
        await fn();
        notice.showSuccess(okMsg);
        await fetchAll(); // keeps bell badge fresh
      } catch (e: any) {
        notice.showError(e?.message || 'Something went wrong');
      } finally {
        setBusyId(null);
      }
    },
    [fetchAll, notice]
  );

  const accept = (fromId: number, name?: string, uid?: string) =>
    wrap(
      () => FriendsApi.accept(meUniqueId!, fromId),
      fromId,
      `Accepted ${name ?? ''}${name && uid ? ' ' : ''}${uid ? `(${uid})` : ''}`.trim()
    );

  const reject = (fromId: number, name?: string, uid?: string) =>
    wrap(
      () => FriendsApi.reject(meUniqueId!, fromId),
      fromId,
      `Rejected ${name ?? ''}${name && uid ? ' ' : ''}${uid ? `(${uid})` : ''}`.trim()
    );

  if (loading) return <Spinner />;

  return (
    <YStack f={1} p="$4" gap="$4">
      {/* Top back button */}
      <XStack>
        <Button
          size="$2"
          icon={<ArrowLeft size={16} />}
          onPress={() => router.replace('/tabs/friends')}
        >
          Back to Friends
        </Button>
      </XStack>

      {notice.node}
      {error && <Paragraph col="$red10">{error}</Paragraph>}

      {/* INCOMING */}
      <Paragraph fow="700" fos="$7">Incoming</Paragraph>
      <Separator />

      {incoming.length === 0 ? (
        <Paragraph col="$gray10">No incoming requests</Paragraph>
      ) : (
        incoming.map((r: any) => {
          const name = r.from?.username || `User #${r.from?.id}`;
          const uid  = r.from?.uniqueId;
          const fromId = r.from?.id as number;
          const isBusy = busyId === fromId;

          return (
            <Card key={fromId} p="$3" br="$4" bc="$backgroundFocus">
              <XStack ai="center" jc="space-between" gap="$3">
                <YStack>
                  <Paragraph fow="600">{name}</Paragraph>
                  {!!uid && <Paragraph size="$2" col="$gray10">{uid}</Paragraph>}
                </YStack>
                <XStack gap="$2">
                  <Button
                    size="$2"
                    onPress={() => accept(fromId, r.from?.username, uid)}
                    disabled={isBusy}
                  >
                    {isBusy ? '...' : 'Accept'}
                  </Button>
                  <Button
                    size="$2"
                    theme="red"
                    onPress={() => reject(fromId, r.from?.username, uid)}
                    disabled={isBusy}
                  >
                    {isBusy ? '...' : 'Reject'}
                  </Button>
                </XStack>
              </XStack>
            </Card>
          );
        })
      )}

      {/* OUTGOING */}
      <Paragraph fow="700" fos="$7" mt="$6">Outgoing</Paragraph>
      <Separator />

      {outgoing.length === 0 ? (
        <Paragraph col="$gray10">No outgoing requests</Paragraph>
      ) : (
        outgoing.map((r: any, idx: number) => (
          <Card key={idx} p="$3" br="$4" bc="$backgroundFocus">
            <YStack>
              <Paragraph fow="600">{r.to?.username || r.to?.uniqueId}</Paragraph>
              {!!r.to?.uniqueId && <Paragraph size="$2" col="$gray10">{r.to.uniqueId}</Paragraph>}
            </YStack>
          </Card>
        ))
      )}
    </YStack>
  );
}
