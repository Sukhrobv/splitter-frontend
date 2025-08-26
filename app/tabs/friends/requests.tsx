import { useEffect, useMemo, useState } from 'react';
import { YStack, XStack, Paragraph, Separator, Button, Spinner } from 'tamagui';
import { useFriendsStore } from '@/features/friends/model/friends.store';
import { FriendsApi } from '@/features/friends/api/friends.api';
import { useAppStore } from '@/shared/lib/stores/app-store';

export default function RequestsScreen() {
  const { requestsRaw, fetchAll, loading, error } = useFriendsStore();
  const meUniqueId = useAppStore((s) => s.user?.uniqueId);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | undefined>();

  useEffect(() => { fetchAll(); }, []);

  const incoming = useMemo(() => requestsRaw?.incoming ?? [], [requestsRaw]);
  const outgoing = useMemo(() => requestsRaw?.outgoing ?? [], [requestsRaw]);

  async function accept(requesterId: number) {
    if (!meUniqueId) return;
    setBusyId(requesterId); setMsg(undefined);
    try {
      await FriendsApi.accept(meUniqueId, requesterId);
      setMsg('Accepted');
      await fetchAll();
    } catch (e: any) {
      setMsg(e?.message || 'Error');
    } finally {
      setBusyId(null);
    }
  }

  async function reject(requesterId: number) {
    if (!meUniqueId) return;
    setBusyId(requesterId); setMsg(undefined);
    try {
      await FriendsApi.reject(meUniqueId, requesterId);
      setMsg('Rejected');
      await fetchAll();
    } catch (e: any) {
      setMsg(e?.message || 'Error');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Spinner />;

  return (
    <YStack f={1} p="$4" gap="$4">
      {msg && <Paragraph>{msg}</Paragraph>}
      {error && <Paragraph col="$red10">{error}</Paragraph>}

      <Paragraph fow="700" fos="$7">Incoming</Paragraph>
      <Separator />

      {incoming.length === 0 ? (
        <Paragraph col="$gray10">Нет данных (incoming)</Paragraph>
      ) : (
        incoming.map((r: any) => (
          <XStack
            key={r.id}
            ai="center"
            jc="space-between"
            p="$3"
            br="$4"
            bc="$backgroundFocus"
            gap="$3"
          >
            <YStack>
              <Paragraph fow="600">
                {r.from?.username || r.from?.uniqueId || `User #${r.from?.id}`}
              </Paragraph>
              {!!r.from?.uniqueId && (
                <Paragraph size="$2" col="$gray10">{r.from.uniqueId}</Paragraph>
              )}
            </YStack>
            <XStack gap="$2">
              <Button
                size="$2"
                onPress={() => accept(r.from.id)}
                disabled={busyId === r.from.id}
              >
                {busyId === r.from.id ? '...' : 'Accept'}
              </Button>
              <Button
                size="$2"
                theme="red"
                onPress={() => reject(r.from.id)}
                disabled={busyId === r.from.id}
              >
                {busyId === r.from.id ? '...' : 'Reject'}
              </Button>
            </XStack>
          </XStack>
        ))
      )}

      <Paragraph fow="700" fos="$7" mt="$6">Outgoing</Paragraph>
      <Separator />

      {outgoing.length === 0 ? (
        <Paragraph col="$gray10">Нет данных (outgoing)</Paragraph>
      ) : (
        outgoing.map((r: any, i: number) => (
          <Paragraph key={i} size="$2">
            {JSON.stringify(r)}
          </Paragraph>
        ))
      )}
    </YStack>
  );
}
