import { View, Text } from 'react-native';
import { commonStyles } from '../../src/shared/ui/styles';

export default function HomeScreen() {
  return (
    <View style={commonStyles.centerContainer}>
      <Text style={commonStyles.title}>Receipt Splitter</Text>
      <Text style={commonStyles.subtitle}>
        SDK 53 + Собственные стили ✨
      </Text>
    </View>
  );
}