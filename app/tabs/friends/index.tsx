import { useEffect } from 'react';
import { YStack, Paragraph, Spinner, Button, XStack } from 'tamagui';
import { useRouter, Link } from 'expo-router';
import { useFriendsStore } from '@/features/friends/model/friends.store';
import { FriendListItem } from '@/features/friends/ui/FriendListItem';

export default function FriendsScreen() {
  const { friends, loading, fetchAll } = useFriendsStore();
  const router = useRouter();

  useEffect(() => { fetchAll(); }, []);

  if (loading) return <Spinner />;

  return (
    <YStack f={1} p="$4" gap="$3">
      {friends.length === 0 ? (
        <YStack gap="$3" ai="center">
          <Paragraph ta="center">No friends yet. Tap + to add.</Paragraph>
          <Link href="/tabs/friends/search" asChild>
            <Button size="$4">＋ Add</Button>
          </Link>
        </YStack>
      ) : (
        <>
          {friends.map((f, i) => (
            <FriendListItem
              key={f?.id ?? f?.userId ?? f?.user?.id ?? i}
              friend={f}
            />
          ))}
          <XStack jc="center" mt="$3" gap="$2">
            <Button onPress={fetchAll} size="$3">Refresh</Button>
            <Link href="/tabs/friends/search" asChild>
              <Button size="$3">＋ Add</Button>
            </Link>
          </XStack>
        </>
      )}
    </YStack>
  );
}
