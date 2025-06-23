import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function DetailsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Esta é a tela de Detalhes!</Text>
      <Text>O Stack Navigator adiciona o botão "voltar" automaticamente.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18 },
});