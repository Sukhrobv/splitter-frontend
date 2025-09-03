import { useEffect, useMemo, useState } from 'react';
import {
  YStack, XStack, Input, Button, Paragraph, Separator, Spinner, Circle, Text
} from 'tamagui';
import { useRouter } from 'expo-router';
import { Plus, Check, X as IconX, Crown } from '@tamagui/lucide-icons';
import { useGroupsStore } from '@/features/groups/model/groups.store';
import { useFriendsStore } from '@/features/friends/model/friends.store';

function useAutoNotice() {
  const [text, setText] = useState<string | undefined>();
  const [kind, setKind] = useState<'success' | 'error' | undefined>();
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => { setText(undefined); setKind(undefined); }, 2200);
    return () => clearTimeout(t);
  }, [text]);
  return {
    ok: (t: string) => { setKind('success'); setText(t); },
    err: (t: string) => { setKind('error'); setText(t); },
    node: text ? <Paragraph col={kind === 'error' ? '$red10' : '$green10'}>{text}</Paragraph> : null,
  };
}

function pickTitle(f: any) {
  return (
    f?.user?.displayName ||
    f?.user?.username ||
    f?.displayName ||
    f?.username ||
    `User #${f?.user?.id ?? f?.userId ?? f?.id}`
  );
}
function pickUniqueId(f: any): string | undefined {
  return f?.user?.uniqueId ?? f?.uniqueId ?? undefined;
}
function pickSubtitle(f: any) {
  const uniqueId = pickUniqueId(f);
  return uniqueId ? `@${uniqueId.toLowerCase().replace('user#', 'user')}` : '';
}

export default function GroupCreateScreen() {
  const router = useRouter();
  const notice = useAutoNotice();

  const { createGroup, openGroup, addMember, removeMember, current, loading } = useGroupsStore();
  const { friends, fetchAll: fetchFriends } = useFriendsStore();

  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [groupId, setGroupId] = useState<number | undefined>(undefined);
  const [filter, setFilter] = useState('');
  const [opUid, setOpUid] = useState<string | null>(null); // текущий uid в операции add/remove

  useEffect(() => { if (!friends?.length) fetchFriends(); }, [friends?.length, fetchFriends]);
  useEffect(() => { if (groupId) openGroup(groupId); }, [groupId, openGroup]);

  // карта участников { UID_UPPER -> role }
  const memberRole = useMemo(() => {
    const map = new Map<string, string>();
    (current?.members ?? []).forEach(m => {
      const u = (m?.uniqueId || '').toUpperCase();
      if (u) map.set(u, m?.role || 'member');
    });
    return map;
  }, [current?.members]);

  // весь список друзей, отфильтрованный поиском
  const rows = useMemo(() => {
    const base = (friends ?? []).map((f: any) => {
      const uid = pickUniqueId(f);
      const label = pickTitle(f);
      const subtitle = pickSubtitle(f);
      const role = uid ? memberRole.get(uid.toUpperCase()) : undefined; // 'owner' | 'member' | undefined
      return { uid, label, subtitle, role };
    });
    if (!filter) return base;
    const q = filter.toLowerCase();
    return base.filter(x => (x.label ?? '').toLowerCase().includes(q) || (x.uid ?? '').toLowerCase().includes(q));
  }, [friends, memberRole, filter]);

  async function onCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const g = await createGroup(name.trim());
      setGroupId(g.id);
      notice.ok('Group created');
      await openGroup(g.id);
    } catch (e: any) {
      notice.err(e?.message ?? 'Failed to create');
    } finally {
      setCreating(false);
    }
  }

  async function onAdd(uid: string) {
    if (!groupId) return;
    setOpUid(uid);
    try { await addMember(groupId, uid); await openGroup(groupId); }
    catch (e:any) { notice.err(e?.message ?? 'Failed to add'); }
    finally { setOpUid(null); }
  }

  async function onRemove(uid: string) {
    if (!groupId) return;
    setOpUid(uid);
    try { await removeMember(groupId, uid); await openGroup(groupId); }
    catch (e:any) { notice.err(e?.message ?? 'Failed to remove'); }
    finally { setOpUid(null); }
  }

  return (
    <YStack f={1} p="$4" gap="$3" bg="$background">
      <XStack>
        <Button onPress={() => router.replace('/tabs/groups' as never)} size="$2" w={124} h={22} br={6}>
          Back to Groups
        </Button>
      </XStack>

      <Paragraph fow="700" fos="$7">Create group</Paragraph>
      {notice.node}

      <XStack gap="$2" ai="center">
        <Input
          f={1}
          value={name}
          onChangeText={setName}
          placeholder="Group name"
          editable={!groupId}
          returnKeyType="done"
          onSubmitEditing={onCreate}
        />
        <Button onPress={onCreate} disabled={!!groupId || creating}>
          {creating ? '...' : 'Create'}
        </Button>
      </XStack>

      <Separator />

      {/* unified friends list with inline add/remove */}
      {!groupId ? (
        <Paragraph col="$gray10">Create a group to add members.</Paragraph>
      ) : loading && !current ? (
        <Spinner />
      ) : (
        <>
          <Paragraph fow="700" fos="$6">Add or remove members</Paragraph>
          <Input
            value={filter}
            onChangeText={setFilter}
            placeholder="Search friends…"
            returnKeyType="search"
          />

          {(rows ?? []).length === 0 ? (
            <Paragraph col="$gray10">No friends to display</Paragraph>
          ) : (
            <YStack borderWidth={1} borderColor="$gray5" borderRadius={8} overflow="hidden">
              {rows.map((r, idx) => {
                const isOwner = r.role === 'owner';
                const isMember = !!r.role;
                const busy = opUid === r.uid;

                return (
                  <>
                    <XStack
                      key={r.uid ?? r.label ?? idx}
                      h={60}
                      ai="center"
                      jc="space-between"
                      px="$4"
                      bg="$background"
                    >
                      <XStack ai="center" gap="$3">
                        <Circle size={36} backgroundColor="$gray5" />
                        <YStack>
                          <Text fontSize={17} fontWeight="600">{r.label}</Text>
                          {!!r.subtitle && <Paragraph fontSize={14} color="$gray10">{r.subtitle}</Paragraph>}
                        </YStack>
                      </XStack>

                      {/* status/action */}
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
                              onPress={() => r.uid && onRemove(r.uid)}
                              disabled={!r.uid || busy}
                              pressStyle={{ bg: '$red3' }}
                            />
                          </>
                        ) : (
                          <Button
                            size="$2"
                            chromeless
                            circular
                            icon={<Plus size={18} color="$blue10" />}
                            onPress={() => r.uid && onAdd(r.uid)}
                            disabled={!r.uid || busy}
                            pressStyle={{ bg: '$blue3' }}
                          />
                        )}
                      </XStack>
                    </XStack>
                    {idx < (rows.length - 1) && <Separator />}
                  </>
                );
              })}
            </YStack>
          )}
        </>
      )}
    </YStack>
  );
}
