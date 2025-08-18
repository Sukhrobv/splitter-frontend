import { Link } from 'expo-router';
import { View, Text, Button } from 'react-native';

export default function WelcomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Welcome</Text>
      <Link href="/(auth)/login" asChild>
        <Button title="Login" />
      </Link>
      <Link href="/(auth)/register" asChild>
        <Button title="Register" />
      </Link>
    </View>
  );
}
