import { Stack } from 'expo-router'
import { colors } from '../../src/theme'

export const unstable_settings = {
  anchor: 'welcome',
}

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
    </Stack>
  )
}
