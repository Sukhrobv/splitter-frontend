// app/tabs/scan-invite.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Image, Animated, Modal } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, XStack, Button, Paragraph } from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';

import { parseInviteFromScan } from '@/shared/lib/utils/invite';
import { FriendsApi } from '@/features/friends/api/friends.api';
import { GroupsApi } from '@/features/groups/api/groups.api';

type FromParam = 'friends-requests' | 'groups-index' | undefined;

interface UserData {
  avatar?: string;
  name: string;
  username: string;
  bio?: string;
}

export default function ScanInviteScreen() {
  const [perm, requestPerm] = useCameraPermissions();
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [userData, setUserData] = useState<UserData | null>(null);
  const lock = useRef(false);
  const isFocused = useIsFocused();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: FromParam }>();

  // Анимации для модалки
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isFocused && !perm?.granted) requestPerm();
    if (!isFocused) {
      setStatus('idle');
      lock.current = false;
    }
  }, [isFocused, perm?.granted, requestPerm]);

  useEffect(() => {
    if (status === 'ok') {
      // Запускаем анимацию появления
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [status, fadeAnim, scaleAnim]);

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
      
      let response;
      if (parsed.kind === 'friend') {
        response = await FriendsApi.joinByToken(parsed.token);
      } else {
        response = await GroupsApi.joinByToken(parsed.token);
      }

      // Извлекаем данные пользователя из ответа API
      // Адаптируйте под структуру вашего API
      if (response?.data) {
        setUserData({
          avatar: response.data.avatar || response.data.photo,
          name: response.data.name || response.data.fullName,
          username: response.data.username || `@${response.data.login}`,
          bio: response.data.bio || `${response.data.name} endi sizning do'stingiz!`
        });
      }

      setStatus('ok');
      setTimeout(goBack, 3000); // 3 секунды показываем успех
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

      {/* Loading статус */}
      {status === 'loading' && (
        <View style={S.overlay}>
          <YStack ai="center" gap="$2">
            <ActivityIndicator color="white" />
            <Paragraph col="white">Connecting…</Paragraph>
          </YStack>
        </View>
      )}

      {/* Error статус */}
      {status === 'error' && (
        <View style={S.overlay}>
          <Paragraph col="white">Error 😕</Paragraph>
        </View>
      )}

      {/* Success Modal */}
      <Modal
        visible={status === 'ok'}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <View style={S.modalOverlay}>
          <Animated.View
            style={[
              S.successModal,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Галочка успеха */}
            <View style={S.checkmark}>
              <Paragraph fos={24} fow="bold" col="white">✓</Paragraph>
            </View>

            {/* Аватар */}
            <View style={S.avatarContainer}>
              {userData?.avatar ? (
                <Image
                  source={{ uri: userData.avatar }}
                  style={S.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={[S.avatar, S.avatarPlaceholder]}>
                  <Paragraph fos={32} col="$gray8">
                    {userData?.name?.[0]?.toUpperCase() || '?'}
                  </Paragraph>
                </View>
              )}
            </View>

            {/* Информация о пользователе */}
            <YStack ai="center" px="$4" pt="$2" gap="$1">
              <Paragraph fos={20} fow="700" col="#1a1a1a" ta="center">
                {userData?.name || 'User'}
              </Paragraph>
              <Paragraph fos={14} col="#666" ta="center">
                {userData?.username || '@user'}
              </Paragraph>
            </YStack>

            {/* Био */}
            {userData?.bio && (
              <YStack px="$6" pt="$4">
                <Paragraph fos={14} col="#333" ta="center" lh={20}>
                  {userData.bio}
                </Paragraph>
              </YStack>
            )}

            <View style={{ height: 24 }} />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  headerAbs: {
    position: 'absolute',
    top: 0, 
    left: 0, 
    right: 0,
    zIndex: 10,
    paddingTop: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  cameraWrap: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  camera: { 
    flex: 1 
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  successModal: {
    width: 358,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2ECC71',
    // Для Android/iOS тени используем elevation + shadowColor
    elevation: 10,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    position: 'relative',
  },
  checkmark: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2ECC71',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    // Тень для галочки
    elevation: 5,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#2ECC71',
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});