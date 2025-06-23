import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert,
  ScrollView, // Para permitir a rolagem
  KeyboardAvoidingView, // Para evitar que o teclado cubra os inputs
  Platform,
 } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, ActivityIndicator, Avatar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

import { supabase } from '../../../services/supabase';

export default function AddPieceScreen() {
  const router = useRouter();

  // Estados do Formulário (sem alteração)
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'top' | 'bottom' | 'shoes' | 'accessories' | ''>('');
  const [loading, setLoading] = useState(false);

  // --- MUDANÇA 1: Duas funções separadas para pegar a imagem ---

  // Função para selecionar uma imagem da galeria
  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Função para tirar uma foto com a câmera
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Função de envio do formulário (sem alteração na lógica interna)
  const handleAddPiece = async () => {
    if (!imageUri || !name || !category) {
      Alert.alert('Campos obrigatórios', 'Por favor, adicione uma imagem, nome e categoria.');
      return;
    }
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');
      console.log('Usuário para upload:', user);
      
      if (userError || !user) {
        throw new Error(userError?.message || 'Usuário não autenticado. Faça login novamente.');
      }
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
      const filePath = `${user.id}/${new Date().getTime()}.png`;
      const contentType = 'image/png';
      
      const { error: uploadError } = await supabase.storage
        .from('clothing-images')
        .upload(filePath, decode(base64), { contentType });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('clothing-images').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('clothes').insert({
        user_id: user.id, name, brand, description, category, image_url: publicUrl,
      });
      if (insertError) throw insertError;

      await supabase.from('notifications').insert({
        user_id: user.id, title: 'Nova peça adicionada!', message: `Sua peça "${name}" foi adicionada com sucesso.`,
      });

      setName('');
      setBrand('');
      setDescription('');
      setCategory('');
      setImageUri(null);

      Alert.alert('Sucesso!', 'Sua nova peça de roupa foi adicionada.');
      router.push('/outfit');

    } catch (error: any) {
      console.error('Erro ao adicionar peça:', error);
      Alert.alert('Erro', error.message || 'Não foi possível adicionar a peça.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={80} // Ajuste fino opcional
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled" // Melhora a experiência de clicar em botões com o teclado aberto
      >        
        <View style={styles.imagePicker}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <Avatar.Icon size={80} icon="image-outline" style={{ backgroundColor: 'transparent' }} color="#888" />
          )}
        </View>
        
        <View style={styles.buttonActionsContainer}>
          <Button icon="image-multiple" mode="outlined" onPress={handlePickFromGallery}>
            Galeria
          </Button>
          <Button icon="camera" mode="outlined" onPress={handleTakePhoto}>
            Câmera
          </Button>
        </View>

        <TextInput label="Nome da Peça" value={name} onChangeText={setName} style={styles.input} />
        <TextInput label="Marca" value={brand} onChangeText={setBrand} style={styles.input} />
        <TextInput label="Descrição" value={description} onChangeText={setDescription} multiline style={styles.input} />
        
        <Text style={styles.categoryLabel}>Categoria</Text>
        <SegmentedButtons
          value={category}
          onValueChange={(value) => setCategory(value as any)}
          buttons={[
            { value: 'top', label: 'Top' },
            { value: 'bottom', label: 'Bottom' },
            { value: 'shoes', label: 'Sapatos' },
            { value: 'accessories', label: 'Acessórios' },
          ]}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleAddPiece}
          disabled={loading}
          style={styles.button}
        >
          {loading ? <ActivityIndicator animating={true} color="white" /> : 'Salvar Peça'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // O KeyboardAvoidingView precisa ocupar toda a tela
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20, // O padding agora vai no conteúdo do ScrollView
    paddingBottom: 50, // Espaço extra no final para melhor rolagem
  },
  header: { textAlign: 'center', marginBottom: 20 },
  imagePicker: { height: 150, width: 150, borderRadius: 10, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', borderWidth: 1, borderColor: '#ccc', overflow: 'hidden' },
  image: { height: '100%', width: '100%' },
  buttonActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 20,
  },
  input: { marginBottom: 16 },
  categoryLabel: { marginBottom: 8, color: '#666' },
  button: { marginTop: 10, paddingVertical: 5 },
});