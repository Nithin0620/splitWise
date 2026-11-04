import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../../src/lib/api'
import { Button, Input, SectionLabel, LoadingScreen, DateField, Card } from '../../../src/components/ui'
import { useDialog } from '../../../src/components/Dialog'
import { colors, spacing, type } from '../../../src/theme'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY', 'AED']

export default function EditTripScreen() {
  const { tripId } = useLocalSearchParams()
  const router = useRouter()
  const dialog = useDialog()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get(`/trips/${tripId}`)
      .then(({ data }) => {
        const t = data.data
        setForm({
          name: t.name ?? '',
          description: t.description ?? '',
          startDate: t.startDate ?? null,
          endDate: t.endDate ?? null,
          currency: t.currency ?? 'INR',
          isArchived: Boolean(t.isArchived),
        })
      })
      .catch(() => {
        dialog.alert('Error', 'Failed to load trip', { variant: 'error' })
        router.back()
      })
  }, [tripId, dialog])

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return dialog.alert('Required', 'Trip name is required')
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      return dialog.alert('Check dates', 'End date cannot be before start date')
    }
    setSaving(true)
    try {
      await api.put(`/trips/${tripId}`, {
        name: form.name.trim(),
        description: form.description.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        currency: form.currency,
        isArchived: form.isArchived,
      })
      router.back()
    } catch (err) {
      dialog.alert('Error', err.response?.data?.message || 'Failed to save trip', { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (!form) return <LoadingScreen />

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Input label="Trip name *" value={form.name} onChangeText={set('name')}
          placeholder="e.g. Goa 2026" />
        <Input label="Description" value={form.description} onChangeText={set('description')}
          placeholder="Optional — a short note about this trip" multiline numberOfLines={3} />

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <DateField label="Start date" value={form.startDate} onChange={set('startDate')}
            placeholder="Optional" style={{ flex: 1 }} />
          <DateField label="End date" value={form.endDate} onChange={set('endDate')}
            placeholder="Optional" minimumDate={form.startDate ? new Date(form.startDate) : undefined}
            style={{ flex: 1 }} />
        </View>

        <View>
          <SectionLabel>Currency</SectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity key={c} onPress={() => set('currency')(c)}
                  style={[styles.chip, form.currency === c && styles.chipOn]}>
                  <Text style={{ ...type.bodyMdStrong,
                    color: form.currency === c ? colors.white : colors.ink }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <Card style={styles.archiveCard}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...type.bodyMdStrong, color: colors.ink }}>
              {form.isArchived ? 'Archived' : 'Archive this trip'}
            </Text>
            <Text style={{ ...type.caption, color: colors.textMuted, marginTop: 2 }}>
              {form.isArchived
                ? 'It is tucked away from your active trips. Unarchive to bring it back.'
                : 'Hide it from your active trips without deleting anything.'}
            </Text>
          </View>
          <Switch
            value={form.isArchived}
            onValueChange={set('isArchived')}
            trackColor={{ false: colors.border, true: colors.ink }}
            thumbColor={colors.white}
            accessibilityLabel="Archive trip"
          />
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} style={{ flex: 1 }} />
          <Button title="Save changes" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 60 },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
          borderRadius: 9999, borderWidth: 1, borderColor: colors.border,
          backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  archiveCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
})
