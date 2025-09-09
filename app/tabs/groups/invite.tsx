// app/tabs/groups/invite.tsx
import React, { useEffect, useState } from 'react';
import { YStack, XStack, Button, Paragraph, Spinner } from 'tamagui';
import { ChevronLeft, QrCode } from '@tamagui/lucide-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { InviteQR } from '@/shared/ui/InviteQR';
import { GroupsApi } from '@/features/groups/api/groups.api';
import { ScreenContainer } from '@/shared/ui/ScreenContainer';

type InviteDTO = { url: string; expiresAt: string };

export default function GroupInviteScreen() {
  // Ожидаем /tabs/groups/invite?groupId=123
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const router = useRouter();

  const [data, setData] = useState<InviteDTO | null>(null);
  const [loading, setLoading] = useState(false);

  const goBack = () => router.replace('/tabs/groups' as never);

  async function refresh() {
    if (!groupId) return;
    setLoading(true);
    try {
      const resp = await GroupsApi.createInvite(groupId, 300); // 5 минут
      setData({ url: resp.url, expiresAt: resp.expiresAt });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (groupId) refresh();
  }, [groupId]);

  return (
    <ScreenContainer>
      <YStack f={1} p="$4" gap="$4" bg="$background">
        {/* Header */}
        <XStack ai="center" jc="space-between">
          <Button
            size="$2"
            h={28}
            chromeless
            onPress={goBack}
            icon={<ChevronLeft size={18} color="$gray12" />}
          >
            Back
          </Button>
          <XStack ai="center" gap="$2">
            <QrCode size={18} color="$gray12" />
            <Paragraph fow="700" fos="$6">Group QR</Paragraph>
          </XStack>
          <YStack w={54} />
        </XStack>

        {/* Body */}
        <YStack f={1} ai="center" jc="center" gap="$4">
          {!groupId ? (
            <Paragraph col="$gray10">Invalid group</Paragraph>
          ) : loading && !data ? (
            <Spinner />
          ) : data ? (
            <>
              <InviteQR
                url={data.url}
                title="Invite to this group"
                expiresAt={data.expiresAt}
              />
              <Button onPress={refresh} size="$3" borderRadius="$3">
                New QR
              </Button>
            </>
          ) : (
            <>
              <Paragraph>Failed to get invite</Paragraph>
              <Button onPress={refresh}>Retry</Button>
              <Button onPress={goBack} variant="outlined">Back</Button>
            </>
          )}
        </YStack>
      </YStack>
    </ScreenContainer>
  );
}
