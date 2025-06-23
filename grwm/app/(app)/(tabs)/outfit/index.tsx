import { View, StyleSheet, Alert } from 'react-native';
import React, { useState } from 'react';
import { router } from 'expo-router';
import { Button, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../../../services/supabase'; 


const CATEGORIES = ['top', 'bottom', 'shoes', 'accessories'];
const CATEGORY_TITLES = {
  top: 'Tops (Partes de Cima)',
  bottom: 'Bottoms (Partes de Baixo)',
  shoes: 'Sapatos',
  accessories: 'Acessórios',
};

export default function Tab() {
  const [randomLoading, setRandomLoading] = useState(false);
  const handleOutfit = () => {
    router.push('/outfit/clothes');
  };

  const handleRandomOutfit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      setRandomLoading(true);
      const randomItemPromises = CATEGORIES.map(category =>
        supabase.rpc('get_random_clothing_item', { p_category: category })
      );
      const results = await Promise.all(randomItemPromises);

      const randomSelections: any = {};

      results.forEach((result, index) => {
        const category = CATEGORIES[index];
        if (result.error || !result.data || result.data.length === 0) {
          console.error(`Erro ou nenhum dado para a categoria ${category}:`, result.error);
          throw new Error(`Não foi possível encontrar uma peça na categoria "${CATEGORY_TITLES[category]}". Adicione mais peças!`);
        }
        randomSelections[category] = result.data[0];
      });

      // 4. Navega para a tela de resultado com os dados, da mesma forma que o fluxo manual
      router.push({
        pathname: '/outfit/result',
        params: { selections: JSON.stringify(randomSelections) },
      });
    } catch (error: any) {
      console.error('Erro ao gerar outfit aleatório:', error);
      Alert.alert('Erro', error.message || 'Não foi possível gerar um outfit aleatório.');
    }
    setRandomLoading(false);
  };

  return (
    <View style={styles.container}>
      <Button
      mode="contained"
        onPress={handleOutfit}
        style={styles.button}
      >
      Montar outfit
      </Button>
      <Button
        mode="contained"
        onPress={handleRandomOutfit}
        style={styles.button}
      >
        {randomLoading ? <ActivityIndicator animating={true} color="white" /> : 'Vai na sorte!'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  button: { paddingVertical: 5 },
});