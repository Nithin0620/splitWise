import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../../src/lib/api'
import { Button, Input, SectionLabel, Card } from '../../../src/components/ui'
import { useDialog } from '../../../src/components/Dialog'
import { colors, spacing, type } from '../../../src/theme'

export default function SettleScreen() {
  const { tripId, fromUser, toUser, amount } = useLocalSearchParams()
  const router = useRouter()
  const dialog = useDialog()
  const [trip, setTrip]       = useState(null)
  const [balances, setBalances] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({
    fromUser: fromUser ?? '',
    toUser: toUser ?? '',
    amount: amount ?? '',
    notes: '',
  })

  useEffect(() => {
    Promise.all([
      api.get(`/trips/${tripId}`),
      api.get(`/trips/${tripId}/balances`),
    ]).then(([tRes, bRes]) => {
      setTrip(tRes.data.data)
      setBalances(bRes.data.data)
    })
  }, [tripId])

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.fromUser || !form.toUser) return dialog.alert('Required', 'Select both payer and receiver')
    if (form.fromUser === form.toUser) return dialog.alert('Error', 'Payer and receiver must be different', { variant: 'error' })
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) return dialog.alert('Required', 'Enter a valid amount')
    setSaving(true)
    try {
      await api.post(`/settlements/trip/${tripId}`, {
        fromUser: form.fromUser, toUser: form.toUser, amount: amt, notes: form.notes,
      })
      router.back()
    } catch (err) {
      dialog.alert('Error', err.response?.data?.message || 'Failed', { variant: 'error' })
    } finally { setSaving(false) }
  }

  if (!trip) return null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: 60 }}>

        {/* Suggested quick-fills */}
        {balances?.transactions?.length > 0 && (
          <View>
            <SectionLabel>Suggested</SectionLabel>
            {balances.transactions.slice(0,3).map((t, i) => (
              <TouchableOpacity key={i} onPress={() => setForm((p) => ({
                ...p, fromUser: t.from._id, toUser: t.to._id, amount: String(t.amount)
              }))} style={{ backgroundColor: colors.neutral, borderRadius: 12,
                padding: spacing.md, marginBottom: spacing.xs,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ ...type.bodySm }}>
                  <Text style={{ fontWeight:'600' }}>{t.from?.name}</Text>
                  {' → '}
                  <Text style={{ fontWeight:'600' }}>{t.to?.name}</Text>
                </Text>
                <Text style={{ ...type.bodyMdStrong }}>{trip.currency} {t.amount.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Who paid */}
        <View>
          <SectionLabel>Who paid?</SectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {trip.members.map((m) => (
                <TouchableOpacity key={m._id} onPress={() => set('fromUser')(m._id)}
                  style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 9999,
                    borderWidth: 1, borderColor: form.fromUser === m._id ? colors.ink : colors.border,
                    backgroundColor: form.fromUser === m._id ? colors.ink : colors.white }}>
                  <Text style={{ ...type.bodySm, color: form.fromUser === m._id ? colors.white : colors.ink }}>
                    {m.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Paid to */}
        <View>
          <SectionLabel>Paid to?</SectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {trip.members.map((m) => (
                <TouchableOpacity key={m._id} onPress={() => set('toUser')(m._id)}
                  style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 9999,
                    borderWidth: 1, borderColor: form.toUser === m._id ? colors.ink : colors.border,
                    backgroundColor: form.toUser === m._id ? colors.ink : colors.white }}>
                  <Text style={{ ...type.bodySm, color: form.toUser === m._id ? colors.white : colors.ink }}>
                    {m.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <Input label={`Amount (${trip.currency})`} value={form.amount} onChangeText={set('amount')}
          placeholder="0.00" keyboardType="decimal-pad" />
        <Input label="Notes" value={form.notes} onChangeText={set('notes')} placeholder="Optional" />

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} style={{ flex: 1 }} />
          <Button title="Record payment" onPress={handleSubmit} loading={saving} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
