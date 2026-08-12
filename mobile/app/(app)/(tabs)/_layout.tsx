import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { COLORS } from '@design-system/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary.light,
        tabBarInactiveTintColor: COLORS.neutral.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.neutral.surface,
          borderTopColor: COLORS.neutral.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="rental"
        options={{
          title: 'My Rental',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>🚲</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}
