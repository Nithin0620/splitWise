import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Linking from 'expo-linking'
import api from '../../src/lib/api'
import { useAuth } from '../../src/context/AuthContext'
import { Button, Card, Badge, Avatar, LoadingScreen } from '../../src/components/ui'
import { useDialog } from '../../src/components/Dialog'
import { colors, spacing, type } from '../../src/theme'

export default function AcceptInviteScreen() {
  const params = useLocalSearchParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const dialog = useDialog()

  const token = params.token
  const [preview, setPreview]   = useState(null)
  const [status, setStatus]     = useState('loading') // loading | valid | invalid | accepting
  const [errMsg, setErrMsg]     = useState('')
  const accepted = useRef(false)

  // Load preview (no auth needed)
  useEffect(() => {
    if (!token) { setStatus('invalid'); setErrMsg('No invite token in link.'); return }
    api.get(`/invites/preview?token=${token}`)
      .then(({ data }) => { setPreview(data.data); setStatus('valid') })
      .catch((err) => { setErrMsg(err.response?.data?.message || 'Invalid or expired link.'); setStatus('invalid') })
  }, [token])

  // Auto-accept when user is already signed in
  useEffect(() => {
    if (authLoading || accepted.current || status !== 'valid' || !user) return
    accepted.current = true
    doAccept()
  }, [status, user, authLoading])

  const doAccept = async () => {
    setStatus('accepting')
    try {
      const { data } = await api.post('/invites/accept', { token })
      await dialog.alert('Joined!', data.message || 'You joined the trip!', {
        confirmText: 'Open trip',
        variant: 'success',
      })
      router.replace(`/trips/${data.data._id}`)
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Could not accept invite.')
      setStatus('invalid')
    }
  }

  const handleSignIn = () => {
    // Store token then push to login — after login AuthContext fires doAccept via useEffect
    router.replace(`/(auth)/login?inviteToken=${token}`)
  }

  if (authLoading || status === 'loading' || status === 'accepting') return <LoadingScreen />

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {status === 'invalid' && (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 52, marginBottom: spacing.lg }}>❌</Text>
            <Text style={styles.title}>Invite not valid</Text>
            <Text style={[styles.sub, { marginBottom: spacing.xl }]}>{errMsg}</Text>
            <Button title="Go to app" onPress={() => router.replace('/')} />
          </View>
        )}

        {status === 'valid' && preview && (
          <>
            {/* Inviter */}
            <View style={styles.inviterBlock}>
              <Avatar user={preview.invitedBy} size="lg" />
              <Text style={styles.sub}>
                <Text style={{ color: colors.ink, fontWeight: '600' }}>{preview.invitedBy?.name}</Text>
                {' invited you to join'}
              </Text>
            </View>

            {/* Trip card */}
            <Card style={styles.tripCard}>
              <Text style={styles.tripLabel}>Trip invitation</Text>
              <Text style={styles.tripName}>{preview.tripName}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm }}>
                <Badge label={`💰 ${preview.currency}`} />
                <Badge label={`👥 ${preview.memberCount} ${preview.memberCount === 1 ? 'member' : 'members'}`} />
              </View>
              {preview.expiresAt && (
                <Text style={[styles.sub, { marginTop: spacing.sm }]}>
                  Expires {new Date(preview.expiresAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                </Text>
              )}
            </Card>

            {/* Not signed in yet */}
            {!user && (
              <>
                <Text style={[styles.sub, { textAlign: 'center', marginBottom: spacing.lg }]}>
                  Sign in with <Text style={{ color: colors.ink, fontWeight:'600' }}>{preview.email}</Text> to accept.
                </Text>
                <Button title="Sign in with Google to join" icon="🔑" onPress={handleSignIn} />
              </>
            )}
          </>
        )}

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.canvas },
  container:    { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  inviterBlock: { alignItems: 'center', marginBottom: spacing.xl, gap: spacing.sm },
  title:        { ...type.displayMd, color: colors.ink, marginBottom: spacing.sm, textAlign: 'center' },
  sub:          { ...type.bodyMd, color: colors.textMuted, textAlign: 'center' },
  tripCard:     { padding: spacing.xl, marginBottom: spacing.xl },
  tripLabel:    { ...type.headingXs, color: colors.textMuted, marginBottom: spacing.xs },
  tripName:     { ...type.displayMd, color: colors.ink },
})
