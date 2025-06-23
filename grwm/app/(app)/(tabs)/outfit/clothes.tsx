import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';

// As categorias que definem nossas abas e o estado
const CATEGORIES = ['top', 'bottom', 'shoes', 'accessories'];
const CATEGORY_TITLES = {
  top: 'Cima',
  bottom: 'Baixo',
  shoes: 'Calçado',
  accessories: 'Acessório',
};

// Componente Card reutilizável
const Card = React.memo(({ item, isSelected, onSelect }) => (
  <TouchableOpacity onPress={onSelect}>
    <View style={[styles.card, isSelected && styles.cardSelected]}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      {isSelected && <Text style={styles.checkMark}>✓</Text>}
    </View>
  </TouchableOpacity>
));

export default function BuildScreen() {
  // --- ESTADO CENTRALIZADO ---
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [selections, setSelections] = useState({
    processador: null, 'placa-mae': null, 'memoria-ram': null, armazenamento: null,
  });

  // Estado para a FlatList (controla apenas a lista ativa)
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // --- LÓGICA DE DADOS ---
  const fetchItems = useCallback(async (isNewCategory = false) => {
    if (loading || (!hasMore && !isNewCategory)) return;
    
    setLoading(true);
    const currentPage = isNewCategory ? 1 : page;

    try {
      const response = await fetch(`https://sua-api.com/api/items?category=${activeCategory}&page=${currentPage}&limit=20`);
      const result = await response.json();
      
      // Se for uma nova categoria, substitui os itens. Se for paginação, adiciona.
      setItems(isNewCategory ? result.data : [...items, ...result.data]);
      setPage(currentPage + 1);
      setHasMore(result.pagination.hasNextPage);

    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  }, [activeCategory, page, loading, hasMore, items]);

  // Efeito que roda QUANDO a aba ativa muda
  useEffect(() => {
    // Reseta o estado da lista e busca os dados da nova categoria
    setItems([]);
    setPage(1);
    setHasMore(true);
    fetchItems(true); // `true` indica que é uma nova busca
  }, [activeCategory]); // Dependência: Roda toda vez que activeCategory muda

  // --- LÓGICA DE INTERAÇÃO ---
  const handleSelectTab = (category) => {
    setActiveCategory(category);
  };

  const handleSelectItem = (item) => {
    setSelections(prev => ({
      ...prev,
      [activeCategory]: prev[activeCategory]?.id === item.id ? null : item,
    }));
  };

  const isSelectionComplete = useMemo(() => {
    return Object.values(selections).every(sel => sel !== null);
  }, [selections]);

  const handleFinalize = () => {
    router.push({
      pathname: '/summary',
      params: { selections: JSON.stringify(selections) },
    });
  };

  // --- RENDERIZAÇÃO ---
  return (
    <View style={styles.container}>
      {/* 1. Nossas Abas Customizadas */}
      <View style={styles.tabBar}>
        {CATEGORIES.map(category => (
          <TouchableOpacity
            key={category}
            style={[styles.tab, activeCategory === category && styles.activeTab]}
            onPress={() => handleSelectTab(category)}
          >
            <Text style={[styles.tabText, activeCategory === category && styles.activeTabText]}>
              {CATEGORY_TITLES[category]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 2. A Lista (apenas uma!) */}
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <Card
            item={item}
            isSelected={selections[activeCategory]?.id === item.id}
            onSelect={() => handleSelectItem(item)}
          />
        )}
        keyExtractor={item => item.id.toString()}
        onEndReached={() => fetchItems(false)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading && <ActivityIndicator size="large" style={{ margin: 20 }} />}
        contentContainerStyle={{ paddingVertical: 8 }}
      />

      {/* 3. O Botão Final */}
      <View style={styles.buttonContainer}>
        <Button
          title="Ver Seleção"
          onPress={handleFinalize}
          disabled={!isSelectionComplete}
        />
      </View>
    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabBar: { flexDirection: 'row', backgroundColor: 'white', elevation: 4 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: 'blue' },
  tabText: { color: '#666' },
  activeTabText: { color: 'blue', fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 20, marginVertical: 8, marginHorizontal: 16, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardSelected: { borderWidth: 2, borderColor: 'blue' },
  cardTitle: { fontSize: 16 },
  checkMark: { fontSize: 22, color: 'blue' },
  buttonContainer: { padding: 16, borderTopWidth: 1, borderColor: '#eee', backgroundColor: 'white' },
});