// src/shared/ui/Card.tsx
import React from 'react'
import { YStack } from 'tamagui'

interface CardProps {
  children: React.ReactNode
  padding?: string
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = '$4'
}) => {
  return (
    <YStack
      backgroundColor="$white1"
      borderRadius="$6"
      borderWidth={1}
      borderColor="$gray5"
      padding={padding}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={8}
      elevation={3}
    >
      {children}
    </YStack>
  )
}
