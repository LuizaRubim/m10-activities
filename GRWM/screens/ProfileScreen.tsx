import { Button } from '@ui-kitten/components';
import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';

const ProfileScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>Meu Perfil</Text>
      </View>
      <Button
        style={{ margin: 20 }}
        onPress={() => console.log('Sair')}
      >
        Sair
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e75480',
  },
  statLabel: {
    color: '#666',
    fontSize: 14,
  },
});

export default ProfileScreen;
