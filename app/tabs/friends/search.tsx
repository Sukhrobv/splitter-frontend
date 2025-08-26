import { useState } from 'react';
import { YStack, XStack, Input, Button, Paragraph, ListItem, Separator } from 'tamagui';
import { useFriendsStore } from '@/features/friends/model/friends.store';

export default function FriendsSearchScreen() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | undefined>();
  const { search, send } = useFriendsStore();

  async function doSearch() {
    setMsg(undefined); setLoading(true);
    try { setRes(await search(q)); }
    catch (e: any) { setMsg(e?.message ?? 'Ошибка поиска'); }
    finally { setLoading(false); }
  }

  async function sendInvite(uniqueId: string) {
    setMsg(undefined); setLoading(true);
    try { await send(uniqueId); setMsg('Invite sent'); }
    catch (e: any) { setMsg(e?.message ?? 'Не удалось отправить запрос'); }
    finally { setLoading(false); }
  }

  return (
    <YStack f={1} p="$4" gap="$3">
      <XStack gap="$2">
        <Input
          f={1}
          value={q}
          onChangeText={setQ}
          placeholder="Enter uniqueId, e.g. USER#1234"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button onPress={doSearch} disabled={!q || loading}>
          Search
        </Button>
      </XStack>

      {msg && <Paragraph>{msg}</Paragraph>}
      <Separator />

      {res.map((u, i) => (
        <ListItem
          key={i}
          title={u.displayName || u.username || u.uniqueId || '—'}
          subTitle={u.uniqueId}
          onPress={() => u.uniqueId && sendInvite(u.uniqueId)}
        />
      ))}
    </YStack>
  );
}
