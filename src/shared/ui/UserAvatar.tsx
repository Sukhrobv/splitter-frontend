import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { View, Text } from 'tamagui';

interface UserAvatarProps {
  uri?: string | null;
  label: string;
  size?: number;
  textSize?: number;
  backgroundColor?: string;
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});

export function UserAvatar({
  uri,
  label,
  size = 48,
  textSize,
  backgroundColor = '$gray5',
}: UserAvatarProps) {
  const radius = size / 2;

  return (
    <View
      w={size}
      h={size}
      br={radius}
      overflow="hidden"
      ai="center"
      jc="center"
      backgroundColor={backgroundColor}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      ) : (
        <Text fontSize={textSize ?? Math.round(size / 2.5)} fontWeight="700">
          {label}
        </Text>
      )}
    </View>
  );
}

export default UserAvatar;
