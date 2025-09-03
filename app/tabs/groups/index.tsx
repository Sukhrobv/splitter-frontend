import { useEffect } from 'react';
import { YStack, Paragraph, Card, XStack, Spinner, Separator, View } from 'tamagui';
import { useRouter } from 'expo-router';
import { useGroupsStore } from '@/features/groups/model/groups.store';
import Fab from '@/shared/ui/Fab';

function Avatar({ i }: { i: number }) {
  // плейсхолдер-аватар
  return <View w={34} h={34} br={17} bg="$gray5" ml={i === 0 ? 0 : -10} />;
}

function AvatarStack({
  previewCount = 0,
  max = 5,
}: { previewCount?: number; max?: number }) {
  if (!previewCount) return null;
  const shown = Math.min(previewCount, max);
  const rest = previewCount - shown;

  return (
    <XStack ai="center">
      {Array.from({ length: shown }).map((_, i) => (
        <Avatar key={i} i={i} />
      ))}
      {rest > 0 && (
        <View w={28} h={28} br={14} bg="$gray8" ai="center" jc="center" ml={-10}>
          <Paragraph size="$1" col="white">+{rest}</Paragraph>
        </View>
      )}
    </XStack>
  );
}

export default function GroupsListScreen() {
  const router = useRouter();
  const { groups, counts, loading, error, fetchGroups } = useGroupsStore();

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  if (loading && groups.length === 0) {
    return <YStack f={1} ai="center" jc="center"><Spinner /></YStack>;
  }

  return (
    <YStack f={1} p="$4" gap="$3" bg="$background">
      <Paragraph fow="700" fos="$7">Groups</Paragraph>
      <Separator />

      {error && <Paragraph col="$red10">{error}</Paragraph>}

      {groups.length === 0 ? (
        <Paragraph col="$gray10">No groups yet. Tap + to create.</Paragraph>
      ) : (
        <YStack gap="$3">
          {groups.map((g) => {
            const count = counts?.[g.id];         // если стор заполняет
            const preview = typeof count === 'number' ? count : 0;
            return (
              <Card
                key={g.id}
                pressStyle={{ scale: 0.98 }}
                onPress={() =>
                  router.push({ pathname: '/tabs/groups/[groupId]', params: { groupId: String(g.id) } } as never)
                }
                h={62}
                br={12}
                bw={1}
                bc="$gray5"
                px="$4"
                ai="center"
                jc="center"
              >
                <XStack w="100%" jc="space-between" ai="center">
                  <YStack>
                    <Paragraph fow="700" fos={16}>{g.name ?? 'Group'}</Paragraph>
                    <Paragraph size={12} col="$gray10">
                      {typeof count === 'number' ? `${count} members` : '—'}
                    </Paragraph>
                  </YStack>
                  <AvatarStack previewCount={preview} />
                </XStack>
              </Card>
            );
          })}
        </YStack>
      )}

      <Fab onPress={() => router.push('/tabs/groups/create' as never)} />
    </YStack>
  );
}
