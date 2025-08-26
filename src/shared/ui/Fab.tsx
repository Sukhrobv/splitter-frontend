import { Button } from 'tamagui';
import { StyleSheet } from 'react-native';

type Props = { onPress: () => void; label?: string };
export default function Fab({ onPress, label = '+' }: Props) {
  return (
    <Button
      onPress={onPress}
      size="$4"
      circular
      position="absolute"
      style={styles.fab}
      aria-label="Add"
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  fab: { right: 16, bottom: 24, elevation: 3 }
});
