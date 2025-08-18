import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { commonStyles } from '@/shared/ui/styles';

export default function WelcomeScreen() {
  return (
    <View style={commonStyles.centerContainer}>
      <Text style={commonStyles.title}>Welcome</Text>
      <View style={commonStyles.buttonContainer}>
        <Link href="/login" asChild>
          <TouchableOpacity style={commonStyles.button}>
            <Text style={commonStyles.buttonText}>Login</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/register" asChild>
          <TouchableOpacity style={commonStyles.button}>
            <Text style={commonStyles.buttonText}>Register</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
