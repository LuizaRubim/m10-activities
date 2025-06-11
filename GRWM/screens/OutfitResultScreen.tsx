import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { NavigationProp, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../src/types/navigation';
import { Button, Layout, Text } from '@ui-kitten/components';

type OutfitResultScreenNavigationProp = NavigationProp<RootStackParamList, 'OutfitResult'>;
type OutfitResultScreenRouteProp = RouteProp<RootStackParamList, 'OutfitResult'>;

const OutfitResultScreen: React.FC = () => {
  const navigation = useNavigation<OutfitResultScreenNavigationProp>();
  const route = useRoute<OutfitResultScreenRouteProp>();
  const { selectedItems } = route.params;

  const categoryOrder: Array<'top' | 'bottom' | 'shoes' | 'accessories'> = [
    'top',
    'bottom',
    'shoes',
    'accessories'
  ];

  const sortedItems = categoryOrder.map(category => 
    selectedItems.find(item => item.category === category)
  );

  return (
    <Layout style={styles.container}>
      <Text category="h1" style={styles.title}>Seu Outfit</Text>
      <Layout style={styles.outfitContainer}>
        {sortedItems.map((item, index) => (
          <View key={item?.id || index} style={styles.itemContainer}>
            <Text category="h6" style={styles.categoryTitle}>
              {categoryOrder[index].charAt(0).toUpperCase() + categoryOrder[index].slice(1)}
            </Text>
            <Image
              source={{ uri: item?.image }}
              style={styles.clothingImage}
            />
            <Text category="s1">{item?.description}</Text>
            <Text category="c1">{item?.brand}</Text>
          </View>
        ))}
      </Layout>
      <View style={styles.buttonContainer}>
        <Button
          onPress={() => navigation.navigate('Camera')}
          style={styles.button}
        >
          Tirar nova foto
        </Button>
        <Button
          onPress={() => navigation.navigate('Clothes')}
          style={[styles.button, styles.secondaryButton]}
          status="basic"
        >
          Escolher novas roupas
        </Button>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  outfitContainer: {
    flex: 1,
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  itemContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    marginBottom: 8,
  },
  clothingImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonContainer: {
    gap: 8,
  },
  button: {
    marginBottom: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#e75480',
  },
});

export default OutfitResultScreen;
