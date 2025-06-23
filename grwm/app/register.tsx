import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { router } from 'expo-router';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: 'exp://10.254.',
      }
     });
    if (error) {
      setError(error.message);
    } else if (data.user && !data.session) {
      router.push('/check-email');
    }
    setLoading(false);
  }

 return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.header}>Criar Conta</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        disabled={loading}
      />
      <TextInput
        label="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        disabled={loading}
      />
      
      {error && <HelperText type="error" visible={!!error}>{error}</HelperText>}

      <Button
        mode="contained"
        onPress={handleRegister}
        disabled={loading}
        style={styles.button}
      >
        {loading ? 'Criando conta...' : 'Cadastrar'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { textAlign: 'center', marginBottom: 24 },
  input: { marginBottom: 16 },
  button: { marginTop: 8 },
});