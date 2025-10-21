// app/tabs/friends/invite.tsx
import React, { useEffect, useState } from 'react';
import { YStack, XStack, Button, Paragraph, Spinner } from 'tamagui';
import { QrCode } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { InviteQR } from '@/shared/ui/InviteQR';
import { FriendsApi } from '@/features/friends/api/friends.api';
import { ScreenContainer } from '@/shared/ui/ScreenContainer';

type InviteDTO = { url: string; expiresAt: string };

export default function FriendInviteScreen() {
  const [data, setData] = useState<InviteDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const goBack = () => router.replace('/tabs/friends/requests' as never);

  async function refresh() {
    setLoading(true);
    try {
      const resp = await FriendsApi.createInvite(300);
      setData({ url: resp.url, expiresAt: resp.expiresAt });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <ScreenContainer>
      <YStack f={1} p="$4" gap="$4" bg="$background">
        {/* Header */}
        <XStack ai="center" jc="space-between">
          {/* <Button
            size="$2"
            h={28}
            chromeless
            onPress={goBack}
            icon={<ChevronLeft size={18} color="$gray12" />}
          >
            Back
          </Button> */}
          <XStack ai="center" gap="$2">
            <QrCode size={18} color="$gray12" />
            <Paragraph fow="700" fos="$6">{t('friends.invite.title', 'My Friend QR')}</Paragraph>
          </XStack>
          <YStack w={54} />{/* spacer */}
        </XStack>

        {/* Body */}
        <YStack f={1} ai="center" jc="center" gap="$4">
          {loading && !data ? (
            <Spinner />
          ) : data ? (
            <>
              <InviteQR
                url={data.url}
                title={t('friends.invite.description', 'Show this QR to your friend')}
                expiresAt={data.expiresAt}
              />
              <Button onPress={refresh} size="$3" borderRadius="$3">
                {t('friends.invite.new', 'New QR')}
              </Button>
            </>
          ) : (
            <>
              <Paragraph>{t('friends.invite.error', 'Failed to get invite')}</Paragraph>
              <Button onPress={refresh}>{t('common.retry', 'Retry')}</Button>
              {/* <Button onPress={goBack} variant="outlined">Back</Button> */}
            </>
          )}
        </YStack>
      </YStack>
    </ScreenContainer>
  );
}

