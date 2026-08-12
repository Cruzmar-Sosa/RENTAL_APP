import { Stack } from 'expo-router';

export default function AppLayout() {
  /**
   * Architecture:
   * - Tabs for: Home, My Rental, Profile
   * - All other screens (reservation detail, PIN, settlement, active-ride) are
   *   pushed as Stack screens ON TOP of the tab context using the
   *   <Tabs.Screen name="..." /> pattern and expo-router nested navigation.
   *
   * Non-tab screens are declared in the Stack wrapper here so they overlay the tabs.
   */
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* ── Tab Navigator Root ── */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* ── Full-screen overlay screens (no tab bar) ── */}
      <Stack.Screen
        name="reservation/[id]"
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="reservation/pin/[id]"
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="payments/settlement/[id]"
        options={{ headerShown: false, animation: 'slide_from_bottom' }}
      />

      {/* ── Deprecated screens — kept as redirects ── */}
      <Stack.Screen name="map" options={{ headerShown: false }} />
      <Stack.Screen name="reservation/new" options={{ headerShown: false }} />
      <Stack.Screen name="active-ride/index" options={{ headerShown: false }} />
      <Stack.Screen name="payments/index" options={{ headerShown: false }} />
      <Stack.Screen name="profile/index" options={{ headerShown: false }} />
    </Stack>
  );
}
