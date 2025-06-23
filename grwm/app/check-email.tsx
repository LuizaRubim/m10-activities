import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function CheckEmailScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Avatar.Icon size={80} icon="email-check-outline" style={styles.icon} />
      <Text variant="headlineSmall" style={styles.title}>
        Verifique seu e-mail
      </Text>
      <Text style={styles.message}>
        Enviamos um link de confirmação para o seu endereço de e-mail. Por favor, clique no link para ativar sua conta e fazer login.
      </Text>
      <Button
        mode="contained"
        onPress={() => router.replace('/sign-in')} // Leva o usuário de volta para o login
        style={styles.button}
      >
        Voltar para o Login
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  icon: {
    backgroundColor: 'transparent',
  },
  title: {
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    width: '80%',
  },
});