import { useState, useEffect } from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../../src/lib/api'
import { useAuth } from '../../../src/context/AuthContext'
import { LoadingScreen } from '../../../src/components/ui'
import ExpenseForm from '../../../src/components/ExpenseForm'
import { useDialog } from '../../../src/components/Dialog'
import { colors } from '../../../src/theme'

export default function AddExpenseScreen() {
  const { tripId } = useLocalSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const dialog = useDialog()
  const [trip, setTrip] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get(`/trips/${tripId}`)
      .then(({ data }) => setTrip(data.data))
      .catch(() => {
        dialog.alert('Error', 'Failed to load trip', { variant: 'error' })
        router.back()
      })
  }, [tripId, dialog, router])

  const handleSubmit = async (payload) => {
    setSaving(true)
    try {
      await api.post(`/expenses/trip/${tripId}`, payload)
      router.back()
    } catch (err) {
      dialog.alert('Error', err.response?.data?.message || 'Failed to save', { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (!trip) return <LoadingScreen />

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ExpenseForm
          trip={trip}
          defaultPaidBy={user?._id}
          submitLabel="Add expense"
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
