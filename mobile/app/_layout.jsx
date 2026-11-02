import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '../src/context/AuthContext'
import { LoadingScreen } from '../src/components/ui'
import { colors } from '../src/theme'

function RootNavigator() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    const inInvite = segments[0] === 'invite'
    if (!user && !inAuth && !inInvite) {
      router.replace('/(auth)/login')
    } else if (user && inAuth) {
      router.replace('/(tabs)')
    }
  }, [user, loading, segments])

  if (loading) return <LoadingScreen />

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="invite/accept" />
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
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" backgroundColor={colors.canvas} />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
