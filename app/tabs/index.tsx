import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAppStore } from '../../src/shared/lib/stores/app-store';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { theme, language, user, setTheme, setLanguage, logout } = useAppStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...');
      await logout();
      console.log('✅ Logged out successfully');
      router.replace('/');
    } catch (error) {
      console.error('❌ Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Logout?',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: handleLogout },
      ]
    );
  };

  const containerStyle = {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#ffffff',
    padding: 20,
  };

  const titleStyle = {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#1F2937',
    marginBottom: 8,
  };

  const subtitleStyle = {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 30,
  };

  const buttonStyle = {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 160,
    alignItems: 'center' as const,
  };

  const logoutButtonStyle = {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 30,
    minWidth: 160,
    alignItems: 'center' as const,
  };

  const buttonTextStyle = {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  };

  const userInfoStyle = {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%' as const,
    maxWidth: 300,
  };

  return (
    <View style={containerStyle}>
      <Text style={titleStyle}>Receipt Splitter</Text>
      <Text style={subtitleStyle}>Welcome!</Text>
      
      {/* User info */}
      {user && (
        <View style={userInfoStyle}>
          <Text style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>
            👤 {user.username}
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>
            📧 {user.email}
          </Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
            ID: {user.uniqueId}
          </Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={buttonStyle}
        onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      >
        <Text style={buttonTextStyle}>
          Theme: {theme}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={buttonStyle}
        onPress={() => setLanguage(language === 'en' ? 'ja' : language === 'ja' ? 'ru' : 'en')}
      >
        <Text style={buttonTextStyle}>
          Language: {language}
        </Text>
      </TouchableOpacity>

      {/* Logout button */}
      <TouchableOpacity 
        style={logoutButtonStyle}
        onPress={confirmLogout}
      >
        <Text style={buttonTextStyle}>
          🚪 Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}