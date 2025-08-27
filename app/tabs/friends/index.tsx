import { YStack, XStack, Paragraph, Button, Separator, Spinner } from 'tamagui'
import { useEffect } from 'react'
import { useFriendsStore } from '@/features/friends/model/friends.store'
import { FriendListItem } from '../../../src/features/friends/ui/FriendListItem'


export default function FriendsScreen() {
const { friends, loading, fetchAll } = useFriendsStore()
useEffect(() => { fetchAll() }, [])
if (loading) return <Spinner />
return (
<YStack f={1} p="$4" gap="$3">
{friends.length === 0 ? (
<Paragraph ta="center">No friends yet. Tap + to add.</Paragraph>
) : (
friends.map(f => (
<FriendListItem key={f.id} friend={f} />
))
)}
</YStack>
)
}