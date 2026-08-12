import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="map" options={{ title: 'Stations' }} />
      <Stack.Screen name="reservation/new" options={{ title: 'New Reservation' }} />
      <Stack.Screen name="reservation/[id]" options={{ title: 'Active Ride Details' }} />
      <Stack.Screen name="reservation/pin/[id]" options={{ title: 'Check-in PIN' }} />
      <Stack.Screen name="active-ride/index" options={{ title: 'Active Ride' }} />
      <Stack.Screen name="payments/index" options={{ title: 'Payments' }} />
      <Stack.Screen name="payments/settlement/[id]" options={{ title: 'Settlement Summary' }} />
      <Stack.Screen name="profile/index" options={{ title: 'Profile' }} />
    </Stack>
  );
}
