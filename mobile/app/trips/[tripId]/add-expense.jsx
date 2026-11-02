import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../../src/lib/api'
import { useAuth } from '../../../src/context/AuthContext'
import { Button, Input, SectionLabel } from '../../../src/components/ui'
import { colors, spacing, type } from '../../../src/theme'

const CATS = ['food','transport','accommodation','entertainment','shopping','other']
const CAT_EMOJI = { food:'🍽️', transport:'🚗', accommodation:'🏨', entertainment:'🎭', shopping:'🛍️', other:'📦' }

export default function AddExpenseScreen() {
  const { tripId } = useLocalSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [trip, setTrip]     = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState({
    title: '', amount: '', category: 'other',
    paidBy: '', splitType: 'equal', notes: '',
  })
  const [equalMembers, setEqualMembers] = useState([])
  const [splits, setSplits] = useState([])

  useEffect(() => {
    api.get(`/trips/${tripId}`).then(({ data }) => {
      const t = data.data
      setTrip(t)
      setEqualMembers(t.members.map((m) => m._id))
      setSplits(t.members.map((m) => ({ userId: m._id, name: m.name, amount: '', percentage: '' })))
      setForm((p) => ({ ...p, paidBy: p.paidBy || user?._id || t.members[0]?._id }))
    })
  }, [tripId])

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }))
  const setSplitField = (uid, field, val) =>
    setSplits((p) => p.map((s) => s.userId === uid ? { ...s, [field]: val } : s))

  const handleSubmit = async () => {
    if (!form.title.trim()) return Alert.alert('Required', 'Title is required')
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) return Alert.alert('Required', 'Enter a valid amount')
    let splitsPayload
    if (form.splitType === 'equal') {
      if (!equalMembers.length) return Alert.alert('Error', 'Select at least one member')
      splitsPayload = equalMembers.map((id) => ({ user: id }))
    } else if (form.splitType === 'exact') {
      const total = splits.reduce((s, x) => s + parseFloat(x.amount || 0), 0)
      if (Math.abs(total - amt) > 0.01) return Alert.alert('Error', `Amounts must sum to ${amt}`)
      splitsPayload = splits.map((s) => ({ user: s.userId, amount: parseFloat(s.amount) }))
    } else {
      const totalPct = splits.reduce((s, x) => s + parseFloat(x.percentage || 0), 0)
      if (Math.abs(totalPct - 100) > 0.1) return Alert.alert('Error', 'Percentages must sum to 100')
      splitsPayload = splits.map((s) => ({ user: s.userId, percentage: parseFloat(s.percentage) }))
    }
    setSaving(true)
    try {
      await api.post(`/expenses/trip/${tripId}`, {
        title: form.title.trim(), amount: amt, category: form.category,
        paidBy: form.paidBy, splitType: form.splitType, splits: splitsPayload, notes: form.notes,
      })
      router.back()
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  if (!trip) return null
  const equalPreview = equalMembers.length && form.amount
    ? (parseFloat(form.amount) / equalMembers.length).toFixed(2) : null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: 60 }}>
        <Input label="What for? *" value={form.title} onChangeText={set('title')} placeholder="e.g. Dinner" autoFocus />

        {/* Category chips */}
        <View>
          <SectionLabel>Category</SectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {CATS.map((c) => (
                <TouchableOpacity key={c} onPress={() => set('category')(c)}
                  style={[styles.chip, form.category === c && styles.chipOn]}>
                  <Text>{CAT_EMOJI[c]}</Text>
                  <Text style={{ ...type.bodySm, textTransform: 'capitalize',
                    color: form.category === c ? colors.white : colors.ink }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <Input label={`Amount (${trip.currency}) *`} value={form.amount} onChangeText={set('amount')}
          placeholder="0.00" keyboardType="decimal-pad" />

        {/* Paid by */}
        <View>
          <SectionLabel>Paid by</SectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {trip.members.map((m) => (
                <TouchableOpacity key={m._id} onPress={() => set('paidBy')(m._id)}
                  style={[styles.chip, form.paidBy === m._id && styles.chipOn]}>
                  <Text style={{ ...type.bodySm,
                    color: form.paidBy === m._id ? colors.white : colors.ink }}>{m.name.split(' ')[0]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Split type */}
        <View>
          <SectionLabel>Split</SectionLabel>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {['equal','exact','percentage'].map((t) => (
              <TouchableOpacity key={t} onPress={() => set('splitType')(t)}
                style={[styles.chip, { flex: 1, justifyContent: 'center' }, form.splitType === t && styles.chipOn]}>
                <Text style={{ ...type.bodySm, textTransform: 'capitalize',
                  color: form.splitType === t ? colors.white : colors.textMuted }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Equal */}
        {form.splitType === 'equal' && (
          <View style={{ gap: 8 }}>
            {equalPreview && <Text style={{ ...type.caption, color: colors.textMuted }}>{trip.currency} {equalPreview} each</Text>}
            {trip.members.map((m) => {
              const on = equalMembers.includes(m._id)
              return (
                <TouchableOpacity key={m._id} onPress={() =>
                  setEqualMembers((p) => on ? p.filter((x) => x !== m._id) : [...p, m._id])}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 }}>
                  <View style={[styles.cb, on && styles.cbOn]}>
                    {on && <Text style={{ color: colors.white, fontSize: 11 }}>✓</Text>}
                  </View>
                  <Text style={{ ...type.bodyMd }}>{m.name}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* Exact */}
        {form.splitType === 'exact' && (
          <View style={{ gap: spacing.sm }}>
            {splits.map((s) => (
              <View key={s.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={{ ...type.bodyMd, flex: 1 }}>{s.name}</Text>
                <Input value={s.amount} onChangeText={(v) => setSplitField(s.userId, 'amount', v)}
                  placeholder="0.00" keyboardType="decimal-pad" style={{ width: 110 }} />
              </View>
            ))}
            <Text style={{ ...type.caption, textAlign: 'right',
              color: Math.abs(splits.reduce((a,s)=>a+parseFloat(s.amount||0),0)-parseFloat(form.amount||0))<0.01
                ? colors.success : colors.danger }}>
              Total: {splits.reduce((a,s)=>a+parseFloat(s.amount||0),0).toFixed(2)} / {form.amount||0}
            </Text>
          </View>
        )}

        {/* Percentage */}
        {form.splitType === 'percentage' && (
          <View style={{ gap: spacing.sm }}>
            {splits.map((s) => (
              <View key={s.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={{ ...type.bodyMd, flex: 1 }}>{s.name}</Text>
                <Input value={s.percentage} onChangeText={(v) => setSplitField(s.userId, 'percentage', v)}
                  placeholder="0" keyboardType="decimal-pad" style={{ width: 80 }} />
                <Text style={{ ...type.bodyMd, color: colors.textMuted }}>%</Text>
                {form.amount ? (
                  <Text style={{ ...type.caption, color: colors.textMuted, width: 72, textAlign: 'right' }}>
                    = {((parseFloat(s.percentage||0)/100)*parseFloat(form.amount||0)).toFixed(2)}
                  </Text>
                ) : null}
              </View>
            ))}
            <Text style={{ ...type.caption, textAlign: 'right',
              color: Math.abs(splits.reduce((a,s)=>a+parseFloat(s.percentage||0),0)-100)<0.1
                ? colors.success : colors.danger }}>
              {splits.reduce((a,s)=>a+parseFloat(s.percentage||0),0).toFixed(1)}%
            </Text>
          </View>
        )}

        <Input label="Notes" value={form.notes} onChangeText={set('notes')} placeholder="Optional" multiline numberOfLines={2} />

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} style={{ flex: 1 }} />
          <Button title="Add expense" onPress={handleSubmit} loading={saving} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  chip:  { flexDirection:'row', gap:4, paddingHorizontal:spacing.md, paddingVertical:spacing.xs,
           borderRadius:9999, borderWidth:1, borderColor:colors.border, backgroundColor:colors.white, alignItems:'center' },
  chipOn:{ backgroundColor:colors.ink, borderColor:colors.ink },
  cb:    { width:20, height:20, borderRadius:4, borderWidth:2, borderColor:colors.border, alignItems:'center', justifyContent:'center' },
  cbOn:  { backgroundColor:colors.ink, borderColor:colors.ink },
})
