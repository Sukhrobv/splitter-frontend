import { View, Text } from 'react-native';
import { commonStyles } from '../../shared/ui/styles';

export default function ExploreScreen() {
  return (
    <View style={commonStyles.centerContainer}>
      <Text style={commonStyles.title}>Explore</Text>
      <Text style={commonStyles.subtitle}>Второй экран</Text>
    </View>
  );
}