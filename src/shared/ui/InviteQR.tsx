// src/shared/ui/InviteQR.tsx
import React from 'react';
import { YStack, Paragraph, Card, Text } from 'tamagui';
import QRCode from 'react-native-qrcode-svg';

type Props = {
  url: string;
  title?: string;
  expiresAt?: string; // ISO
  caption?: string;
};

export function InviteQR({ url, title, expiresAt, caption }: Props) {
  return (
    <YStack ai="center" gap="$3">
      {!!title && (
        <Paragraph fow="700" fos="$6">
          {title}
        </Paragraph>
      )}

      <Card
        bordered
        elevate={false}
        bw={1}
        bc="$gray5"
        br="$4"
        p="$4"
        bg="$color1"
      >
        <QRCode value={url} size={260} ecl="M" />
      </Card>

      <YStack ai="center" gap="$1">
        <Paragraph col="$gray10" size="$2">
          {caption ?? 'Valid for a limited time'}
        </Paragraph>
        {!!expiresAt && (
          <Text color="$gray10" fontSize={12}>
            Expires: {new Date(expiresAt).toLocaleString()}
          </Text>
        )}
      </YStack>
    </YStack>
  );
}
