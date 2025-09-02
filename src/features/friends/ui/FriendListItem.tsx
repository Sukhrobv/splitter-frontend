import { memo } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { XStack, YStack, Paragraph, Button, Text, Circle } from 'tamagui';
import { Trash2 } from '@tamagui/lucide-icons';
import { useFriendsStore } from '../model/friends.store';

function pickTitle(f: any) {
  return (
    f?.user?.displayName ||
    f?.user?.username ||
    f?.displayName ||
    f?.username ||
    `User #${f.user?.id ?? f.userId ?? f.id}`
  );
}

function pickUniqueId(f: any): string | undefined {
  return f?.user?.uniqueId ?? f?.uniqueId ?? undefined;
}

function pickSubtitle(f: any) {
  const uniqueId = pickUniqueId(f);
  return uniqueId ? `@${uniqueId.toLowerCase().replace('user#', 'user')}` : '';
}

export const FriendListItem = memo(function FriendListItem({ friend }: { friend: any }) {
  const { remove } = useFriendsStore(); // expect: remove(uniqueId: string)
  const { t } = useTranslation();
  const title = pickTitle(friend);
  const subtitle = pickSubtitle(friend);
  const uniqueId = pickUniqueId(friend);

const handleRemove = () => {
  const uniqueId = friend?.user?.uniqueId ?? friend?.uniqueId;
  if (!uniqueId) return;

  Alert.alert(
    t('friends.remove', 'Remove friend'),
    `Are you sure you want to remove ${title}?`,
    [
      { text: t('common.cancel', 'Cancel'), style: 'cancel' },
      {
        text: t('friends.remove', 'Remove'),
        style: 'destructive',
        onPress: () => remove(uniqueId), // <-- теперь строка
      },
    ]
  );
};

  return (
    <XStack h={60} ai="center" jc="space-between" px="$4" bg="$background">
      <XStack ai="center" gap="$3">
        <Circle size={36} backgroundColor="$gray5" />
        <YStack>
          <Text fontSize={17} fontWeight="600">{title}</Text>
          {!!subtitle && <Paragraph fontSize={14} color="$gray10">{subtitle}</Paragraph>}
        </YStack>
      </XStack>

      <Button
        icon={<Trash2 size={20} color="$red10" />}
        chromeless
        circular
        onPress={handleRemove}
        pressStyle={{ bg: '$red3' }}
        disabled={!uniqueId} // safety: hide action if no uniqueId
      />
    </XStack>
  );
});
