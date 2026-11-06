import { Tabs } from 'expo-router'
import { View, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, type } from '../../src/theme'

function TabIcon({ emoji, focused }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
    </View>
  )
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 56 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
        tabBarActiveTintColor:   colors.ink,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { ...type.caption, marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trips',
          tabBarIcon: ({ focused }) => <TabIcon emoji="✈️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
