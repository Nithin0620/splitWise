import { useRouter } from 'expo-router'
import { View } from 'react-native'
import { EmptyState } from '../src/components/ui'
import { colors, spacing } from '../src/theme'

export default function NotFoundScreen() {
  const router = useRouter()
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, justifyContent: 'center', padding: spacing.xl }}>
      <EmptyState
        emoji="🧭"
        title="Page not found"
        subtitle="This link may be broken or the trip was removed."
        action="Back to trips"
        onAction={() => router.replace('/(tabs)')}
      />
    </View>
  )
}
