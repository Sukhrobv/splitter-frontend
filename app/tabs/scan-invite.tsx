// app/tabs/scan-invite.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, XStack, Button, Paragraph } from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';

import { parseInviteFromScan } from '@/shared/lib/utils/invite';
import { FriendsApi } from '@/features/friends/api/friends.api';
import { GroupsApi } from '@/features/groups/api/groups.api';

type FromParam = 'friends-requests' | 'groups-index' | undefined;

export default function ScanInviteScreen() {
  const [perm, requestPerm] = useCameraPermissions();
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const lock = useRef(false);
  const isFocused = useIsFocused();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: FromParam }>();

  useEffect(() => {
    if (isFocused && !perm?.granted) requestPerm();
    if (!isFocused) {
      setStatus('idle');
      lock.current = false;
    }
  }, [isFocused, perm?.granted, requestPerm]);

  const goBack = () => {
    if (from === 'friends-requests') router.replace('/tabs/friends/requests' as never);
    else if (from === 'groups-index') router.replace('/tabs/groups' as never);
    else router.back();
  };

  async function redeem(data: string) {
    try {
      const parsed = parseInviteFromScan(data);
      if (!parsed) throw new Error('not-our-qr');

      setStatus('loading');
      if (parsed.kind === 'friend') {
        await FriendsApi.joinByToken(parsed.token);
      } else {
        await GroupsApi.joinByToken(parsed.token);
      }

      setStatus('ok');
      setTimeout(goBack, 900);
    } catch {
      setStatus('error');
      setTimeout(() => {
        setStatus('idle');
        lock.current = false;
      }, 900);
    }
  }

  return (
    <View style={S.root}>
      {/* Header (светлый текст поверх камеры) */}
      <View style={S.headerAbs}>
        <XStack ai="center" jc="space-between" px="$3" py="$2">
          <Button
            size="$2"
            h={28}
            chromeless
            onPress={goBack}
            icon={<ChevronLeft size={18} color="white" />}
            color="white"
          >
            Back
          </Button>
          <Paragraph fow="700" fos="$6" col="white">Scan invite</Paragraph>
          <YStack w={54} />
        </XStack>
      </View>

      {/* Камера только на фокусе */}
      <View style={S.cameraWrap}>
        {isFocused && perm?.granted ? (
          <CameraView
            style={S.camera}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] as const }}
            onBarcodeScanned={(res) => {
              if (lock.current || status === 'loading') return;
              lock.current = true;
              redeem(res.data);
            }}
          />
        ) : (
          <YStack f={1} ai="center" jc="center">
            <Paragraph col="$gray1">Allow camera access</Paragraph>
          </YStack>
        )}
      </View>

      {/* Статус-плашки в едином стиле */}
      {status !== 'idle' && (
        <View style={S.overlay}>
          {status === 'loading' && (
            <YStack ai="center" gap="$2">
              <ActivityIndicator />
              <Paragraph col="white">Connecting…</Paragraph>
            </YStack>
          )}
          {status === 'ok' && <Paragraph col="white">Done 🎉</Paragraph>}
          {status === 'error' && <Paragraph col="white">Error 😕</Paragraph>}
        </View>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  headerAbs: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    paddingTop: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
});
