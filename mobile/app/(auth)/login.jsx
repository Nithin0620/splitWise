import { View, Text, StyleSheet, Alert } from 'react-native'
import { useAuthRequest, makeRedirectUri } from 'expo-auth-session'
import { useEffect } from 'react'
import * as WebBrowser from 'expo-web-browser'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../src/context/AuthContext'
import { Button } from '../../src/components/ui'
import { colors, spacing, type } from '../../src/theme'
import { BASE_URL } from '../../src/lib/api'

WebBrowser.maybeCompleteAuthSession()

// Backend OAuth endpoint — opens in system browser
const GOOGLE_AUTH_URL = BASE_URL.replace('/api', '') + '/api/auth/google'

export default function LoginScreen() {
  const { login } = useAuth()

  const handleGoogleLogin = async () => {
    try {
      // Open the backend Google OAuth URL in the system browser
      // After OAuth, the backend redirects to the CLIENT_URL/auth/callback?token=xxx
      // For mobile, we need the backend to redirect to our deep link instead:
      // splitwise://auth/callback?token=xxx
      // Set GOOGLE_CALLBACK_URL in backend .env to point to backend /api/auth/google/callback
      // and update the auth route to redirect to deep link for mobile clients.
      // For now we open a web session and catch the redirect:
      const redirectUri = makeRedirectUri({ scheme: 'splitwise', path: 'auth/callback' })
      const result = await WebBrowser.openAuthSessionAsync(
        `${GOOGLE_AUTH_URL}?mobile=1&redirectUri=${encodeURIComponent(redirectUri)}`,
        redirectUri
      )

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url)
        const token = url.searchParams.get('token')
        if (token) {
          await login(token)
        } else {
          Alert.alert('Sign in failed', 'No token received. Please try again.')
        }
      }
    } catch (err) {
      Alert.alert('Sign in failed', err.message)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Brand */}
        <View style={styles.brand}>
          <Text style={styles.emoji}>✈️</Text>
          <Text style={styles.appName}>SplitWise</Text>
          <Text style={styles.tagline}>Split expenses. Settle up effortlessly.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome</Text>
          <Text style={styles.cardSub}>Sign in to manage your trips and expenses.</Text>
          <Button
            title="Continue with Google"
            icon="🔑"
            onPress={handleGoogleLogin}
            style={{ marginTop: spacing.lg }}
          />
        </View>

        {/* Feature hints */}
        <View style={styles.hints}>
          {[
            ['💸', 'Split by equal share, exact amount, or percentage'],
            ['⚡', 'Live updates when your group adds expenses'],
            ['📩', 'Invite anyone — even if they\'re not signed up yet'],
          ].map(([icon, text]) => (
            <View key={text} style={styles.hint}>
              <Text style={styles.hintIcon}>{icon}</Text>
              <Text style={styles.hintText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.canvas },
  container: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'center' },
  brand:     { alignItems: 'center', marginBottom: spacing.xxxl },
  emoji:     { fontSize: 52, marginBottom: spacing.md },
  appName:   { ...type.displayLg, color: colors.ink, marginBottom: spacing.xs },
  tagline:   { ...type.bodyMd, color: colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(3,3,2,0.09)',
    padding: spacing.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    marginBottom: spacing.xxxl,
  },
  cardTitle:  { ...type.displayMd, color: colors.ink, marginBottom: spacing.xs },
  cardSub:    { ...type.bodyMd, color: colors.textMuted },
  hints:      { gap: spacing.md },
  hint:       { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  hintIcon:   { fontSize: 18, marginTop: 1 },
  hintText:   { ...type.bodySm, color: colors.textMuted, flex: 1 },
})
