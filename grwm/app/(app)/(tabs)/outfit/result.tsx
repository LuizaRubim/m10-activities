import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../services/supabase'; // Ajuste o caminho se necessário

export default function OutfitResultScreen() {
  const router = useRouter();
  
  // 1. Recebe o parâmetro 'selections', que é uma string JSON vinda da tela anterior.
  const params = useLocalSearchParams<{ selections: string }>();

  // 2. Converte a string JSON de volta para um objeto JavaScript.
  // O `useMemo` garante que o parse só aconteça uma vez, a menos que os parâmetros mudem.
  const outfitItems = useMemo(() => {
    try {
      return JSON.parse(params.selections || '{}');
    } catch (e) {
      console.error("Erro ao parsear seleções:", e);
      // Retorna um objeto vazio em caso de erro para não quebrar a UI.
      return {};
    }
  }, [params.selections]);

  // Não há mais `useEffect` para buscar dados. A tela é instantânea!

  const [isSaving, setIsSaving] = useState(false);

  // Função que salva o outfit combinado no banco de dados.
  const handleSaveOutfit = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
      }

      // 3. Pega os IDs diretamente dos objetos que já temos.
      const { error } = await supabase.from('outfits').insert({
        user_id: user.id,
        top_id: outfitItems.top?.id,
        bottom_id: outfitItems.bottom?.id,
        shoes_id: outfitItems.shoes?.id,
        accessories_id: outfitItems.accessories?.id,
      });

      if (error) {
        throw error;
      }
      
      Alert.alert('Sucesso!', 'Seu novo outfit foi salvo.');
      
      // 4. Redireciona o usuário para a tela principal, substituindo o histórico.
      router.replace('/outfit');

    } catch (error: any) {
      console.error('Erro ao salvar outfit:', error);
      Alert.alert('Erro', error.message || 'Não foi possível salvar o outfit.');
    } finally {
      setIsSaving(false);
    }
  };

  // Renderização da UI
  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.header}>Seu Outfit</Text>

      {/* Grid 2x2 para exibir as imagens */}
      <View style={styles.grid}>
        <View style={styles.row}>
          <View style={styles.cell}>
            <Image source={{ uri: outfitItems.top?.image_url }} style={styles.image} resizeMode="cover" />
          </View>
          <View style={styles.cell}>
            <Image source={{ uri: outfitItems.bottom?.image_url }} style={styles.image} resizeMode="cover" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.cell}>
            <Image source={{ uri: outfitItems.shoes?.image_url }} style={styles.image} resizeMode="cover" />
          </View>
          <View style={styles.cell}>
            <Image source={{ uri: outfitItems.accessories?.image_url }} style={styles.image} resizeMode="cover" />
          </View>
        </View>
      </View>
      
      {/* Botão para salvar */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSaveOutfit}
          disabled={isSaving}
          style={styles.button}
        >
          {isSaving ? <ActivityIndicator animating={true} color="white" /> : 'Salvar Outfit'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 20 
  },
  header: { 
    textAlign: 'center', 
    marginBottom: 30, 
    fontWeight: 'bold' 
  },
  grid: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 160,
    height: 160,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    overflow: 'hidden',
    margin: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    paddingVertical: 10,
  },
  button: {
    paddingVertical: 8,
  },
});