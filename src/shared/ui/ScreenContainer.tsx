// src/shared/ui/ScreenContainer.tsx
import React from 'react'
import { YStack } from 'tamagui'

interface ScreenContainerProps {
  children: React.ReactNode
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children
}) => {
  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingHorizontal="$4"
      paddingTop="$6"
      paddingBottom="$4"
    >
      {children}
    </YStack>
  )
}