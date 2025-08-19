import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';

// Check if we're in a secure storage supported environment
const isSecureStoreAvailable = () => {
  try {
    // SecureStore is available on iOS and Android, but not on web
    return Platform.OS !== 'web' && SecureStore.isAvailableAsync !== undefined;
  } catch {
    return false;
  }
};

export const saveToken = async (token: string): Promise<void> => {
  try {
    if (isSecureStoreAvailable()) {
      // Use SecureStore on mobile
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      // Use AsyncStorage on web or as fallback
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
    console.log('✅ Token saved successfully');
  } catch (error) {
    console.error('❌ Failed to save token:', error);
    throw error;
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    if (isSecureStoreAvailable()) {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } else {
      return await AsyncStorage.getItem(TOKEN_KEY);
    }
  } catch (error) {
    console.error('❌ Failed to get token:', error);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    if (isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    console.log('✅ Token removed successfully');
  } catch (error) {
    console.error('❌ Failed to remove token:', error);
    throw error;
  }
};