import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { YStack, XStack, Button, Paragraph, Input, Text, Spinner } from 'tamagui';
import { ChevronLeft, AlertTriangle, Camera as CameraIcon } from '@tamagui/lucide-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import {
  useReceiptSessionStore,
  CapturedReceiptImage,
} from '@/features/receipt/model/receipt-session.store';

const DEFAULT_LANGUAGE = 'en-US';

const getDefaultSessionName = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return `${date} ${time}`;
};

function guessMime(uri?: string): string {
  if (!uri) return 'image/jpeg';
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export default function ScanReceiptScreen() {
  const [perm, requestPerm] = useCameraPermissions();
  const isFocused = useIsFocused();
  const router = useRouter();

  const cameraRef = useRef<CameraView | null>(null);

  const parsing = useReceiptSessionStore((s) => s.parsing);
  const parseReceipt = useReceiptSessionStore((s) => s.parseReceipt);
  const parseError = useReceiptSessionStore((s) => s.parseError);
  const setCapture = useReceiptSessionStore((s) => s.setCapture);
  const clearCapture = useReceiptSessionStore((s) => s.clearCapture);
  const storedCapture = useReceiptSessionStore((s) => s.capture);
  const setSessionNameStore = useReceiptSessionStore((s) => s.setSessionName);
  const storedSessionName = useReceiptSessionStore((s) => s.session?.sessionName);

  const [sessionName, setSessionName] = useState(() => storedSessionName || getDefaultSessionName());
  const [isAutoName, setIsAutoName] = useState(() => !storedSessionName);
  const [localError, setLocalError] = useState<string | null>(null);

  const language = DEFAULT_LANGUAGE;

  useEffect(() => {
    if (isFocused && !perm?.granted) requestPerm();
  }, [isFocused, perm?.granted, requestPerm]);

  useEffect(() => {
    if (storedSessionName) {
      setIsAutoName(false);
      setSessionName((prev) => (prev === storedSessionName ? prev : storedSessionName));
    } else {
      setIsAutoName(true);
    }
  }, [storedSessionName]);

  useFocusEffect(
    useCallback(() => {
      if (storedSessionName) return;
      if (!isAutoName) return;
      const freshName = getDefaultSessionName();
      setSessionName((prev) => (prev === freshName ? prev : freshName));
    }, [storedSessionName, isAutoName])
  );

  useEffect(() => () => clearCapture(), [clearCapture]);

  const handleParse = useCallback(async () => {
    if (!cameraRef.current || parsing) return;

    try {
      setLocalError(null);
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: true,
      });

      if (!picture?.uri) {
        throw new Error('Could not capture the receipt photo. Please try again.');
      }

      const targetWidth = picture.width ? Math.min(picture.width, 1280) : undefined;
      const manipResult = await manipulateAsync(
        picture.uri,
        targetWidth ? [{ resize: { width: targetWidth } }] : [],
        { compress: 0.45, format: SaveFormat.JPEG, base64: true }
      );

      if (!manipResult?.base64) {
        throw new Error('Failed to prepare the receipt photo for upload.');
      }

      const base64SizeKb = (manipResult.base64.length * 3) / 4 / 1024;
      if (__DEV__) {
        console.log('[ReceiptScan] resized image ~KB:', base64SizeKb.toFixed(1), 'dims:', manipResult.width, 'x', manipResult.height);
      }

      const preparedName = sessionName.trim() || getDefaultSessionName();
      const capture: CapturedReceiptImage = {
        uri: manipResult.uri ?? picture.uri,
        base64: manipResult.base64,
        mimeType: 'image/jpeg',
        width: manipResult.width ?? picture.width,
        height: manipResult.height ?? picture.height,
      };

      setSessionNameStore(preparedName);
      setCapture(capture);

      await parseReceipt({
        sessionName: preparedName,
        language,
        image: {
          data: capture.base64,
          mimeType: capture.mimeType,
        },
      });

      router.push('/tabs/sessions/participants');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong while sending the receipt';
      setLocalError(message);
    }
  }, [cameraRef, parsing, sessionName, setSessionNameStore, setCapture, parseReceipt, language, router]);

  const useMock = useCallback(() => {
    router.push({
      pathname: '/tabs/sessions/participants',
      params: { receiptId: 'mock-001' },
    } as never);
  }, [router]);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleSessionNameChange = useCallback((value: string) => {
    setIsAutoName(false);
    setSessionName(value);
  }, [setIsAutoName, setSessionName]);

  const disableAction = parsing || !perm?.granted;
  const errorMessage = localError || parseError;

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
          <CameraView
            ref={cameraRef}
            style={S.camera}
            facing="back"
          />
        ) : (
          <YStack f={1} ai="center" jc="center">
            {!perm ? <ActivityIndicator color="white" /> : <Paragraph col="$gray1">Allow camera access</Paragraph>}
          </YStack>
        )}

        {parsing && (
          <View style={S.overlay}>
            <Spinner size="large" color="white" />
            <Paragraph mt="$2" col="white">Uploading receipt...</Paragraph>
          </View>
        )}
      </View>

      <View style={S.actions}>
        <YStack gap="$3">
          <YStack gap={8}>
            <Paragraph color="$gray1" fontSize={12}>
              Session name
            </Paragraph>
            <Input
              value={sessionName}
              onChangeText={handleSessionNameChange}
              placeholder="e.g. Cafe on October"
              height={41}
              borderRadius={10}
              px={16}
              backgroundColor="rgba(255,255,255,0.1)"
              color="white"
              borderWidth={1}
              borderColor="rgba(255,255,255,0.25)"
            />
          </YStack>

          <Paragraph color="$gray1" fontSize={12}>
            OCR language: <Text fontWeight="700" color="white">{language}</Text>
          </Paragraph>

          {storedCapture?.uri && (
            <XStack ai="center" gap="$2">
              <Image source={{ uri: storedCapture.uri }} style={S.preview} resizeMode="cover" />
              <Paragraph color="$gray1" fontSize={12}>
                Last photo stored; capturing again will overwrite it.
              </Paragraph>
            </XStack>
          )}

          {errorMessage && (
            <XStack ai="center" gap="$2" bg="rgba(255,99,71,0.18)" px="$2" py="$2" borderRadius={8}>
              <AlertTriangle size={16} color="#FF6B6B" />
              <Paragraph color="#FF6B6B" flexShrink={1}>{errorMessage}</Paragraph>
            </XStack>
          )}

          <XStack ai="center" jc="space-between" gap="$3">
            <Button
              size="$3"
              borderRadius="$3"
              theme="gray"
              onPress={goBack}
              disabled={parsing}
              opacity={parsing ? 0.6 : 1}
            >
              Cancel
            </Button>
            <Button
              size="$3"
              borderRadius="$3"
              theme="active"
              onPress={handleParse}
              disabled={disableAction}
              icon={parsing ? undefined : <CameraIcon size={18} color="white" />}
            >
              {parsing ? 'Processing...' : 'Scan receipt'}
            </Button>
          </XStack>

          <Button size="$2" borderRadius="$3" theme="gray" variant="outlined" onPress={useMock} disabled={parsing}>
            Use mock receipt
          </Button>
        </YStack>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    position: 'absolute',
    bottom: 24, left: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 16,
    borderRadius: 16,
  },
  preview: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});















