import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }} initialRouteName="outfit">
      <Tabs.Screen
        name="outfit"
        options={{
          title: 'Outfit',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="shirt" color={color} />,
          headerShown: false ,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Nova peça',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="camera" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="person-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="+not-found"
        options={{
          href:null
        }}
      />
    </Tabs>
  );
}
