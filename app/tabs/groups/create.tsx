import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  YStack,
  XStack,
  Input,
  Button,
  Paragraph,
  Separator,
  Spinner,
  Text,
} from 'tamagui';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Check, X as IconX, Crown } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';

import { useGroupsStore } from '@/features/groups/model/groups.store';
import { useFriendsStore } from '@/features/friends/model/friends.store';
import UserAvatar from '@/shared/ui/UserAvatar';

function useAutoNotice() {
  const [text, setText] = useState<string | undefined>();
  const [kind, setKind] = useState<'success' | 'error' | undefined>();

  useEffect(() => {
    if (!text) return;
    const timeout = setTimeout(() => {
      setText(undefined);
      setKind(undefined);
    }, 2200);
    return () => clearTimeout(timeout);
  }, [text]);

  return {
    ok: (message: string) => {
      setKind('success');
      setText(message);
    },
    err: (message: string) => {
      setKind('error');
      setText(message);
    },
    node: text ? (
      <Paragraph col={kind === 'error' ? '$red10' : '$green10'}>{text}</Paragraph>
    ) : null,
  };
}

function pickTitle(friend: any) {
  return (
    friend?.user?.displayName ||
    friend?.user?.username ||
    friend?.displayName ||
    friend?.username ||
    `User #${friend?.user?.id ?? friend?.userId ?? friend?.id}`
  );
}

function pickUniqueId(friend: any): string | undefined {
  return friend?.user?.uniqueId ?? friend?.uniqueId ?? undefined;
}

function pickSubtitle(friend: any) {
  const uniqueId = pickUniqueId(friend);
  return uniqueId ? `@${uniqueId.toLowerCase().replace('user#', 'user')}` : '';
}

export default function GroupCreateScreen() {
  const router = useRouter();
  const notice = useAutoNotice();
  const { t } = useTranslation();

  const { createGroup, openGroup, addMember, removeMember, current, loading, clearCurrent } = useGroupsStore();
  const { friends, fetchAll: fetchFriends } = useFriendsStore();

  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [groupId, setGroupId] = useState<number | undefined>(undefined);
  const [filter, setFilter] = useState('');
  const [opUid, setOpUid] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      clearCurrent();
      setGroupId(undefined);
      setName('');
      setFilter('');
      setOpUid(null);
      setCreating(false);
    }, [clearCurrent])
  );

  useEffect(() => {
    if (!friends?.length) fetchFriends();
  }, [friends?.length, fetchFriends]);

  useEffect(() => {
    if (groupId) openGroup(groupId);
  }, [groupId, openGroup]);

  const memberRole = useMemo(() => {
    const map = new Map<string, string>();
    (current?.members ?? []).forEach((member) => {
      const key = (member?.uniqueId || '').toUpperCase();
      if (key) map.set(key, member?.role || 'member');
    });
    return map;
  }, [current?.members]);

  useEffect(() => {
    if (current?.group?.name) {
      setName(current.group.name);
    }
  }, [current?.group?.name]);

  const rows = useMemo(() => {
    const list = (friends ?? []).map((friend: any) => {
      const uid = pickUniqueId(friend);
      const label = pickTitle(friend);
      const subtitle = pickSubtitle(friend);
      const role = uid ? memberRole.get(uid.toUpperCase()) : undefined;
      return { uid, label, subtitle, role };
    });
    if (!filter) return list;
    const q = filter.toLowerCase();
    return list.filter(
      (item) =>
        (item.label ?? '').toLowerCase().includes(q) || (item.uid ?? '').toLowerCase().includes(q)
    );
  }, [friends, memberRole, filter]);

  async function onCreate() {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const created = await createGroup(name.trim());
      setGroupId(created.id);
      notice.ok(t('groups.create.notice.success', 'Group created'));
      await openGroup(created.id);
    } catch (error: any) {
      notice.err(error?.message ?? t('groups.create.notice.error', 'Failed to create group'));
    } finally {
      setCreating(false);
    }
  }

  async function onAdd(uid: string) {
    if (!groupId) return;
    setOpUid(uid);
    try {
      await addMember(groupId, uid);
      await openGroup(groupId);
      notice.ok(t('groups.create.notice.memberAdded', 'Member added'));
    } catch (error: any) {
      notice.err(error?.message ?? t('groups.create.notice.addFailed', 'Failed to add member'));
    } finally {
      setOpUid(null);
    }
  }

  async function onRemove(uid: string) {
    if (!groupId) return;
    setOpUid(uid);
    try {
      await removeMember(groupId, uid);
      await openGroup(groupId);
      notice.ok(t('groups.create.notice.memberRemoved', 'Member removed'));
    } catch (error: any) {
      notice.err(error?.message ?? t('groups.create.notice.removeFailed', 'Failed to remove member'));
    } finally {
      setOpUid(null);
    }
  }

  return (
    <YStack f={1} p="$4" gap="$3" bg="$background">
      <XStack>
        <Button onPress={() => router.replace('/tabs/groups' as never)} size="$2" w={124} h={22} br={6}>
          {t('groups.create.back', 'Back to Groups')}
        </Button>
      </XStack>

      <Paragraph fow="700" fos="$7">
        {t('groups.create.title', 'Create group')}
      </Paragraph>
      {notice.node}

      <XStack gap="$2" ai="center">
        <Input
          f={1}
          value={name}
          onChangeText={setName}
          placeholder={t('groups.create.namePlaceholder', 'Group name')}
          editable={!groupId}
          returnKeyType="done"
          onSubmitEditing={onCreate}
        />
        <Button onPress={onCreate} disabled={!!groupId || creating}>
          {creating ? '...' : t('groups.create.action', 'Create')}
        </Button>
      </XStack>

      <Separator />

      {!groupId ? (
        <Paragraph col="$gray10">
          {t('groups.create.emptyState', 'Create a group to add members.')}
        </Paragraph>
      ) : loading && !current ? (
        <Spinner />
      ) : (
        <>
          <Paragraph fow="700" fos="$6">
            {t('groups.create.manageMembers', 'Add or remove members')}
          </Paragraph>
          <Input
            value={filter}
            onChangeText={setFilter}
            placeholder={t('groups.create.searchPlaceholder', 'Search friends…')}
            returnKeyType="search"
          />

          {(rows ?? []).length === 0 ? (
            <Paragraph col="$gray10">
              {t('groups.create.noFriends', 'No friends to display')}
            </Paragraph>
          ) : (
            <YStack borderWidth={1} borderColor="$gray5" borderRadius={8} overflow="hidden">
              {rows.map((row, index) => {
                const isOwner = row.role === 'owner';
                const isMember = !!row.role;
                const busy = opUid === row.uid;
                const avatarLabel = (row.label || 'U').slice(0, 1).toUpperCase();

                return (
                  <React.Fragment key={row.uid ?? row.label ?? index}>
                    <XStack
                      h={60}
                      ai="center"
                      jc="space-between"
                      px="$4"
                      bg="$background"
                    >
                      <XStack ai="center" gap="$3">
                        <UserAvatar
                          uri={row.avatarUrl ?? undefined}
                          label={avatarLabel}
                          size={36}
                          textSize={14}
                          backgroundColor="$gray5"
                        />
                        <YStack>
                          <Text fontSize={17} fontWeight="600">
                            {row.label}
                          </Text>
                          {!!row.subtitle && (
                            <Paragraph fontSize={14} color="$gray10">
                              {row.subtitle}
                            </Paragraph>
                          )}
                        </YStack>
                      </XStack>

                      <XStack ai="center" gap="$2">
                        {isOwner ? (
                          <Crown size={18} color="$yellow10" />
                        ) : isMember ? (
                          <>
                            <Check size={18} color="$green10" />
                            <Button
                              size="$2"
                              chromeless
                              circular
                              icon={<IconX size={18} color="$red10" />}
                              onPress={() => row.uid && onRemove(row.uid)}
                              disabled={!row.uid || busy}
                              pressStyle={{ bg: '$red3' }}
                              aria-label={t('groups.create.removeMember', 'Remove member')}
                            />
                          </>
                        ) : (
                          <Button
                            size="$2"
                            chromeless
                            circular
                            icon={<Plus size={18} color="$blue10" />}
                            onPress={() => row.uid && onAdd(row.uid)}
                            disabled={!row.uid || busy}
                            pressStyle={{ bg: '$blue3' }}
                            aria-label={t('groups.create.addMember', 'Add member')}
                          />
                        )}
                      </XStack>
                    </XStack>
                    {index < rows.length - 1 && <Separator />}
                  </React.Fragment>
                );
              })}
            </YStack>
          )}
        </>
      )}
    </YStack>
  );
}
