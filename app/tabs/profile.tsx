import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Platform, ScrollView, TextInputProps } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { YStack, XStack, Text, Button, Separator, Spinner } from 'tamagui';
import { Copy, LogOut, Upload, RotateCcw, CheckCircle, User as UserIcon, Mail, Lock, Edit3, X, Check } from '@tamagui/lucide-icons';

import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenContainer } from '@/shared/ui/ScreenContainer';
import UserAvatar from '@/shared/ui/UserAvatar';
import Input from '@/shared/ui/Input';
import PasswordInput from '@/shared/ui/PasswordInput';
import { useAppStore } from '@/shared/lib/stores/app-store';
import { changePassword, resetAvatar, updateEmail, updateUsername, uploadAvatar } from '@/features/auth/api';

type SuccessKey = 'avatar' | 'password';

type StatusState = 'idle' | 'saving' | 'success';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.9,
};

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  successTrigger?: number;
}

function SectionCard({ title, icon, children, successTrigger = 0 }: SectionCardProps) {
  return (
    <YStack
      borderWidth={1}
      borderColor="$gray5"
      borderRadius={16}
      padding="$4"
      gap="$3"
      backgroundColor="$background"
      position="relative"
    >
      <XStack ai="center" jc="space-between">
        <XStack ai="center" gap="$2">
          {icon}
          <Text fontSize={16} fontWeight="700">
            {title}
          </Text>
        </XStack>
        <SuccessBadge trigger={successTrigger} />
      </XStack>
      {children}
    </YStack>
  );
}

function SuccessBadge({ trigger }: { trigger?: number }) {
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!trigger) return;

    setVisible(true);
    opacity.setValue(0);
    scale.setValue(0.9);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 140,
      }),
    ]).start(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        delay: 1200,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    });
  }, [trigger, opacity, scale]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ scale }],
        backgroundColor: 'rgba(34,197,94,0.15)',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 4,
      }}
    >
      <XStack ai="center" gap="$1">
        <CheckCircle size={16} color="#22c55e" />
        <Text fontSize={12} fontWeight="600" color="$green10">
          Saved
        </Text>
      </XStack>
    </Animated.View>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  onCopy?: () => void;
}

function InfoRow({ label, value, onCopy }: InfoRowProps) {
  return (
    <YStack gap="$1">
      <Text fontSize={12} color="$gray9">
        {label}
      </Text>
      <XStack ai="center" jc="space-between">
        <Text fontSize={16} fontWeight="600">
          {value || '—'}
        </Text>
        {onCopy && (
          <Button size="$2" variant="outlined" icon={<Copy size={16} color="$gray11" />} onPress={onCopy}>
            Copy
          </Button>
        )}
      </XStack>
    </YStack>
  );
}

interface EditableFieldRowProps {
  label: string;
  value: string;
  draft: string;
  setDraft: (value: string) => void;
  placeholder: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  status: StatusState;
  error?: string | null;
  onCopy?: () => void;
  textInputProps?: Partial<TextInputProps>;
}

function EditableFieldRow({
  label,
  value,
  draft,
  setDraft,
  placeholder,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  status,
  error,
  onCopy,
  textInputProps,
}: EditableFieldRowProps) {
  const animatedScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'success' && !isEditing) {
      animatedScale.setValue(0.85);
      Animated.spring(animatedScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 120,
      }).start();
    }
  }, [animatedScale, status, isEditing]);

  const editIcon = () => {
    if (status === 'saving') {
      return <Spinner size="small" color="$gray11" />;
    }
    if (status === 'success' && !isEditing) {
      return (
        <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
          <CheckCircle size={16} color="#22c55e" />
        </Animated.View>
      );
    }
    return <Edit3 size={16} color="$gray11" />;
  };

  return (
    <YStack gap="$2">
      <XStack ai="center" jc="space-between">
        <Text fontSize={12} color="$gray9">
          {label}
        </Text>
        <XStack gap="$2">
          {isEditing ? (
            <>
              <Button
                size="$2"
                variant="outlined"
                icon={<X size={16} color="$gray11" />}
                onPress={onCancelEdit}
              />
              <Button
                size="$2"
                bg="$green9"
                color="white"
                icon={status === 'saving' ? <Spinner size="small" color="white" /> : <Check size={16} color="white" />}
                onPress={onSave}
                disabled={status === 'saving'}
              />
            </>
          ) : (
            <>
              {onCopy && (
                <Button
                  size="$2"
                  variant="outlined"
                  icon={<Copy size={16} color="$gray11" />}
                  onPress={onCopy}
                >
                  Copy
                </Button>
              )}
              <Button
                size="$2"
                variant="outlined"
                onPress={onStartEdit}
                icon={editIcon()}
              />
            </>
          )}
        </XStack>
      </XStack>
      {isEditing ? (
        <Input
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          error={error || undefined}
          textInputProps={{ autoCapitalize: 'none', autoCorrect: false, ...textInputProps }}
        />
      ) : (
        <Text fontSize={16} fontWeight="600">
          {value || '—'}
        </Text>
      )}
    </YStack>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAppStore();

  const displayName = user?.username || 'Guest';
  const userId = user?.uniqueId ?? '';

  const [previewUri, setPreviewUri] = useState<string | null>(user?.avatarUrl ?? null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isResettingAvatar, setIsResettingAvatar] = useState(false);
  const [successCounters, setSuccessCounters] = useState<Record<SuccessKey, number>>({
    avatar: 0,
    password: 0,
  });

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(user?.username ?? '');
  const [usernameStatus, setUsernameStatus] = useState<StatusState>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const usernameResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState(user?.email ?? '');
  const [emailStatus, setEmailStatus] = useState<StatusState>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);
  const emailResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [mediaPermission, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();

  useEffect(() => {
    setPreviewUri(user?.avatarUrl ?? null);
  }, [user?.avatarUrl]);

  useEffect(() => {
    setUsernameDraft(user?.username ?? '');
    setIsEditingUsername(false);
    setUsernameStatus('idle');
    setUsernameError(null);
  }, [user?.username]);

  useEffect(() => {
    setEmailDraft(user?.email ?? '');
    setIsEditingEmail(false);
    setEmailStatus('idle');
    setEmailError(null);
  }, [user?.email]);

  useEffect(() => () => {
    if (usernameResetTimer.current) clearTimeout(usernameResetTimer.current);
    if (emailResetTimer.current) clearTimeout(emailResetTimer.current);
  }, []);

  const triggerSuccess = useCallback((key: SuccessKey) => {
    setSuccessCounters((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  }, []);

  const validateUsername = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Username cannot be empty';
    if (trimmed.length < 2) return 'Username must be at least 2 characters';
    return null;
  }, []);

  const validateEmail = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Email cannot be empty';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return 'Enter a valid email address';
    return null;
  }, []);

  const validatePasswordForm = useCallback(() => {
    if (!currentPassword.trim()) return 'Enter your current password';
    if (newPassword.length < 8) return 'New password must be at least 8 characters';
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[^A-Za-z0-9\s]/.test(newPassword);
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
      return 'Password must include uppercase, lowercase, number, and special character';
    }
    if (newPassword !== confirmPassword) return 'Passwords do not match';
    if (newPassword === currentPassword) return 'Choose a different password';
    return null;
  }, [confirmPassword, currentPassword, newPassword]);

  useEffect(() => {
    if (usernameError) {
      const error = validateUsername(usernameDraft);
      if (!error) setUsernameError(null);
    }
  }, [usernameDraft, usernameError, validateUsername]);

  useEffect(() => {
    if (emailError) {
      const error = validateEmail(emailDraft);
      if (!error) setEmailError(null);
    }
  }, [emailDraft, emailError, validateEmail]);

  useEffect(() => {
    if (passwordError) {
      const error = validatePasswordForm();
      if (!error) setPasswordError(null);
    }
  }, [passwordError, validatePasswordForm]);

  const ensureMediaPermission = useCallback(async () => {
    if (mediaPermission?.granted) return true;
    const response = await requestMediaPermission();
    if (response?.granted) return true;
    Alert.alert('Permission needed', 'Please allow access to your photo library to pick an avatar.');
    return false;
  }, [mediaPermission?.granted, requestMediaPermission]);

  const buildAvatarFormData = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    if (!asset.uri) {
      throw new Error('Image file is missing a URI.');
    }

    const formData = new FormData();
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const extension = mimeType.split('/').pop() || 'jpg';
    const fileName = asset.fileName ?? `avatar.${extension}`;

    if (Platform.OS === 'web') {
      const response = await fetch(asset.uri);
      if (!response.ok) {
        throw new Error('Unable to read the selected file for upload.');
      }
      const blob = await response.blob();
      formData.append('file', blob, fileName);
    } else {
      formData.append('file', {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      } as any);
    }

    return formData;
  }, []);

  const handleUploadSelectedAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      if (!asset) return;
      if (!user) {
        Alert.alert('Unavailable', 'Sign in to update your avatar.');
        return;
      }

      try {
        setIsSavingAvatar(true);
        const formData = await buildAvatarFormData(asset);
        const { avatarUrl: uploadedUrl } = await uploadAvatar(formData);
        setPreviewUri(uploadedUrl);
        setUser({ ...user, avatarUrl: uploadedUrl });
        triggerSuccess('avatar');
      } catch (error) {
        console.error('Avatar upload error:', error);
        const message = error instanceof Error ? error.message : 'Could not update the avatar.';
        Alert.alert('Error', message);
      } finally {
        setIsSavingAvatar(false);
      }
    },
    [buildAvatarFormData, setUser, triggerSuccess, user]
  );

  const handlePickFromLibrary = useCallback(async () => {
    const allowed = await ensureMediaPermission();
    if (!allowed) return;
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled && result.assets && result.assets.length > 0) {
      handleUploadSelectedAsset(result.assets[0]);
    }
  }, [ensureMediaPermission, handleUploadSelectedAsset]);

  const handleResetAvatar = useCallback(async () => {
    if (!user) return;
    try {
      setIsResettingAvatar(true);
      try {
        const updatedUser = await resetAvatar();
        setUser(updatedUser);
        setPreviewUri(updatedUser.avatarUrl ?? null);
      } catch (apiError) {
        console.warn('Reset avatar API unavailable, falling back to local reset.', apiError);
        setUser({ ...user, avatarUrl: null });
        setPreviewUri(null);
      }
      triggerSuccess('avatar');
    } catch (error) {
      console.error('Reset avatar error:', error);
      Alert.alert('Error', 'Could not reset the avatar.');
    } finally {
      setIsResettingAvatar(false);
    }
  }, [setUser, triggerSuccess, user]);

  const handleCopy = useCallback(async (label: string, value: string | null | undefined) => {
    if (!value) {
      Alert.alert('Unavailable', `${label} is not available yet.`);
      return;
    }
    await Clipboard.setStringAsync(value);
    Alert.alert('Copied', `${label} copied to the clipboard.`);
  }, []);

  const handleSaveUsername = useCallback(async () => {
    if (!user) {
      Alert.alert('Unavailable', 'Sign in to update your profile.');
      return;
    }

    const issue = validateUsername(usernameDraft);
    setUsernameError(issue);
    if (issue) return;

    const trimmed = usernameDraft.trim();
    if (trimmed === (user.username ?? '')) {
      setIsEditingUsername(false);
      return;
    }

    try {
      setUsernameStatus('saving');
      const updatedUser = await updateUsername({ username: trimmed });
      setUser(updatedUser);
      setUsernameStatus('success');
      setIsEditingUsername(false);
      if (usernameResetTimer.current) clearTimeout(usernameResetTimer.current);
      usernameResetTimer.current = setTimeout(() => setUsernameStatus('idle'), 1600);
    } catch (error) {
      console.error('Username update failed:', error);
      const message = error instanceof Error ? error.message : 'Could not update the username.';
      Alert.alert('Error', message);
      setUsernameStatus('idle');
    }
  }, [setUser, user, usernameDraft, validateUsername]);

  const handleSaveEmail = useCallback(async () => {
    if (!user) {
      Alert.alert('Unavailable', 'Sign in to update your profile.');
      return;
    }

    const issue = validateEmail(emailDraft);
    setEmailError(issue);
    if (issue) return;

    const trimmed = emailDraft.trim();
    if (trimmed.toLowerCase() === (user.email ?? '').toLowerCase()) {
      setIsEditingEmail(false);
      return;
    }

    try {
      setEmailStatus('saving');
      const updatedUser = await updateEmail({ email: trimmed });
      setUser(updatedUser);
      setEmailStatus('success');
      setIsEditingEmail(false);
      if (emailResetTimer.current) clearTimeout(emailResetTimer.current);
      emailResetTimer.current = setTimeout(() => setEmailStatus('idle'), 1600);
    } catch (error) {
      console.error('Email update failed:', error);
      const message = error instanceof Error ? error.message : 'Could not update the email.';
      Alert.alert('Error', message);
      setEmailStatus('idle');
    }
  }, [emailDraft, setUser, user, validateEmail]);

  const handleChangePassword = useCallback(async () => {
    if (!user) {
      Alert.alert('Unavailable', 'Sign in to change your password.');
      return;
    }

    const error = validatePasswordForm();
    if (error) {
      setPasswordError(error);
      return;
    }
    setPasswordError(null);

    try {
      setIsChangingPassword(true);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      triggerSuccess('password');
    } catch (err) {
      console.error('Password change failed:', err);
      const message = err instanceof Error ? err.message : 'Could not change the password.';
      Alert.alert('Error', message);
    } finally {
      setIsChangingPassword(false);
    }
  }, [changePassword, confirmPassword, currentPassword, newPassword, triggerSuccess, user, validatePasswordForm]);

  const handleLogout = useCallback(() => {
    logout()
      .then(() => router.replace({ pathname: '/' }))
      .catch(() => Alert.alert('Error', 'Could not log out. Please try again.'));
  }, [logout, router]);

  const isResetDisabled = isResettingAvatar || (!user?.avatarUrl && !previewUri);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 }) ?? 0}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: 'white' }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32, backgroundColor: 'white' }}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenContainer>
            <YStack gap="$3" pb="$6">
              <SectionCard
                title="Avatar"
                icon={<Upload size={18} color="$gray11" />}
                successTrigger={successCounters.avatar}
              >
                <YStack ai="center" gap="$3">
                  <UserAvatar
                    uri={previewUri ?? undefined}
                    label={(displayName || 'Guest').slice(0, 1).toUpperCase()}
                    size={96}
                    textSize={34}
                  />
                  <Text fontSize={12} color="$gray10">
                    Uploaded avatars are delivered via our CDN and refresh instantly.
                  </Text>
                  <XStack gap="$2" w="100%">
                    <Button
                      flex={1}
                      size="$3"
                      bg="$green9"
                      color="white"
                      icon={<Upload size={18} color="white" />}
                      disabled={isSavingAvatar}
                      onPress={handlePickFromLibrary}
                    >
                      {isSavingAvatar ? 'Uploading...' : 'Upload from phone'}
                    </Button>
                    <Button
                      flex={1}
                      size="$3"
                      variant="outlined"
                      icon={<RotateCcw size={18} color="$gray11" />}
                      disabled={isResetDisabled}
                      onPress={handleResetAvatar}
                    >
                      {isResettingAvatar ? 'Resetting...' : 'Reset avatar'}
                    </Button>
                  </XStack>
                </YStack>
              </SectionCard>

              <SectionCard title="User information" icon={<UserIcon size={18} color="$gray11" />}>
                <EditableFieldRow
                  label="Username"
                  value={user?.username ?? ''}
                  draft={usernameDraft}
                  setDraft={setUsernameDraft}
                  placeholder="Enter a new username"
                  isEditing={isEditingUsername}
                  onStartEdit={() => setIsEditingUsername(true)}
                  onCancelEdit={() => {
                    setUsernameDraft(user?.username ?? '');
                    setIsEditingUsername(false);
                    setUsernameError(null);
                  }}
                  onSave={handleSaveUsername}
                  status={usernameStatus}
                  error={usernameError}
                  onCopy={() => handleCopy('Username', user?.username)}
                />
                <Separator />
                <EditableFieldRow
                  label="Email"
                  value={user?.email ?? ''}
                  draft={emailDraft}
                  setDraft={setEmailDraft}
                  placeholder="Enter a new email"
                  isEditing={isEditingEmail}
                  onStartEdit={() => setIsEditingEmail(true)}
                  onCancelEdit={() => {
                    setEmailDraft(user?.email ?? '');
                    setIsEditingEmail(false);
                    setEmailError(null);
                  }}
                  onSave={handleSaveEmail}
                  status={emailStatus}
                  error={emailError}
                  onCopy={() => handleCopy('Email', user?.email)}
                  textInputProps={{ keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false }}
                />
                <Separator />
                <InfoRow label="User ID" value={userId || 'N/A'} onCopy={() => handleCopy('User ID', userId)} />
              </SectionCard>

              <SectionCard
                title="Change password"
                icon={<Lock size={18} color="$gray11" />}
                successTrigger={successCounters.password}
              >
                <YStack gap="$3">
                  <PasswordInput
                    label="Current password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    textInputProps={{ returnKeyType: 'next' }}
                  />
                  <PasswordInput
                    label="New password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    textInputProps={{ returnKeyType: 'next' }}
                  />
                  <Text fontSize={12} color="$gray10">
                    Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol.
                  </Text>
                  <PasswordInput
                    label="Confirm new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    error={passwordError || undefined}
                    textInputProps={{ returnKeyType: 'done' }}
                  />
                  <Button
                    size="$3"
                    bg="$green9"
                    color="white"
                    disabled={isChangingPassword}
                    onPress={handleChangePassword}
                  >
                    {isChangingPassword ? 'Updating...' : 'Change password'}
                  </Button>
                </YStack>
              </SectionCard>

              <Button
                size="$3"
                bg="$red4"
                color="$red11"
                hoverStyle={{ bg: '$red5' }}
                pressStyle={{ bg: '$red6' }}
                icon={<LogOut size={18} color="$red11" />}
                onPress={handleLogout}
              >
                Log out
              </Button>
            </YStack>
          </ScreenContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

