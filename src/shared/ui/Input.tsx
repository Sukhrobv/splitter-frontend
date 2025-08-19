// src/shared/ui/Input.tsx
import React from 'react'
import { Input as TamaguiInput, YStack, Text } from 'tamagui'

interface CustomInputProps {
  label?: string
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
  error?: string
  required?: boolean
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
}

export const Input: React.FC<CustomInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  required = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}) => {
  return (
    <YStack space="$2">
      {label && (
        <Text fontSize="$3" fontWeight="600" color="$gray11">
          {label}
          {required && <Text color="$red10"> *</Text>}
        </Text>
      )}
      <TamaguiInput
        borderRadius="$4"
        borderWidth={1}
        borderColor={error ? '$red8' : '$gray7'}
        backgroundColor="$white1"
        height="$4"
        paddingHorizontal="$4"
        fontSize="$4"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        focusStyle={{
          borderColor: error ? '$red8' : '$green9',
        }}
      />
      {error && (
        <Text fontSize="$3" color="$red10">
          {error}
        </Text>
      )}
    </YStack>
  )
}