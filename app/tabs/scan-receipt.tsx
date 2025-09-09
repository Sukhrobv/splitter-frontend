import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { YStack, XStack, Button, Paragraph } from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';

export default function ScanReceiptScreen() {
  const [perm, requestPerm] = useCameraPermissions();
  const isFocused = useIsFocused();
  const router = useRouter();
  const [busy] = useState(false);

  useEffect(() => {
    if (isFocused && !perm?.granted) requestPerm();
  }, [isFocused, perm?.granted, requestPerm]);

  const goBack = () => router.back();

  const useMock = () => {
    router.push({
      pathname: '/tabs/sessions/participants',
      params: { receiptId: 'mock-001' },
    } as never);
  };

  return (
    <View style={S.root}>
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
          <Paragraph fow="700" fos="$6" col="white">Scan receipt</Paragraph>
          <YStack w={54} />
        </XStack>
      </View>

      <View style={S.cameraWrap}>
        {isFocused && perm?.granted ? (
          <CameraView style={S.camera} />
        ) : (
          <YStack f={1} ai="center" jc="center">
            {!perm ? <ActivityIndicator /> : <Paragraph col="$gray1">Allow camera access</Paragraph>}
          </YStack>
        )}
      </View>

      <View style={S.actions}>
        <XStack ai="center" jc="space-between" gap="$3">
          <Button size="$3" borderRadius="$3" theme="gray" onPress={goBack}>Cancel</Button>
          <Button size="$3" borderRadius="$3" theme="active" onPress={useMock} disabled={busy}>
            Use mock receipt
          </Button>
        </XStack>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  headerAbs: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    paddingTop: 8, backgroundColor: 'rgba(0,0,0,0.25)',
  },
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  actions: {
    position: 'absolute',
    bottom: 24, left: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 12,
    borderRadius: 12,
  },
});
