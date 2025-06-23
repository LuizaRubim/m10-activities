import { Link } from 'expo-router';
import { Button, View } from 'react-native';

import { useSession } from '../ctx';

export default function SignIn() {
  const { signIn } = useSession();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Link href="/outfit" asChild>
        <Button title="Sign In" onPress={signIn} />
      </Link>
    </View>
  );
}
