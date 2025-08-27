import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { XStack } from 'tamagui';
import { Eye, EyeOff } from '@tamagui/lucide-icons';
import { Input } from '@/shared/ui/Input';

type Props = {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (t: string) => void;
  error?: string;
  required?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  textInputProps?: any; // дополнительные пропсы TextInput при необходимости
};

export default function PasswordInput({
  label,
  placeholder = 'Enter your password',
  value,
  onChangeText,
  error,
  required,
  autoCapitalize = 'none',
  textInputProps,
}: Props) {
  const [show, setShow] = useState(false);

  const eye = (
    <Pressable
      onPress={() => setShow(s => !s)}
      hitSlop={6}
      android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="button"
      accessibilityLabel={show ? 'Hide password' : 'Show password'}
    >
      {show ? <EyeOff size={18} color="rgba(0,0,0,0.7)" /> : <Eye size={18} color="rgba(0,0,0,0.7)" />}
    </Pressable>
  );

  return (
    <XStack w="100%">
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!show}
        autoCapitalize={autoCapitalize}
        error={error}
        required={required}
        rightAdornment={eye}
        // по умолчанию глушим подсказки автозаполнения, можно переопределить через textInputProps
        textInputProps={{
          autoComplete: 'off',         // Android/iOS
          textContentType: 'none',     // iOS
          importantForAutofill: 'no',  // Android
          ...textInputProps,
        }}
      />
    </XStack>
  );
}
