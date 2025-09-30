import React, { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  YStack, XStack, Paragraph, Separator, Button, Input, Spinner, Text
} from 'tamagui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Crown, Pencil, Trash2, Check, X as IconX, ChevronLeft, QrCode } from '@tamagui/lucide-icons';

import { useGroupsStore } from '@/features/groups/model/groups.store';
import { useFriendsStore } from '@/features/friends/model/friends.store';
import UserAvatar from '@/shared/ui/UserAvatar';
import { useAppStore } from '@/shared/lib/stores/app-store';

const fmtUid = (uid?: string) => (uid ? `@${uid.toLowerCase().replace('user#','user')}` : '');

function computeIsOwner(
  current: { group?: { ownerId?: number }, role?: 'owner'|'member' } | undefined,
  me?: { id?: number } | null
): boolean {
  if (!current) return false;
  if (current.role === 'owner') return true;
  if (typeof current.group?.ownerId === 'number' && typeof me?.id === 'number') {
    return current.group.ownerId === me.id;
  }
  return false;
}

export default function GroupDetailsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const gid = Number(groupId);
  const router = useRouter();

  const { current, loading, error, openGroup, renameGroup, deleteGroup, addMember, removeMember } = useGroupsStore();
  const { friends, fetchAll: fetchFriends } = useFriendsStore();
  const me = useAppStore(s => s.user);

  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [filter, setFilter] = useState('');
  const [opUid, setOpUid] = useState<string | null>(null);
  const [busyHdr, setBusyHdr] = useState<string | number | undefined>();

  useEffect(() => { if (gid) openGroup(gid); }, [gid, openGroup]);
  useEffect(() => { if (!friends?.length) fetchFriends(); }, [friends?.length, fetchFriends]);
  useEffect(() => {
    if (current?.group?.name) { setNewName(current.group.name!); setEditing(false); }
  }, [current?.group?.name]);

  const canManage = useMemo(() => computeIsOwner(current, me), [current, me]);
  const title = current?.group?.name ?? 'Group';
  const members = useMemo(() => current?.members ?? [], [current]);
  const ownerId = current?.group?.ownerId;

  const memberSetUpper = useMemo(
    () => new Set((members ?? []).map(m => (m?.uniqueId || '').toUpperCase())),
    [members]
  );

  const candidatesBase = useMemo(() => {
    return (friends ?? [])
      .map((f: any) => {
        const uid = f?.user?.uniqueId ?? f?.uniqueId ?? '';
        const label = f?.user?.displayName || f?.user?.username || f?.displayName || f?.username || uid;
        return { uniqueId: uid, username: label, displayName: f?.user?.displayName ?? f?.displayName };
      })
      .filter(u => !!u.uniqueId && !memberSetUpper.has(u.uniqueId.toUpperCase()));
  }, [friends, memberSetUpper]);

  const candidates = useMemo(() => {
    const q = filter.toLowerCase();
    return candidatesBase.filter(u => {
      const name = (u.displayName || u.username || u.uniqueId || '').toLowerCase();
      const uid  = (u.uniqueId || '').toLowerCase();
      return !filter || name.includes(q) || uid.includes(q);
    });
  }, [candidatesBase, filter]);

  async function onRenameConfirm() {
    if (!gid || !newName.trim() || newName.trim() === title) { setEditing(false); return; }
    setBusyHdr('rename');
    try { await renameGroup(gid, newName.trim()); await openGroup(gid); }
    finally { setBusyHdr(undefined); setEditing(false); }
  }

  function onDeleteAsk() {
    Alert.alert(
      'Delete group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!gid) return;
            setBusyHdr('delete');
            try { await deleteGroup(gid); router.replace('/tabs/groups' as never); }
            finally { setBusyHdr(undefined); }
          },
        },
      ],
      { cancelable: true }
    );
  }

  async function onAdd(uid: string) {
    if (!gid) return;
    setOpUid(uid);
    try { await addMember(gid, uid); await openGroup(gid); }
    finally { setOpUid(null); }
  }

  async function onRemove(uid: string) {
    if (!gid) return;
    setOpUid(uid);
    try { await removeMember(gid, uid); await openGroup(gid); }
    finally { setOpUid(null); }
  }

  const openGroupQR = () => {
    if (!groupId) return;
    router.push({ pathname: '/tabs/groups/invite', params: { groupId } });
  };

  if (loading && !current) return <YStack f={1} ai="center" jc="center"><Spinner /></YStack>;
  if (error) return <YStack f={1} p="$4"><Paragraph col="$red10">{error}</Paragraph></YStack>;
  if (!current) return <YStack f={1} p="$4"><Paragraph>No group</Paragraph></YStack>;

  return (
    <YStack f={1} p="$4" gap="$3" bg="$background">
      {/* Back (text-only) with chevron) */}
      <XStack>
        <Button
          onPress={() => router.replace('/tabs/groups' as never)}
          size="$2"
          h={22}
          px={0}
          unstyled
          chromeless
          bg="transparent"
          borderWidth={0}
          color="$gray12"
          pressStyle={{ opacity: 0.6 }}
          icon={<ChevronLeft size={18} color="$gray12" />}
        >
          Back to Groups
        </Button>
      </XStack>

      {/* Title row: title + inline actions */}
      <XStack ai="center" gap="$2">
        <XStack f={1} ai="center" gap="$2" minHeight={22}>
          {!editing ? (
            <Text numberOfLines={1} fontSize={14} fontWeight="400">
              {title}
            </Text>
          ) : (
            <Input
              value={newName}
              onChangeText={setNewName}
              autoFocus
              f={1}
              h={38}
              px={10}
              borderRadius={8}
              fontSize={14}
              bg="$backgroundPress"
              color="$gray12"
              placeholderTextColor="$gray10"
              borderWidth={0}
              returnKeyType="done"
              onSubmitEditing={onRenameConfirm}
            />
          )}
        </XStack>

        {canManage && !editing && (
          <XStack ai="center" gap="$1">
            <Button
              chromeless
              circular
              size="$2"
              aria-label="Rename"
              icon={<Pencil size={18} color="$gray12" />}
              onPress={() => setEditing(true)}
            />
            <Button
              chromeless
              circular
              size="$2"
              aria-label="Delete group"
              icon={<Trash2 size={18} color="$red10" />}
              onPress={onDeleteAsk}
              disabled={busyHdr === 'delete'}
            />
          </XStack>
        )}

        {canManage && editing && (
          <XStack ai="center" gap="$1">
            <Button
              chromeless
              circular
              size="$2"
              aria-label="Confirm rename"
              icon={<Check size={18} color="$green10" />}
              onPress={onRenameConfirm}
              disabled={busyHdr === 'rename'}
            />
            <Button
              chromeless
              circular
              size="$2"
              aria-label="Cancel rename"
              icon={<IconX size={18} color="$gray11" />}
              onPress={() => { setNewName(title); setEditing(false); }}
            />
          </XStack>
        )}
      </XStack>

      {/* INVITE ACTIONS — только QR (сканер перенесён на список групп) */}
      {canManage && (
        <>
          <XStack jc="flex-end" ai="center" py="$2">
            <Button
              onPress={openGroupQR}
              theme="gray"
              size="$3"
              borderRadius="$3"
              icon={<QrCode size={18} />}
            >
              Show group QR
            </Button>
          </XStack>
          <Separator />
        </>
      )}

      {/* MEMBERS */}
      <Paragraph fow="700" fos="$6">Members</Paragraph>
      {members.length === 0 ? (
        <Paragraph col="$gray10">No members yet</Paragraph>
      ) : (
        <YStack borderWidth={1} borderColor="$gray5" borderRadius={8} overflow="hidden">
          {members.map((m, idx) => {
            const uid = m.uniqueId;
            const label = m.displayName || m.username || uid;
            const avatarUrl = m.avatarUrl ?? m.user?.avatarUrl ?? null;
            const isOwnerMember =
              m.role === 'owner' ||
              (typeof m.id === 'number' && typeof ownerId === 'number' && ownerId === m.id);
            const busy = opUid === uid;

            return (
              <React.Fragment key={uid ?? `${label}-${idx}`}>
                <XStack h={60} ai="center" jc="space-between" px="$4" bg="$green3">
                  <XStack ai="center" gap="$3">
                    <UserAvatar uri={avatarUrl ?? undefined} label={(label || "U").slice(0, 1).toUpperCase()} size={36} textSize={14} backgroundColor="$gray5" />
                    <YStack>
                      <Text fontSize={17} fontWeight="600">{label}</Text>
                      {!!uid && <Paragraph fontSize={14} color="$gray10">{fmtUid(uid)}</Paragraph>}
                    </YStack>
                  </XStack>

                  <XStack ai="center" gap="$2">
                    {isOwnerMember && <Crown size={18} color="$yellow10" />}
                    {canManage && !isOwnerMember && (
                      <Button size="$2" theme="red" onPress={() => uid && onRemove(uid)} disabled={!uid || busy}>
                        {busy ? '...' : 'Remove'}
                      </Button>
                    )}
                  </XStack>
                </XStack>
                {idx < (members.length - 1) && <Separator />}
              </React.Fragment>
            );
          })}
        </YStack>
      )}

      <Separator />

      {/* ADD FROM FRIENDS */}
      <Paragraph fow="700" fos="$6">Add from friends</Paragraph>
      <Input
        value={filter}
        onChangeText={setFilter}
        placeholder="Search friends…"
        h={41}
        px={16}
        borderRadius={10}
        fontSize={14}
        fontWeight="500"
        color="$gray12"
        placeholderTextColor="$gray10"
        bg="$backgroundPress"
        borderWidth={0}
        returnKeyType="search"
      />

      {(candidates ?? []).length === 0 ? (
        <Paragraph col="$gray10" mt="$2">No friends to add</Paragraph>
      ) : (
        <YStack borderWidth={1} borderColor="$gray5" borderRadius={8} overflow="hidden" mt="$2">
          {candidates.map((u, idx) => {
            const uid = u.uniqueId;
            const label = u.displayName || u.username || uid;
            const avatarUrl = u.avatarUrl ?? u.user?.avatarUrl ?? null;
            const busy = opUid === uid;

            return (
              <React.Fragment key={uid ?? `${label}-${idx}`}>
                <XStack h={60} ai="center" jc="space-between" px="$4">
                  <XStack ai="center" gap="$3">
                    <UserAvatar uri={avatarUrl ?? undefined} label={(label || "U").slice(0, 1).toUpperCase()} size={36} textSize={14} backgroundColor="$gray5" />
                    <YStack>
                      <Text fontSize={17} fontWeight="600">{label}</Text>
                      {!!uid && <Paragraph fontSize={14} color="$gray10">{fmtUid(uid)}</Paragraph>}
                    </YStack>
                  </XStack>

                  {canManage && (
                    <Button size="$2" onPress={() => uid && onAdd(uid)} disabled={!uid || busy}>
                      {busy ? '...' : 'Add'}
                    </Button>
                  )}
                </XStack>
                {idx < (candidates.length - 1) && <Separator />}
              </React.Fragment>
            );
          })}
        </YStack>
      )}
    </YStack>
  );
}
