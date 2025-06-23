import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Button, Text, Avatar, Card, List } from 'react-native-paper';
import { useSession } from '../../../ctx';
import { supabase } from '../../../services/supabase';

const OutfitCard = React.memo(({ outfit }) => {
  // O outfit vem com objetos aninhados contendo a image_url
  const { top, bottom, shoes, accessories } = outfit;

  return (
    <Card style={styles.outfitCard}>
      <View style={styles.outfitGrid}>
        <Image source={{ uri: top?.image_url }} style={styles.outfitImage} />
        <Image source={{ uri: bottom?.image_url }} style={styles.outfitImage} />
        <Image source={{ uri: shoes?.image_url }} style={styles.outfitImage} />
        <Image source={{ uri: accessories?.image_url }} style={styles.outfitImage} />
      </View>
    </Card>
  );
});

// --- Sub-componente para exibir uma Notificação ---
const NotificationItem = React.memo(({ notification }) => (
  <List.Item
    title={notification.title}
    description={notification.message}
    left={props => <List.Icon {...props} icon={notification.is_read ? 'check-circle' : 'circle-medium'} />}
    titleStyle={!notification.is_read && styles.unreadText}
  />
));


// --- Componente Principal da Tela de Perfil ---
export default function ProfileScreen() {
  const { signOut, session } = useSession();

  // Estados para cada tipo de dado
  const [profile, setProfile] = useState(null);
  const [outfits, setOutfits] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Estado de controle
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Função para buscar todos os dados necessários
  const fetchProfileData = async () => {
    try {
      if (!session?.user) throw new Error("Usuário não logado.");

      // 1. Define as 3 queries que vamos executar
      const profileQuery = supabase
        .from('profiles')
        .select('username, email')
        .eq('id', session.user.id)
        .single();
      
      const outfitsQuery = supabase
        .from('outfits')
        .select('*, top:clothes!outfits_top_id_fkey(image_url), bottom:clothes!outfits_bottom_id_fkey(image_url), shoes:clothes!outfits_shoes_id_fkey(image_url), accessories:clothes!outfits_accessories_id_fkey(image_url)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      const notificationsQuery = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      // 2. Executa todas em paralelo
      const [profileResult, outfitsResult, notificationsResult] = await Promise.all([
        profileQuery,
        outfitsQuery,
        notificationsQuery,
      ]);

      // 3. Verifica erros e atualiza os estados
      if (profileResult.error) throw profileResult.error;
      setProfile(profileResult.data);

      if (outfitsResult.error) throw outfitsResult.error;
      setOutfits(outfitsResult.data);

      if (notificationsResult.error) throw notificationsResult.error;
      setNotifications(notificationsResult.data);

    } catch (error) {
      console.error("Erro ao buscar dados do perfil:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Busca os dados quando a tela é montada
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Função para o "puxar para atualizar"
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfileData();
  }, []);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Seção do Header do Perfil */}
      <View style={styles.headerSection}>
        <Avatar.Icon size={80} icon="account-circle" />
        <Text variant="headlineSmall" style={styles.username}>{profile?.username || 'Usuário'}</Text>
        <Text variant="bodyMedium" style={styles.email}>{profile?.email}</Text>
        <Button
          icon="logout"
          mode="contained"
          onPress={signOut}
          style={styles.logoutButton}
        >
          Sair
        </Button>
      </View>

      {/* Seção de Outfits Salvos */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Outfits Salvos</Text>
        {outfits.length > 0 ? (
          <FlatList
            data={outfits}
            renderItem={({ item }) => <OutfitCard outfit={item} />}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 10 }}
          />
        ) : (
          <Text style={styles.emptyText}>Você ainda não salvou nenhum outfit.</Text>
        )}
      </View>

      {/* Seção de Notificações */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Notificações</Text>
        {notifications.length > 0 ? (
          <Card>
            {notifications.map(notification => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </Card>
        ) : (
          <Text style={styles.emptyText}>Nenhuma notificação por aqui.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSection: { alignItems: 'center', padding: 20, backgroundColor: 'white', marginBottom: 10 },
  username: { marginTop: 10, fontWeight: 'bold' },
  email: { color: '#666' },
  logoutButton: { marginTop: 20, width: '60%' },
  section: { marginBottom: 20, backgroundColor: 'white', padding: 15 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 10 },
  outfitCard: { marginRight: 15, width: 150, height: 150 },
  outfitGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  outfitImage: { width: '50%', height: '50%' },
  unreadText: { fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#888', padding: 20 },
});