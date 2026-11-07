import { useState, useEffect } from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../../src/lib/api'
import { LoadingScreen } from '../../../src/components/ui'
import ExpenseForm from '../../../src/components/ExpenseForm'
import { useDialog } from '../../../src/components/Dialog'
import { colors } from '../../../src/theme'

export default function EditExpenseScreen() {
  const { tripId, expenseId } = useLocalSearchParams()
  const router = useRouter()
  const dialog = useDialog()

  const [trip, setTrip] = useState(null)
  const [expense, setExpense] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/trips/${tripId}`),
      api.get(`/expenses/${expenseId}`),
    ]).then(([tripRes, expenseRes]) => {
      setTrip(tripRes.data.data)
      setExpense(expenseRes.data.data)
    }).catch(() => {
      dialog.alert('Error', 'Failed to load expense', { variant: 'error' })
      router.back()
    })
  }, [tripId, expenseId, dialog, router])

  const handleSubmit = async (payload) => {
    setSaving(true)
    try {
      await api.put(`/expenses/${expenseId}`, payload)
      router.back()
    } catch (err) {
      dialog.alert('Error', err.response?.data?.message || 'Failed to save', { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (!trip || !expense) return <LoadingScreen />

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ExpenseForm
          trip={trip}
          initial={expense}
          submitLabel="Save changes"
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
