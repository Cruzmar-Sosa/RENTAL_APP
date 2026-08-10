import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="map" />
      <Stack.Screen name="reservation/new" />
      <Stack.Screen name="reservation/[id]" />
      <Stack.Screen name="reservation/pin/[id]" />
    </Stack>
  );
}
