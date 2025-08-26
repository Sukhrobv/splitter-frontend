import { useEffect } from 'react';
import { YStack, Paragraph, Separator } from 'tamagui';
import { useFriendsStore } from '../model/friends.store';

type Props = { type: 'incoming' | 'outgoing' };

export function RequestList({ type }: Props) {
  const { requestsRaw, fetchAll, loading, error } = useFriendsStore();

  useEffect(() => { fetchAll(); }, []);

  if (loading) return <Paragraph>Loading…</Paragraph>;
  if (error) return <Paragraph col="$red10">{error}</Paragraph>;

  const arr = type === 'incoming' ? requestsRaw?.incoming : requestsRaw?.outgoing;

  return (
    <YStack gap="$2">
      {!arr || arr.length === 0 ? (
        <>
          <Paragraph col="$gray10">Нет данных ({type})</Paragraph>
          <Separator />
          <Paragraph size="$2">{JSON.stringify(requestsRaw ?? {}, null, 2)}</Paragraph>
        </>
      ) : (
        arr.map((it: any, i: number) => (
          <Paragraph key={i} size="$2">
            {JSON.stringify(it)}
          </Paragraph>
        ))
      )}
    </YStack>
  );
}
