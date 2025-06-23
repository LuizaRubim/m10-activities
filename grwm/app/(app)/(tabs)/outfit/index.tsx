import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';



export default function Tab() {
  return (
     <View style={styles.container}>
          <Link href="outfit/clothes">Montar outfit</Link>
          <Link href="outfit/clothes">Vai na sorte!</Link>
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