import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, type } from '../theme'

export default function OfflineBanner({ visible }) {
  if (!visible) return null

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text}>Offline — showing saved data</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  text: {
    ...type.captionStrong,
    color: '#92400e',
  },
})
