import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Button, Input, SectionLabel, DateField } from './ui'
import { useDialog } from './Dialog'
import { colors, spacing, type } from '../theme'
import { CURRENCIES, convert, round2 } from '../lib/currency'

const CATS = ['food', 'transport', 'accommodation', 'entertainment', 'shopping', 'other']
const CAT_EMOJI = {
  food: '🍽️', transport: '🚗', accommodation: '🏨',
  entertainment: '🎭', shopping: '🛍️', other: '📦',
}
const SPLIT_TYPES = [
  { key: 'equal', label: 'Equal' },
  { key: 'exact', label: 'Exact' },
  { key: 'percentage', label: '%' },
  { key: 'shares', label: 'Shares' },
  { key: 'itemized', label: 'Items' },
]
const FREQUENCIES = [
  { key: 'none', label: 'Once' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
]

const num = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

export default function ExpenseForm({
  trip,
  initial = null,
  defaultPaidBy,
  submitLabel = 'Add expense',
  saving = false,
  onSubmit,
  onCancel,
}) {
  const dialog = useDialog()
  const tripCurrency = (trip.currency || 'INR').toUpperCase()
  const members = trip.members
  const sourceCurrency = (initial?.currency || tripCurrency).toUpperCase()
  const rate = initial?.exchangeRate || 1

  const [form, setForm] = useState({
    title: initial?.title || '',
    amount: initial
      ? String(initial.originalAmount ?? initial.amount ?? '')
      : '',
    currency: sourceCurrency,
    category: initial?.category || 'other',
    date: initial?.date ? new Date(initial.date).toISOString() : new Date().toISOString(),
    paidBy: initial?.paidBy?._id || initial?.paidBy || defaultPaidBy || members[0]?._id || '',
    splitType: initial?.splitType || 'equal',
    notes: initial?.notes || '',
    tax: initial?.tax ? String(initial.tax) : '',
    tip: initial?.tip ? String(initial.tip) : '',
    recurrenceFrequency: initial?.recurrence?.frequency || 'none',
    recurrenceInterval: String(initial?.recurrence?.interval || 1),
    recurrenceEndDate: initial?.recurrence?.endDate || null,
  })

  const [participants, setParticipants] = useState(() => {
    const splitsById = {}
    for (const split of initial?.splits || []) {
      splitsById[String(split.user?._id ?? split.user)] = split
    }
    const sourceTotal = initial?.originalAmount ?? initial?.amount ?? 0
    return members.map((m) => {
      const split = splitsById[String(m._id)]
      const sourceAmount = split ? split.amount / rate : 0
      return {
        userId: m._id,
        name: m.name,
        selected: initial ? Boolean(split) : true,
        amount: sourceAmount ? String(round2(sourceAmount)) : '',
        percentage: split && sourceTotal
          ? String(round2((split.amount / initial.amount) * 100))
          : '',
        shares: '1',
      }
    })
  })

  const [items, setItems] = useState(() => {
    if (initial?.items?.length) {
      return initial.items.map((item) => ({
        name: item.name || '',
        amount: String(item.amount ?? ''),
        users: (item.users || []).map((u) => String(u?._id ?? u)),
      }))
    }
    return [{ name: '', amount: '', users: members.map((m) => m._id) }]
  })

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }))
  const setParticipant = (userId, field, value) =>
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, [field]: value } : p))
    )
  const toggleEqual = (userId) =>
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, selected: !p.selected } : p))
    )

  const setItemField = (index, field, value) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)))
  const toggleItemUser = (index, userId) =>
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it
        const on = it.users.includes(userId)
        return { ...it, users: on ? it.users.filter((u) => u !== userId) : [...it.users, userId] }
      })
    )
  const addItem = () =>
    setItems((prev) => [...prev, { name: '', amount: '', users: members.map((m) => m._id) }])
  const removeItem = (index) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))

  const amountNum = num(form.amount)
  const taxNum = num(form.tax)
  const tipNum = num(form.tip)
  const itemSubtotal = round2(items.reduce((sum, item) => sum + num(item.amount), 0))
  const itemTotal = round2(itemSubtotal + taxNum + tipNum)
  const sourceTotal = form.splitType === 'itemized' ? itemTotal : amountNum
  const convertedTotal = round2(sourceTotal * (form.currency === tripCurrency ? 1 : convert(1, form.currency, tripCurrency) || 1))

  const equalSelected = participants.filter((p) => p.selected)
  const perPerson = equalSelected.length ? sourceTotal / equalSelected.length : 0
  const exactTotal = round2(participants.reduce((sum, p) => sum + num(p.amount), 0))
  const percentTotal = round2(participants.reduce((sum, p) => sum + num(p.percentage), 0))
  const shareTotal = participants.reduce((sum, p) => sum + num(p.shares), 0)

  const handleSubmit = () => {
    if (!form.title.trim()) return dialog.alert('Required', 'Title is required')
    if (!form.paidBy) return dialog.alert('Required', 'Select who paid')

    let splits
    if (form.splitType === 'equal') {
      if (!equalSelected.length) return dialog.alert('Error', 'Select at least one person', { variant: 'error' })
      splits = equalSelected.map((p) => ({ user: p.userId }))
    } else if (form.splitType === 'exact') {
      if (Math.abs(exactTotal - sourceTotal) > 0.01) {
        return dialog.alert('Error', `Amounts must sum to ${sourceTotal.toFixed(2)}`, { variant: 'error' })
      }
      splits = participants.map((p) => ({ user: p.userId, amount: num(p.amount) }))
    } else if (form.splitType === 'percentage') {
      if (Math.abs(percentTotal - 100) > 0.1) {
        return dialog.alert('Error', 'Percentages must sum to 100', { variant: 'error' })
      }
      splits = participants.map((p) => ({ user: p.userId, percentage: num(p.percentage) }))
    } else if (form.splitType === 'shares') {
      if (shareTotal <= 0) return dialog.alert('Error', 'Shares must add up to more than zero', { variant: 'error' })
      splits = participants.map((p) => ({ user: p.userId, shares: num(p.shares) }))
    } else {
      if (!items.length) return dialog.alert('Error', 'Add at least one item', { variant: 'error' })
      for (const item of items) {
        if (num(item.amount) <= 0) return dialog.alert('Error', 'Every item needs an amount', { variant: 'error' })
        if (!item.users.length) return dialog.alert('Error', 'Every item needs at least one person', { variant: 'error' })
      }
      splits = []
    }

    if (form.splitType !== 'itemized' && !(amountNum > 0)) {
      return dialog.alert('Required', 'Enter a valid amount')
    }

    const payload = {
      title: form.title.trim(),
      amount: round2(sourceTotal),
      currency: form.currency,
      category: form.category,
      date: form.date,
      paidBy: form.paidBy,
      splitType: form.splitType,
      notes: form.notes,
      splits,
      recurrence: {
        frequency: form.recurrenceFrequency,
        interval: Math.max(1, parseInt(form.recurrenceInterval, 10) || 1),
        endDate: form.recurrenceEndDate || undefined,
      },
    }

    if (form.splitType === 'itemized') {
      payload.items = items.map((item) => ({
        name: item.name.trim() || 'Item',
        amount: num(item.amount),
        users: item.users,
      }))
      payload.tax = taxNum
      payload.tip = tipNum
    }

    onSubmit(payload)
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      <Input
        label="What for? *"
        value={form.title}
        onChangeText={set('title')}
        placeholder="e.g. Dinner"
        autoFocus={!initial}
      />

      <View>
        <SectionLabel>Category</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {CATS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => set('category')(c)}
                style={[styles.chip, form.category === c && styles.chipOn]}
              >
                <Text>{CAT_EMOJI[c]}</Text>
                <Text style={{ ...type.bodySm, textTransform: 'capitalize',
                  color: form.category === c ? colors.white : colors.ink }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Currency */}
      <View>
        <SectionLabel>Currency</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {CURRENCIES.map((code) => (
              <TouchableOpacity
                key={code}
                onPress={() => set('currency')(code)}
                style={[styles.chip, form.currency === code && styles.chipOn]}
              >
                <Text style={{ ...type.bodySm,
                  color: form.currency === code ? colors.white : colors.ink }}>{code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {form.splitType !== 'itemized' && (
        <View>
          <Input
            label={`Amount (${form.currency}) *`}
            value={form.amount}
            onChangeText={set('amount')}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          {form.currency !== tripCurrency && sourceTotal > 0 && (
            <Text style={{ ...type.caption, color: colors.textMuted, marginTop: 4 }}>
              ≈ {tripCurrency} {convertedTotal.toFixed(2)} at today&apos;s rate
            </Text>
          )}
        </View>
      )}

      <DateField label="Date" value={form.date} onChange={set('date')} />

      {/* Paid by */}
      <View>
        <SectionLabel>Paid by</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {members.map((m) => (
              <TouchableOpacity
                key={m._id}
                onPress={() => set('paidBy')(m._id)}
                style={[styles.chip, form.paidBy === m._id && styles.chipOn]}
              >
                <Text style={{ ...type.bodySm,
                  color: form.paidBy === m._id ? colors.white : colors.ink }}>
                  {m.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Split type */}
      <View>
        <SectionLabel>Split</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {SPLIT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => set('splitType')(t.key)}
                style={[styles.chip, form.splitType === t.key && styles.chipOn]}
              >
                <Text style={{ ...type.bodySm,
                  color: form.splitType === t.key ? colors.white : colors.textMuted }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Equal */}
      {form.splitType === 'equal' && (
        <View style={{ gap: 8 }}>
          {sourceTotal > 0 && perPerson > 0 && (
            <Text style={{ ...type.caption, color: colors.textMuted }}>
              {form.currency} {perPerson.toFixed(2)} each
              {form.currency !== tripCurrency
                ? ` · ${tripCurrency} ${(perPerson * (convertedTotal / sourceTotal)).toFixed(2)}`
                : ''}
            </Text>
          )}
          {members.map((m) => {
            const p = participants.find((x) => x.userId === m._id)
            const on = p?.selected
            return (
              <TouchableOpacity
                key={m._id}
                onPress={() => toggleEqual(m._id)}
                style={styles.row}
              >
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
          {participants.map((p) => (
            <View key={p.userId} style={styles.row}>
              <Text style={{ ...type.bodyMd, flex: 1 }}>{p.name}</Text>
              <Input
                value={p.amount}
                onChangeText={(v) => setParticipant(p.userId, 'amount', v)}
                placeholder="0.00"
                keyboardType="decimal-pad"
                style={{ width: 110 }}
              />
            </View>
          ))}
          <TotalHint
            ok={Math.abs(exactTotal - sourceTotal) < 0.01}
            text={`Total: ${exactTotal.toFixed(2)} / ${sourceTotal.toFixed(2)}`}
          />
        </View>
      )}

      {/* Percentage */}
      {form.splitType === 'percentage' && (
        <View style={{ gap: spacing.sm }}>
          {participants.map((p) => (
            <View key={p.userId} style={styles.row}>
              <Text style={{ ...type.bodyMd, flex: 1 }}>{p.name}</Text>
              <Input
                value={p.percentage}
                onChangeText={(v) => setParticipant(p.userId, 'percentage', v)}
                placeholder="0"
                keyboardType="decimal-pad"
                style={{ width: 80 }}
              />
              <Text style={{ ...type.bodyMd, color: colors.textMuted }}>%</Text>
              {sourceTotal > 0 && (
                <Text style={{ ...type.caption, color: colors.textMuted, width: 72, textAlign: 'right' }}>
                  = {((num(p.percentage) / 100) * sourceTotal).toFixed(2)}
                </Text>
              )}
            </View>
          ))}
          <TotalHint
            ok={Math.abs(percentTotal - 100) < 0.1}
            text={`${percentTotal.toFixed(1)}%`}
          />
        </View>
      )}

      {/* Shares */}
      {form.splitType === 'shares' && (
        <View style={{ gap: spacing.sm }}>
          {participants.map((p) => {
            const share = shareTotal > 0 ? (num(p.shares) / shareTotal) * sourceTotal : 0
            return (
              <View key={p.userId} style={styles.row}>
                <Text style={{ ...type.bodyMd, flex: 1 }}>{p.name}</Text>
                <Input
                  value={p.shares}
                  onChangeText={(v) => setParticipant(p.userId, 'shares', v)}
                  placeholder="1"
                  keyboardType="number-pad"
                  style={{ width: 72 }}
                />
                <Text style={{ ...type.caption, color: colors.textMuted, width: 78, textAlign: 'right' }}>
                  = {form.currency} {share.toFixed(2)}
                </Text>
              </View>
            )
          })}
          <TotalHint ok={shareTotal > 0} text={`${shareTotal} share${shareTotal === 1 ? '' : 's'} total`} />
        </View>
      )}

      {/* Itemized */}
      {form.splitType === 'itemized' && (
        <View style={{ gap: spacing.md }}>
          {items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.row}>
                <Input
                  value={item.name}
                  onChangeText={(v) => setItemField(index, 'name', v)}
                  placeholder={`Item ${index + 1}`}
                  style={{ flex: 1 }}
                />
                <Input
                  value={item.amount}
                  onChangeText={(v) => setItemField(index, 'amount', v)}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  style={{ width: 100 }}
                />
                <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeBtn}>
                  <Text style={{ color: colors.danger, fontSize: 16 }}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {members.map((m) => {
                  const on = item.users.includes(m._id)
                  return (
                    <TouchableOpacity
                      key={m._id}
                      onPress={() => toggleItemUser(index, m._id)}
                      style={[styles.miniChip, on && styles.miniChipOn]}
                    >
                      <Text style={{ ...type.caption,
                        color: on ? colors.white : colors.textMuted }}>
                        {m.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ))}
          <Button title="+ Add item" variant="ghost" onPress={addItem} />
          <View style={styles.row}>
            <Input label="Tax" value={form.tax} onChangeText={set('tax')}
              placeholder="0.00" keyboardType="decimal-pad" style={{ flex: 1 }} />
            <Input label="Tip" value={form.tip} onChangeText={set('tip')}
              placeholder="0.00" keyboardType="decimal-pad" style={{ flex: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ ...type.bodyMdStrong }}>Total</Text>
            <Text style={{ ...type.bodyMdStrong }}>{form.currency} {itemTotal.toFixed(2)}</Text>
          </View>
          {form.currency !== tripCurrency && itemTotal > 0 && (
            <Text style={{ ...type.caption, color: colors.textMuted, textAlign: 'right' }}>
              ≈ {tripCurrency} {convertedTotal.toFixed(2)} at today&apos;s rate
            </Text>
          )}
        </View>
      )}

      {/* Recurring */}
      <View>
        <SectionLabel>Repeat</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {FREQUENCIES.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => set('recurrenceFrequency')(f.key)}
              style={[styles.chip, form.recurrenceFrequency === f.key && styles.chipOn]}
            >
              <Text style={{ ...type.bodySm,
                color: form.recurrenceFrequency === f.key ? colors.white : colors.textMuted }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {form.recurrenceFrequency !== 'none' && (
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            <View style={styles.row}>
              <Text style={{ ...type.bodyMd, flex: 1 }}>Every</Text>
              <Input
                value={form.recurrenceInterval}
                onChangeText={set('recurrenceInterval')}
                keyboardType="number-pad"
                style={{ width: 72 }}
              />
              <Text style={{ ...type.bodyMd, color: colors.textMuted }}>
                {form.recurrenceFrequency === 'daily' ? 'day(s)'
                  : form.recurrenceFrequency === 'weekly' ? 'week(s)' : 'month(s)'}
              </Text>
            </View>
            <DateField
              label="Ends on (optional)"
              value={form.recurrenceEndDate}
              onChange={set('recurrenceEndDate')}
            />
          </View>
        )}
      </View>

      <Input
        label="Notes"
        value={form.notes}
        onChangeText={set('notes')}
        placeholder="Optional"
        multiline
        numberOfLines={2}
      />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button title="Cancel" variant="ghost" onPress={onCancel} style={{ flex: 1 }} />
        <Button title={submitLabel} onPress={handleSubmit} loading={saving} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  )
}

function TotalHint({ ok, text }) {
  return (
    <Text style={{ ...type.caption, textAlign: 'right', color: ok ? colors.success : colors.danger }}>
      {text}
    </Text>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 9999, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.white, alignItems: 'center',
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  cb: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  cbOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemCard: {
    gap: spacing.sm, padding: spacing.md, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  removeBtn: {
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
    borderRadius: 9999, backgroundColor: colors.surface,
  },
  miniChip: {
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 9999,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  miniChipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
})
