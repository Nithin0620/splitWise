import { useEffect } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '../src/context/AuthContext'
import { Button, LoadingScreen } from '../src/components/ui'
import { DialogProvider } from '../src/components/Dialog'
import { colors, spacing, type } from '../src/theme'

function RootNavigator() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    const inInvite = segments[0] === 'invite'
    if (!user && !inAuth && !inInvite) {
      router.replace('/(auth)/welcome')
    } else if (user && inAuth) {
      router.replace('/(tabs)')
    }
  }, [user, loading, segments, router])

  if (loading) return <LoadingScreen />

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notifications"
          options={{ headerShown: true, title: 'Notifications',
            headerStyle: { backgroundColor: colors.canvas },
            headerTintColor: colors.ink, headerShadowVisible: false }} />
        <Stack.Screen name="trips/[tripId]/index" />
        <Stack.Screen name="trips/[tripId]/edit-trip"
          options={{ presentation: 'modal', headerShown: true, title: 'Edit Trip',
            headerStyle: { backgroundColor: colors.canvas },
            headerTintColor: colors.ink, headerShadowVisible: false }} />
        <Stack.Screen name="trips/[tripId]/add-expense"
          options={{ presentation: 'modal', headerShown: true, title: 'Add Expense',
            headerStyle: { backgroundColor: colors.canvas },
            headerTintColor: colors.ink, headerShadowVisible: false }} />
        <Stack.Screen name="trips/[tripId]/edit-expense"
          options={{ presentation: 'modal', headerShown: true, title: 'Edit Expense',
            headerStyle: { backgroundColor: colors.canvas },
            headerTintColor: colors.ink, headerShadowVisible: false }} />
        <Stack.Screen name="trips/[tripId]/settle"
          options={{ presentation: 'modal', headerShown: true, title: 'Record Payment',
            headerStyle: { backgroundColor: colors.canvas },
            headerTintColor: colors.ink, headerShadowVisible: false }} />
        <Stack.Screen name="trips/[tripId]/invite"
          options={{ presentation: 'modal', headerShown: true, title: 'Invite Member',
            headerStyle: { backgroundColor: colors.canvas },
            headerTintColor: colors.ink, headerShadowVisible: false }} />
      </Stack.Protected>
      <Stack.Screen name="invite/accept" />
    </Stack>
  )
}

// Catches render/runtime errors in the route tree so users see a friendly
// recovery screen instead of a blank white page.
export function ErrorBoundary({ error, retry }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, padding: spacing.xl, justifyContent: 'center' }}>
      <Text style={{ fontSize: 48, marginBottom: spacing.md }}>😵</Text>
      <Text style={{ ...type.displaySm, color: colors.ink, marginBottom: spacing.xs }}>
        Something went wrong
      </Text>
      <Text style={{ ...type.bodyMd, color: colors.textMuted, marginBottom: spacing.xl }}>
        The app hit an unexpected error. Your data is safe — try again.
      </Text>
      {error?.message ? (
        <ScrollView style={{ maxHeight: 160, marginBottom: spacing.xl }}>
          <Text style={{ ...type.caption, color: colors.textMuted }}>{error.message}</Text>
        </ScrollView>
      ) : null}
      <Button title="Try again" onPress={retry} />
    </View>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DialogProvider>
          <StatusBar style="dark" backgroundColor={colors.canvas} />
          <RootNavigator />
        </DialogProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
