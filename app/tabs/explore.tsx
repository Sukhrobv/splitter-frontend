// app/tabs/explore.tsx - исправленная версия
import React, { useState } from 'react'
import { YStack, Text, XStack } from 'tamagui'
import { Button } from '../../src/shared/ui/Button'
import { Input } from '../../src/shared/ui/Input'
import { Card } from '../../src/shared/ui/Card'
import { ScreenContainer } from '../../src/shared/ui/ScreenContainer'

export default function ExploreScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('Email is required')
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      setEmailError('Please enter a valid email')
    } else {
      setEmailError('')
    }
  }

  const handleSignIn = () => {
    console.log('Sign in pressed')
  }

  const handleRegister = () => {
    console.log('Register pressed')
  }

  const handleForgot = () => {
    console.log('Forgot pressed')
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <YStack space="$4" marginBottom="$6" alignItems="center">
        <Text 
          fontSize="$8" 
          fontWeight="bold" 
          color="$gray12"
        >
          Receipt Splitter
        </Text>
        <Text 
          fontSize="$4" 
          color="$gray10"
        >
          Design System Test
        </Text>
      </YStack>

      {/* Login Card */}
      <Card>
        <YStack space="$4">
          <Text fontSize="$6" fontWeight="bold" color="$gray12">
            Sign In
          </Text>
          
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text)
              validateEmail(text)
            }}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />
          
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            required
          />
        </YStack>
      </Card>

      {/* Buttons Section */}
      <YStack space="$3" marginTop="$4" marginBottom="$4">
        <Button 
          title="Sign In" 
          variant="primary"
          size="large"
          onPress={handleSignIn}
        />
        
        <XStack space="$3">
          <YStack flex={1}>
            <Button 
              title="Register" 
              variant="secondary"
              onPress={handleRegister}
            />
          </YStack>
          <YStack flex={1}>
            <Button 
              title="Forgot?" 
              variant="outline"
              onPress={handleForgot}
            />
          </YStack>
        </XStack>
      </YStack>

      {/* Features Card */}
      <Card>
        <YStack space="$3">
          <Text fontSize="$5" fontWeight="bold" color="$gray12">
            Features
          </Text>
          
          <YStack space="$2">
            <Text fontSize="$3" color="$gray11">📸 Scan receipts with camera</Text>
            <Text fontSize="$3" color="$gray11">👥 Split bills with friends</Text>
            <Text fontSize="$3" color="$gray11">💰 Calculate who owes what</Text>
            <Text fontSize="$3" color="$gray11">📤 Share results instantly</Text>
          </YStack>
        </YStack>
      </Card>

      {/* Status */}
      <Text 
        fontSize="$3" 
        textAlign="center" 
        color="$green10" 
        marginTop="$4"
        fontWeight="600"
      >
        ✅ Tamagui Design System is working!
      </Text>
    </ScreenContainer>
  )
}