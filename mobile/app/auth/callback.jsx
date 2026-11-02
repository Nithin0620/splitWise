import { useEffect } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'
import { ActivityIndicator, View, Text } from 'react-native'
import { colors, spacing } from '../../src/theme'

export default function AuthCallbackScreen() {
  const { token } = useLocalSearchParams()
  const { login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (token) {
      login(token).then(() => {
        router.replace('/(tabs)')
      })
    } else {
      router.replace('/(auth)/login')
    }
  }, [token, login, router])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas }}>
      <ActivityIndicator size="large" color={colors.ink} />
      <Text style={{ marginTop: spacing.md, color: colors.textMuted }}>Signing you in...</Text>
    </View>
  )
}
