import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { XStack, Paragraph, Button } from 'tamagui';

type Props = { label?: string; value: string };

export default function CopyText({ label = 'ID', value }: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <XStack ai="center" gap="$2">
      <Paragraph fow="600">{label}:</Paragraph>
      <Paragraph selectable size="$2">{value}</Paragraph>
      <Button size="$2" onPress={onCopy}>{copied ? 'Copied!' : 'Copy'}</Button>
    </XStack>
  );
}
