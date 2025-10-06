import { useEffect } from 'react';
import { YStack, Paragraph, Card, XStack, Spinner, Separator, View, Button } from 'tamagui';
import { useRouter } from 'expo-router';
import { Scan } from '@tamagui/lucide-icons';
import { useGroupsStore } from '@/features/groups/model/groups.store';
import type { GroupMember } from '@/features/groups/api/groups.api';
import UserAvatar from '@/shared/ui/UserAvatar';
import Fab from '@/shared/ui/Fab';

function AvatarStack({
  members,
  totalCount,
  max = 5,
}: {
  members?: GroupMember[];
  totalCount?: number;
  max?: number;
}) {
  const list = Array.isArray(members) ? members : [];
  const total = typeof totalCount === 'number' ? totalCount : list.length;
  const shownMembers = list.slice(0, Math.min(max, list.length));
  const hasMembers = shownMembers.length > 0;
  const placeholderCount = hasMembers ? 0 : Math.min(total, max);
  const extra = Math.max(0, total - (hasMembers ? shownMembers.length : placeholderCount));

  if (!hasMembers && placeholderCount === 0) {
    return null;
  }

  const labelFor = (member: GroupMember) => {
    const source = member.displayName || member.username || member.uniqueId || '';
    return source.trim().charAt(0).toUpperCase() || 'U';
  };

  return (
    <XStack ai="center">
      {shownMembers.map((member, index) => (
        <View key={`${member.uniqueId ?? 'member'}-${index}`} ml={index === 0 ? 0 : -10}>
          <UserAvatar
            uri={member.avatarUrl ?? member.user?.avatarUrl ?? undefined}
            label={labelFor(member)}
            size={34}
            textSize={14}
            backgroundColor="$gray5"
          />
        </View>
      ))}
      {!hasMembers &&
        Array.from({ length: placeholderCount }).map((_, index) => (
          <View key={`placeholder-${index}`} w={34} h={34} br={17} bg="$gray5" ml={index === 0 ? 0 : -10} />
        ))}
      {extra > 0 && (
        <View
          w={28}
          h={28}
          br={14}
          bg="$gray8"
          ai="center"
          jc="center"
          ml={hasMembers || placeholderCount > 0 ? -10 : 0}
        >
          <Paragraph size="$1" col="white">
            +{extra}
          </Paragraph>
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

      {/* Invite actions for groups: только сканирование на списке */}
      <XStack jc="flex-end" ai="center">
        <Button
          onPress={() =>
            router.push({ pathname: '/tabs/scan-invite', params: { from: 'groups-index' } } as never)
          }
          size="$3"
          borderRadius="$3"
          theme="active"
          icon={<Scan size={18} />}
        >
          Scan invite
        </Button>
      </XStack>

      {error && <Paragraph col="$red10">{error}</Paragraph>}

      {groups.length === 0 ? (
        <Paragraph col="$gray10">No groups yet. Tap + to create.</Paragraph>
      ) : (
        <YStack gap="$3">
          {groups.map((g) => {
            const members = Array.isArray(g.members) ? g.members : [];
            const storedCount = counts?.[g.id];
            const apiCount = typeof g.counts?.members === 'number' ? g.counts.members : undefined;
            const memberCount =
              typeof storedCount === 'number'
                ? storedCount
                : typeof apiCount === 'number'
                ? apiCount
                : members.length;
            const countLabel = memberCount === 1 ? '1 member' : `${memberCount} members`;
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
                      {memberCount === 0 ? 'No members yet' : countLabel}
                    </Paragraph>
                  </YStack>
                  <AvatarStack members={members} totalCount={memberCount} />
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
