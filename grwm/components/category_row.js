import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';

// Componente do card (sem alteração)
const ClothingCard = React.memo(({ item, isSelected, onSelect }) => (
  <TouchableOpacity onPress={onSelect}>
    <View style={[styles.card, isSelected && styles.cardSelected]}>
      <Image source={{ uri: item.image_url }} style={styles.cardImage} />
      {isSelected && <View style={styles.checkOverlay}><Text style={styles.checkText}>✓</Text></View>}
    </View>
    <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
  </TouchableOpacity>
));

// --- MUDANÇA PRINCIPAL AQUI ---
export default function CategoryRow({ category, selectedItem, onSelectItem }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false); // Novo estado para o loading da paginação
  const [page, setPage] = useState(0); // Começamos na página 0
  const [hasMore, setHasMore] = useState(true); // Assumimos que há mais para carregar
  const ITEMS_PER_PAGE = 10; // Defina quantos itens carregar por vez

  const fetchClothingItems = useCallback(async (isInitialLoad = false) => {
    // Evita chamadas duplicadas se já estiver carregando ou não houver mais itens
    if ((loading || loadingMore) || !hasMore) return;
    
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Cálculo do range para a query do Supabase
      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('clothes')
        .select('*', { count: 'exact' }) // 'count' ajuda a saber o total, mas não é estritamente necessário aqui
        .eq('user_id', user.id)
        .eq('category', category)
        .order('created_at', { ascending: false })
        .range(from, to); // A MÁGICA DA PAGINAÇÃO ACONTECE AQUI

      if (error) {
        throw error;
      }

      if (data) {
        // Se for a carga inicial, substitui. Se for paginação, adiciona.
        setItems(prevItems => (page === 0 ? data : [...prevItems, ...data]));
        
        // Se a quantidade de itens retornados for menor que o limite, não há mais páginas
        if (data.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        }

        // Incrementa a página para a próxima busca
        setPage(prevPage => prevPage + 1);
      }
    } catch (error) {
      console.error('Erro ao buscar roupas:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, page, loading, loadingMore, hasMore]);


  // Efeito para a carga inicial
  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    fetchClothingItems(true);
  }, [category]); // Reseta e busca quando a categoria muda (caso use em abas)

  // Componente a ser renderizado no final da lista
  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator style={{ marginHorizontal: 20 }} />;
  };

  if (loading) {
    return <ActivityIndicator style={{ height: 150 }} />;
  }

  if (items.length === 0) {
    return <Text style={styles.emptyText}>Nenhuma peça encontrada nesta categoria.</Text>;
  }

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => (
        <ClothingCard
          item={item}
          isSelected={selectedItem?.id === item.id}
          onSelect={() => onSelectItem(category, item)}
        />
      )}
      keyExtractor={(item) => item.id.toString()}
      horizontal
      showsHorizontalScrollIndicator={false}
      // onEndReached é chamado quando o usuário rola para o final
      onEndReached={() => fetchClothingItems(false)}
      // Distância do final (em %) para disparar o onEndReached
      onEndReachedThreshold={0.5}
      // Mostra o spinner de carregamento no final
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.listContent}
    />
  );
}

// Estilos (sem alteração)
const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 16, paddingVertical: 8 },
  card: { width: 120, height: 120, marginRight: 12, borderRadius: 10, borderWidth: 2, borderColor: 'transparent', backgroundColor: '#f0f0f0' },
  cardSelected: { borderColor: '#6200ee' },
  cardImage: { width: '100%', height: '100%', borderRadius: 8 },
  cardName: { width: 120, textAlign: 'center', marginTop: 4, fontSize: 12 },
  checkOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(98, 0, 238, 0.5)', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  checkText: { color: 'white', fontSize: 40, fontWeight: 'bold' },
  emptyText: { margin: 20, color: '#888' },
});