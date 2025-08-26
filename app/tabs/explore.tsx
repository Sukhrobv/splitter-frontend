import { YStack, Paragraph, Spinner, Button, XStack } from 'tamagui';
import { useEffect } from 'react';
import { useFriendsStore } from '@/features/friends/model/friends.store';
import { FriendListItem } from '@/features/friends/ui/FriendListItem';

export default function ExploreScreen() {
  const { friends, loading, fetchAll, remove } = useFriendsStore();

  useEffect(() => { fetchAll(); }, []);

  if (loading) return <Spinner />;

  return (
    <YStack f={1} p="$4" gap="$3">
      {friends.length === 0 ? (
        <Paragraph ta="center">No friends yet. Tap + to add.</Paragraph>
      ) : (
        friends.map((f, i) => (
          <FriendListItem
            key={f?.id ?? f?.userId ?? f?.user?.id ?? i}
            friend={f}
            onRemove={
              typeof (f?.userId ?? f?.user?.id) === 'number'
                ? () => remove(f.userId ?? f.user.id)
                : undefined
            }
          />
        ))
      )}

      <XStack jc="center">
        <Button onPress={fetchAll} size="$3">Refresh</Button>
      </XStack>
    </YStack>
  );
}
