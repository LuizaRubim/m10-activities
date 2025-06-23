import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import CategoryRow from '../../../../components/category_row'; // Ajuste o caminho

// Constantes para as categorias e seus títulos
const CATEGORIES = ['top', 'bottom', 'shoes', 'accessories'];
const CATEGORY_TITLES = {
  top: 'Tops (Partes de Cima)',
  bottom: 'Bottoms (Partes de Baixo)',
  shoes: 'Sapatos',
  accessories: 'Acessórios',
};

export default function OutfitBuilderScreen() {
  const router = useRouter();

  // 1. Estado central que armazena o item selecionado para cada categoria
  const [selections, setSelections] = useState({
    top: null,
    bottom: null,
    shoes: null,
    accessories: null,
  });

  // 2. Função de callback que será passada para cada CategoryRow
  const handleSelectItem = (category, item) => {
    setSelections(prevSelections => ({
      ...prevSelections,
      [category]: prevSelections[category]?.id === item.id ? null : item,
    }));
  };

  // 3. Lógica para verificar se a seleção está completa
  const isSelectionComplete = useMemo(() => {
    return Object.values(selections).every(item => item !== null);
  }, [selections]);

  // 4. Função para navegar para a tela de resumo
  const handleViewOutfit = () => {
    // Passamos apenas os IDs, é mais leve e seguro
    const params = {
       selections: JSON.stringify(selections)
    };
    router.push({ pathname: '/outfit/result', params });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.header}>Monte seu Outfit</Text>
        <Text style={styles.subHeader}>Selecione uma peça de cada categoria.</Text>
        
        {/* Mapeia as categorias para renderizar cada fileira */}
        {CATEGORIES.map(category => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{CATEGORY_TITLES[category]}</Text>
            <CategoryRow
              category={category}
              selectedItem={selections[category]}
              onSelectItem={handleSelectItem}
            />
          </View>
        ))}
      </ScrollView>

      {/* Botão que só é habilitado quando a seleção está completa */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleViewOutfit}
          disabled={!isSelectionComplete}
          style={styles.button}
        >
          Ver Outfit Completo
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { paddingBottom: 100 }, // Espaço para o botão flutuante
  header: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
  subHeader: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  categorySection: { marginBottom: 16 },
  categoryTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 16, marginBottom: 4 },
  buttonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#eee' },
  button: { paddingVertical: 5 },
});