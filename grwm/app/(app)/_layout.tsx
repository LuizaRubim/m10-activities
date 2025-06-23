import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(root)',
};

export default function AppLayout() {
  return (
    <Stack initialRouteName="(tabs)">
      <Stack.Screen
        name="sign-in"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}