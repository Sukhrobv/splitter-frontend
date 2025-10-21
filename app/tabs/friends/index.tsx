import React, { useEffect, useState, useMemo } from 'react';
import { YStack, XStack, Paragraph, Input, ScrollView, Spinner, Separator, Text } from 'tamagui';
import { useRouter } from 'expo-router';
import { Search } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';
import { useFriendsStore } from '@/features/friends/model/friends.store';
import { FriendListItem } from '@/features/friends/ui/FriendListItem';
import Fab from '@/shared/ui/Fab';
import { ScreenContainer } from '@/shared/ui/ScreenContainer';

export default function FriendsScreen() {
  const { friends, loading, error, fetchAll } = useFriendsStore();
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredFriends = useMemo(() => {
    if (!searchQuery) {
      return friends;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return friends.filter(friend => {
      const title = (
        friend?.user?.displayName || friend?.user?.username || ''
      ).toLowerCase();
      const uniqueId = (friend?.user?.uniqueId || friend?.uniqueId || '').toLowerCase();
      return title.includes(lowerCaseQuery) || uniqueId.includes(lowerCaseQuery);
    });
  }, [friends, searchQuery]);

  if (loading && friends.length === 0) {
    return (
      <ScreenContainer>
        <Spinner size="large" color="$gray10" />
      </ScreenContainer>
    );
  }

  return (
    <YStack f={1} bg="$background">
      <YStack f={1} p="$4">
        {/* Search Input */}
        <XStack position="relative" ai="center" mb="$4">
          <Input
            placeholder={t('friends.searchPlaceholder', 'Search friends...')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            f={1}
            h={40}
            pl={40}
            borderRadius={10}
            bg="$backgroundPress"
            borderWidth={0}
          />
          <Search 
            size={20} 
            color="$gray10" 
            position="absolute"
            left={12}
            pointerEvents="none"
          />
        </XStack>

        {error && <Paragraph col="$red10" p="$4">{error}</Paragraph>}
        
        <ScrollView f={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {filteredFriends.length > 0 && (
            <YStack borderWidth={1} borderColor="$gray5" borderRadius={8} overflow="hidden">
              {filteredFriends.map((f, index) => (
                <React.Fragment key={f.user?.id ?? f.userId ?? f.id}>
                  <FriendListItem friend={f} />
                  {index < filteredFriends.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </YStack>
          )}
          
          {filteredFriends.length === 0 && !loading && (
             <Paragraph ta="center" col="$gray10" mt="$4">
                {searchQuery
                  ? t('friends.search.noResults', 'No friends found')
                  : t('friends.empty', 'No friends yet. Tap + to add.')
                }
              </Paragraph>
          )}
        </ScrollView>
      </YStack>

      <Fab onPress={() => router.push('/tabs/friends/requests')} />
    </YStack>
  );
}
