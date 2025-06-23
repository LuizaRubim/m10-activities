import { Stack } from 'expo-router';

export default function HomeStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Get Ready With Me!' }} />
      <Stack.Screen name="clothes" options={{ title: 'Escolher outfit' }} />
      <Stack.Screen name="result" options={{ title: 'Look final' }} />
    </Stack>
  );
}