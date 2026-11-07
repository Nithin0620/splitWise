import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../../src/lib/api'
import { Button, Input, SectionLabel, Badge, Card } from '../../../src/components/ui'
import { useDialog } from '../../../src/components/Dialog'
import { colors, spacing, type } from '../../../src/theme'

export default function InviteScreen() {
  const { tripId } = useLocalSearchParams()
  const router = useRouter()
  const dialog = useDialog()
  const [email, setEmail]     = useState('')
  const [sending, setSending] = useState(false)
  const [invites, setInvites] = useState([])

  useEffect(() => {
    Promise.all([
      api.get(`/trips/${tripId}`),
      api.get(`/invites/trips/${tripId}`),
    ]).then(([, iRes]) => {
      setInvites(iRes.data.data)
    }).catch(() => {})
  }, [tripId])

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return dialog.alert('Required', 'Enter an email address')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return dialog.alert('Invalid', 'Enter a valid email', { variant: 'error' })
    setSending(true)
    try {
      const { data } = await api.post(`/trips/${tripId}/members`, { email: trimmed })
      if (data.invited) {
        dialog.alert('Invite sent!', `An invitation email was sent to ${trimmed}`, { variant: 'success' })
      } else {
        dialog.alert('Added!', `${trimmed} was added to the trip.`, { variant: 'success' })
      }
      setEmail('')
      // Refresh invites
      api.get(`/invites/trips/${tripId}`).then(({ data }) => setInvites(data.data))
      router.back()
    } catch (err) {
      dialog.alert('Error', err.response?.data?.message || 'Failed to invite', { variant: 'error' })
    } finally { setSending(false) }
  }

  const cancelInvite = async (id) => {
    const ok = await dialog.confirm(
      'Cancel invite?',
      'The invitation link will stop working.',
      { confirmText: 'Cancel invite', cancelText: 'Keep', destructive: true }
    )
    if (!ok) return
    try {
      await api.delete(`/invites/${id}`)
      setInvites((p) => p.filter((i) => i._id !== id))
    } catch (err) {
      dialog.alert('Error', err.response?.data?.message || 'Failed to cancel invite', { variant: 'error' })
    }
  }

  const pending = invites.filter((i) => i.status === 'pending')
  const past    = invites.filter((i) => i.status !== 'pending')

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, paddingBottom: 60 }}>

        {/* Email form */}
        <View>
          <SectionLabel>Invite by email</SectionLabel>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Input value={email} onChangeText={setEmail} placeholder="friend@example.com"
              keyboardType="email-address" style={{ flex: 1 }} autoFocus
              returnKeyType="send" onSubmitEditing={handleSend} />
            <Button title="Send" onPress={handleSend} loading={sending}
              style={{ paddingHorizontal: spacing.lg, height: 44 }} />
          </View>
          <Text style={{ ...type.caption, color: colors.textMuted, marginTop: spacing.xs }}>
            If they have an account they&apos;ll be added immediately. Otherwise they&apos;ll get an invite email.
          </Text>
        </View>

        {/* Pending */}
        {pending.length > 0 && (
          <View>
            <SectionLabel>Pending invitations</SectionLabel>
            {pending.map((inv) => (
              <Card key={inv._id} style={{ padding: spacing.md, marginBottom: spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Text style={{ fontSize: 20 }}>📩</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...type.bodyMdStrong }}>{inv.email}</Text>
                    <Text style={{ ...type.caption, color: colors.textMuted }}>
                      Expires {new Date(inv.expiresAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    </Text>
                  </View>
                  <Badge label="Pending" variant="amber" />
                  <TouchableOpacity onPress={() => cancelInvite(inv._id)}>
                    <Text style={{ ...type.bodyMd, color: colors.textMuted }}>✕</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Past */}
        {past.length > 0 && (
          <View>
            <SectionLabel>Past invitations</SectionLabel>
            {past.slice(0, 5).map((inv) => (
              <Card key={inv._id} style={{ padding: spacing.md, marginBottom: spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Text style={{ ...type.bodyMd, flex: 1 }}>{inv.email}</Text>
                  <Badge label={inv.status}
                    variant={inv.status === 'accepted' ? 'green' : 'neutral'} />
                </View>
              </Card>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}
