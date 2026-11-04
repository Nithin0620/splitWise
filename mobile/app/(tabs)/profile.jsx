import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../src/context/AuthContext'
import { Card, Button, Avatar, Divider } from '../../src/components/ui'
import { useDialog } from '../../src/components/Dialog'
import { colors, spacing, type } from '../../src/theme'

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const dialog = useDialog()

  const handleLogout = async () => {
    const ok = await dialog.confirm(
      'Sign out',
      'Are you sure you want to sign out?',
      { confirmText: 'Sign out', destructive: true }
    )
    if (!ok) return
    await logout()
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>

        {/* User card */}
        <Card style={styles.userCard}>
          <View style={styles.userRow}>
            <Avatar user={user} size="lg" />
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </Card>

        {/* Info rows */}
        <Card style={styles.infoCard}>
          {[
            { label: 'Name',  value: user?.name },
            { label: 'Email', value: user?.email },
          ].map(({ label, value }, i, arr) => (
            <View key={label}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
              {i < arr.length - 1 && <Divider />}
            </View>
          ))}
        </Card>

        <Button title="Sign out" variant="ghost" onPress={handleLogout} style={styles.signOut} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.canvas },
  container: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  title:     { ...type.displayMd, color: colors.ink, marginBottom: spacing.xl },
  userCard:  { padding: spacing.xl, marginBottom: spacing.lg },
  userRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  userName:  { ...type.bodyMdStrong, color: colors.ink },
  userEmail: { ...type.bodySm, color: colors.textMuted, marginTop: 2 },
  infoCard:  { marginBottom: spacing.xl },
  infoRow:   { flexDirection: 'row', justifyContent: 'space-between',
               alignItems: 'center', padding: spacing.lg },
  infoLabel: { ...type.bodySm, color: colors.textMuted },
  infoValue: { ...type.bodyMdStrong, color: colors.ink },
  signOut:   { marginTop: 'auto', marginBottom: spacing.xl },
})
