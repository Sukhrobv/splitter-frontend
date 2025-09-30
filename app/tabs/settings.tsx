import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { YStack, Text, Button, Separator, XStack } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenContainer } from '@/shared/ui/ScreenContainer';
import Input from '@/shared/ui/Input';
import PasswordInput from '@/shared/ui/PasswordInput';
import { useAppStore } from '@/shared/lib/stores/app-store';
import { changePassword, updateUsername } from '@/features/auth/api';

export default function SettingsScreen() {
  const { user, setUser } = useAppStore();
  const isLoggedIn = !!user;

  const [usernameValue, setUsernameValue] = useState(user?.username ?? '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setUsernameValue(user?.username ?? '');
  }, [user?.username]);

  const usernameDirty = useMemo(() => {
    const trimmed = usernameValue.trim();
    return trimmed.length > 0 && trimmed !== (user?.username ?? '').trim();
  }, [usernameValue, user?.username]);

  const validateUsername = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Username cannot be empty';
    if (trimmed.length < 2) return 'Username must be at least 2 characters';
    return null;
  };

  const validatePasswordForm = () => {
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
  };

  const handleSaveUsername = async () => {
    if (!isLoggedIn) {
      Alert.alert('Unavailable', 'Sign in to update your username.');
      return;
    }

    const error = validateUsername(usernameValue);
    if (error) {
      setUsernameError(error);
      return;
    }
    setUsernameError(null);

    const trimmed = usernameValue.trim();

    try {
      setIsUpdatingUsername(true);
      const updatedUser = await updateUsername({ username: trimmed });
      setUser(updatedUser);
      Alert.alert('Success', 'Username updated.');
    } catch (error) {
      console.error('Username update failed:', error);
      const message = error instanceof Error ? error.message : 'Could not update the username.';
      Alert.alert('Error', message);
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleChangePassword = async () => {
    if (!isLoggedIn) {
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
      Alert.alert('Password updated', 'Your password has been changed.');
    } catch (error) {
      console.error('Password change failed:', error);
      const message = error instanceof Error ? error.message : 'Could not change the password.';
      Alert.alert('Error', message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  useEffect(() => {
    if (usernameError && usernameValue.trim().length >= 2) {
      setUsernameError(null);
    }
  }, [usernameError, usernameValue]);

  useEffect(() => {
    if (passwordError) {
      const err = validatePasswordForm();
      if (!err) setPasswordError(null);
    }
  }, [currentPassword, newPassword, confirmPassword, passwordError]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 }) ?? 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenContainer>
            <YStack gap="$5">
              <YStack gap="$3" mt="$4">
                <Text fontSize={20} fontWeight="700">
                  Account settings
                </Text>
                <Text color="$gray10">
                  Update your username and password using the forms below.
                </Text>
              </YStack>

              <YStack gap="$3">
                <Text fontSize={16} fontWeight="600">Username</Text>
                <Input
                  value={usernameValue}
                  onChangeText={setUsernameValue}
                  placeholder="Enter a new username"
                  textInputProps={{ autoCapitalize: 'none', autoCorrect: false }}
                  error={usernameError || undefined}
                />
                <XStack gap="$2">
                  <Button
                    flex={1}
                    size="$3"
                    bg="$green9"
                    color="white"
                    disabled={!usernameDirty || isUpdatingUsername}
                    onPress={handleSaveUsername}
                  >
                    {isUpdatingUsername ? 'Saving...' : 'Save username'}
                  </Button>
                  <Button
                    size="$3"
                    variant="outlined"
                    disabled={!usernameDirty}
                    onPress={() => setUsernameValue(user?.username ?? '')}
                  >
                    Reset
                  </Button>
                </XStack>
              </YStack>

              <Separator />

              <YStack gap="$3">
                <Text fontSize={16} fontWeight="600">Password</Text>
                <PasswordInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Current password"
                  textInputProps={{ returnKeyType: 'next' }}
                />
                <PasswordInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password"
                  textInputProps={{ returnKeyType: 'next' }}
                />
                <Text fontSize={12} color="$gray10">
                  Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol.
                </Text>
                <PasswordInput
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
            </YStack>
          </ScreenContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

