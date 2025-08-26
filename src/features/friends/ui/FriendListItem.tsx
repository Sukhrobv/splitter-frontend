import { memo } from 'react';
import { XStack, YStack, Paragraph, Button } from 'tamagui';

/**
 * Компонент терпимо относится к "сырой" форме друга:
 * - friend.user?.displayName / friend.user?.username
 * - friend.username / friend.displayName
 * - friend.user?.uniqueId / friend.uniqueId
 * - fallback: "User #<id>"
 */
type Props = {
  friend: any;                 // уточним тип, когда бэк зафиксирует контракт
  onRemove?: () => void;
};

function pickTitle(f: any) {
  return (
    f?.user?.displayName ||
    f?.user?.username ||
    f?.displayName ||
    f?.username ||
    f?.user?.uniqueId ||
    f?.uniqueId ||
    (typeof (f?.userId ?? f?.id) === 'number' ? `User #${f.userId ?? f.id}` : '—')
  );
}

function pickSubtitle(f: any, title: string) {
  const sub =
    f?.user?.uniqueId ||
    f?.uniqueId ||
    f?.user?.email ||
    f?.email ||
    '';

  // если сабтайтл совпал с тайтлом — не дублируем
  return sub && sub !== title ? sub : '';
}

export const FriendListItem = memo(function FriendListItem({ friend, onRemove }: Props) {
  const title = pickTitle(friend);
  const subtitle = pickSubtitle(friend, title);

  return (
    <XStack ai="center" jc="space-between" p="$3" br="$4" bc="$backgroundFocus" gap="$3">
      <YStack>
        <Paragraph fow="600">{title}</Paragraph>
        {!!subtitle && <Paragraph size="$2" col="$gray10">{subtitle}</Paragraph>}
      </YStack>

      {onRemove && (
        <Button size="$2" theme="red" onPress={onRemove}>
          Remove
        </Button>
      )}
    </XStack>
  );
});
