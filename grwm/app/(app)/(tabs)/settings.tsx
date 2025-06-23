import { View, Text, StyleSheet } from 'react-native';
import { useSession } from '../../../ctx';


export default function Tab() {
    const { signOut } = useSession();
  return (
    <View style={styles.container}>
                <Text
            onPress={() => {
              signOut();
            }}>
            Sign Out
          </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});