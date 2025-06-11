import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../src/types/navigation';
import { Button, Text } from '@ui-kitten/components';


type HomeScreenNavigationProp = NavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <Image source={require('../assets/outfit.png')} style={styles.image} />
      <Text style={styles.title}>Get Ready With Me!</Text>
      <Text style={styles.description}>
        Monte o seu outfit do dia
      </Text>
      <View>
        <Button onPress={() => navigation.navigate('Clothes')} style={styles.button}>
          <Text style={styles.text}>Monte seu outfit</Text>
        </Button>
        <Button onPress={() => navigation.navigate('Clothes')} style={styles.button}>
          <Text style={styles.text}>Vai na sorte!</Text>
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#e75480',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
