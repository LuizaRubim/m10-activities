import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../src/types/navigation';
import {
  TabBar,
  Tab,
  Button,
  Card,
  Text,
  Layout,
} from '@ui-kitten/components';

type ClothesScreenNavigationProp = NavigationProp<RootStackParamList, 'Clothes'>;

type ClothingItem = {
  id: number;
  image: string;
  description: string;
  brand: string;
  category: 'top' | 'bottom' | 'shoes' | 'accessories';
};

// Mock data categorized
const mockClothes: ClothingItem[] = [
  {
    id: 1,
    image: 'https://via.placeholder.com/150',
    description: 'Camiseta Básica Branca',
    brand: 'Nike',
    category: 'top',
  },
  {
    id: 2,
    image: 'https://via.placeholder.com/150',
    description: 'Calça Jeans Slim',
    brand: 'Levi\'s',
    category: 'bottom',
  },
  {
    id: 3,
    image: 'https://via.placeholder.com/150',
    description: 'Tênis Casual',
    brand: 'Adidas',
    category: 'shoes',
  },
  {
    id: 4,
    image: 'https://via.placeholder.com/150',
    description: 'Colar Dourado',
    brand: 'Pandora',
    category: 'accessories',
  },
  // Add more items for each category...
];

const categories = [
  { title: 'Roupa de Cima', value: 'top' },
  { title: 'Roupa de Baixo', value: 'bottom' },
  { title: 'Calçado', value: 'shoes' },
  { title: 'Acessório', value: 'accessories' },
];

const ClothesScreen: React.FC = () => {
  const navigation = useNavigation<ClothesScreenNavigationProp>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Record<string, ClothingItem>>({});

  const currentCategory = categories[selectedIndex].value;
  const filteredClothes = mockClothes.filter(item => item.category === currentCategory);

  const handleSelectItem = (item: ClothingItem) => {
    setSelectedItems(prev => ({
      ...prev,
      [item.category]: item,
    }));
  };

  const isItemSelected = (item: ClothingItem) =>
    selectedItems[item.category]?.id === item.id;

  const allCategoriesSelected = categories.every(
    category => selectedItems[category.value]
  );

  const handleCreateOutfit = () => {
    navigation.navigate('OutfitResult', {
      selectedItems: Object.values(selectedItems),
    });
  };

  return (
    <Layout style={styles.container}>
      <TabBar
        selectedIndex={selectedIndex}
        onSelect={index => setSelectedIndex(index)}
        style={styles.tabBar}
      >
        {categories.map((category) => (
          <Tab
            key={category.value}
            title={category.title}
            style={styles.tab}
          />
        ))}
      </TabBar>

      <ScrollView style={styles.content}>
        <View style={styles.clothesGrid}>
          {filteredClothes.map((item) => (
            <Card
              key={item.id}
              style={[
                styles.clothingItem,
                isItemSelected(item) && styles.selectedItem,
              ]}
              onPress={() => handleSelectItem(item)}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.clothingImage}
              />
              <Text category="s1">{item.description}</Text>
              <Text category="c1">{item.brand}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>

      <Button
        style={styles.createOutfitButton}
        disabled={!allCategoriesSelected}
        onPress={handleCreateOutfit}
      >
        Montar Outfit
      </Button>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  clothesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 80, // Space for button
  },
  clothingItem: {
    width: (Dimensions.get('window').width - 48) / 2,
    marginBottom: 16,
  },
  selectedItem: {
    borderColor: '#e75480',
    borderWidth: 2,
  },
  clothingImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  createOutfitButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#e75480',
  },
});

export default ClothesScreen;
