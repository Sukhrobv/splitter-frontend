import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAppStore } from '../../src/shared/lib/stores/app-store';

export default function HomeScreen() {
  const { theme, language, setTheme, setLanguage } = useAppStore();

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

  const buttonTextStyle = {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  };

  return (
    <View style={containerStyle}>
      <Text style={titleStyle}>Receipt Splitter</Text>
      <Text style={subtitleStyle}>SDK 53 + Zustand Working!</Text>
      
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
        onPress={() => setLanguage(language === 'en' ? 'ja' : 'en')}
      >
        <Text style={buttonTextStyle}>
          Language: {language}
        </Text>
      </TouchableOpacity>
    </View>
  );
}