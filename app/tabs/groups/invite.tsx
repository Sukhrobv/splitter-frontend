// app/tabs/groups/invite.tsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { YStack, XStack, Button, Paragraph, Spinner } from 'tamagui';
import { ChevronLeft, QrCode } from '@tamagui/lucide-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { InviteQR } from '@/shared/ui/InviteQR';
import { GroupsApi } from '@/features/groups/api/groups.api';
import { ScreenContainer } from '@/shared/ui/ScreenContainer';

type InviteDTO = { url: string; expiresAt: string };

export default function GroupInviteScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [data, setData] = useState<InviteDTO | null>(null);
  const [loading, setLoading] = useState(false);

  const goBack = () => router.replace('/tabs/groups' as never);

  async function refresh() {
    if (!groupId) return;
    setLoading(true);
    try {
      const resp = await GroupsApi.createInvite(groupId, 300);
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
        <XStack ai="center" jc="space-between">
          <Button
            size="$2"
            h={28}
            chromeless
            onPress={goBack}
            icon={<ChevronLeft size={18} color="$gray12" />}
          >
            {t('common.back', 'Back')}
          </Button>
          <XStack ai="center" gap="$2">
            <QrCode size={18} color="$gray12" />
            <Paragraph fow="700" fos="$6">
              {t('groups.invite.title', 'Group QR')}
            </Paragraph>
          </XStack>
          <YStack w={54} />
        </XStack>

        <YStack f={1} ai="center" jc="center" gap="$4">
          {!groupId ? (
            <Paragraph col="$gray10">{t('groups.invite.invalid', 'Invalid group')}</Paragraph>
          ) : loading && !data ? (
            <Spinner />
          ) : data ? (
            <>
              <InviteQR
                url={data.url}
                title={t('groups.invite.description', 'Invite to this group')}
                expiresAt={data.expiresAt}
              />
              <Button onPress={refresh} size="$3" borderRadius="$3">
                {t('groups.invite.new', 'New QR')}
              </Button>
            </>
          ) : (
            <>
              <Paragraph>{t('groups.invite.error', 'Failed to get invite')}</Paragraph>
              <Button onPress={refresh}>{t('common.retry', 'Retry')}</Button>
              <Button onPress={goBack} variant="outlined">
                {t('common.back', 'Back')}
              </Button>
            </>
          )}
        </YStack>
      </YStack>
    </ScreenContainer>
  );
}
