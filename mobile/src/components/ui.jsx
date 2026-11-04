import { useState } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, Platform, Modal,
  ActivityIndicator, StyleSheet, Image,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { colors, spacing, radius, type, shadow } from '../theme'
import { formatDate } from '../lib/date'

export function Button({ title, onPress, variant = 'primary', disabled, loading, style, icon }) {
  const s = variant === 'primary' ? styles.btnPrimary
    : variant === 'danger' ? styles.btnDanger
    : styles.btnGhost
  const t = variant === 'ghost' ? styles.btnGhostText : styles.btnPrimaryText
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading}
      activeOpacity={0.8} style={[s, disabled && { opacity: 0.45 }, style]}>
      {loading
        ? <ActivityIndicator color={variant === 'ghost' ? colors.ink : colors.white} size="small" />
        : <>{icon && <Text style={{ marginRight: 6, fontSize: 15 }}>{icon}</Text>}
            <Text style={t}>{title}</Text></>}
    </TouchableOpacity>
  )
}

export function SmallButton({ title, onPress, disabled, style }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.8}
      style={[styles.smallBtn, style]}>
      <Text style={styles.smallBtnText}>{title}</Text>
    </TouchableOpacity>
  )
}

export function Card({ children, style, onPress }) {
  const s = [styles.card, style]
  return onPress
    ? <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={s}>{children}</TouchableOpacity>
    : <View style={s}>{children}</View>
}

export function Input({ label, value, onChangeText, placeholder, keyboardType,
  multiline, numberOfLines, autoFocus, style, returnKeyType, onSubmitEditing }) {
  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={colors.textMuted} keyboardType={keyboardType}
        multiline={multiline} numberOfLines={numberOfLines} autoFocus={autoFocus}
        returnKeyType={returnKeyType} onSubmitEditing={onSubmitEditing}
        style={[styles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]} />
    </View>
  )
}

export function DateField({
  label, value, onChange, placeholder = 'Select date',
  minimumDate, maximumDate, style, clearable = true,
}) {
  const [show, setShow] = useState(false)
  const dateValue = value ? new Date(value) : new Date()
  if (Number.isNaN(dateValue.getTime())) dateValue.setTime(Date.now())

  const handleChange = (event, selected) => {
    if (Platform.OS === 'android') {
      setShow(false)
      if (event?.type === 'set' && selected) onChange(selected.toISOString())
    } else if (selected) {
      onChange(selected.toISOString())
    }
  }

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setShow(true)}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${value ? formatDate(value) : placeholder}` : placeholder}
        style={styles.dateField}
      >
        <Text style={{ ...type.bodyMd, color: value ? colors.ink : colors.textMuted }}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Text style={{ fontSize: 16 }}>📅</Text>
      </TouchableOpacity>

      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {show && Platform.OS !== 'android' && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setShow(false)}>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>{label || 'Select date'}</Text>
              <DateTimePicker
                value={dateValue}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
              />
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {clearable && (
                  <Button title="Clear" variant="ghost" style={{ flex: 1 }}
                    onPress={() => { onChange(null); setShow(false) }} />
                )}
                <Button title="Done" style={{ flex: 1 }} onPress={() => setShow(false)} />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

export function Badge({ label, variant = 'neutral' }) {
  const bg = { neutral: colors.neutral, ink: colors.ink, green: '#D1FAE5', red: '#FEE2E2', amber: '#FEF3C7' }[variant]
  const fg = { neutral: colors.textMuted, ink: colors.white, green: '#065F46', red: '#991B1B', amber: '#92400E' }[variant]
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ ...type.captionStrong, color: fg }}>{label}</Text>
    </View>
  )
}

export function Avatar({ user, size = 'md' }) {
  const dim = { sm: 28, md: 36, lg: 48 }[size]
  const fs  = { sm: 11, md: 14, lg: 18 }[size]
  if (user?.avatar)
    return <Image source={{ uri: user.avatar }}
      style={{ width: dim, height: dim, borderRadius: dim / 2, borderWidth: 1, borderColor: colors.border }} />
  return (
    <View style={{ width: dim, height: dim, borderRadius: dim / 2,
      backgroundColor: colors.neutral, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: fs, fontWeight: '600', color: colors.textMuted }}>
        {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
      </Text>
    </View>
  )
}

export function Divider({ style }) {
  return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />
}

export function SectionLabel({ children, style }) {
  return <Text style={[styles.sectionLabel, style]}>{children}</Text>
}

export function EmptyState({ emoji, title, subtitle, action, onAction }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.band }}>
      <Text style={{ fontSize: 52, marginBottom: spacing.md }}>{emoji}</Text>
      <Text style={{ ...type.headingLg, color: colors.ink, marginBottom: spacing.xs, textAlign: 'center' }}>{title}</Text>
      {subtitle && <Text style={{ ...type.bodyMd, color: colors.textMuted, textAlign: 'center',
        marginBottom: action ? spacing.xl : 0, paddingHorizontal: spacing.xl }}>{subtitle}</Text>}
      {action && <Button title={action} onPress={onAction} />}
    </View>
  )
}

export function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}>
      <ActivityIndicator size="large" color={colors.ink} />
    </View>
  )
}

const styles = StyleSheet.create({
  btnPrimary: {
    height: 52, borderRadius: radius.button, backgroundColor: colors.ink,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xl, ...shadow.sm,
  },
  btnPrimaryText: { ...type.bodyMdStrong, color: colors.white },
  btnDanger: {
    height: 52, borderRadius: radius.button, backgroundColor: colors.danger,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xl, ...shadow.sm,
  },
  btnGhost: {
    height: 44, borderRadius: radius.button, backgroundColor: 'transparent',
    borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnGhostText: { ...type.bodyMd, color: colors.ink },
  smallBtn: {
    height: 34, borderRadius: radius.button, backgroundColor: colors.ink,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  smallBtnText: { ...type.headingXs, color: colors.white },
  card: {
    backgroundColor: colors.white, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(3,3,2,0.09)', ...shadow.sm,
  },
  input: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.input, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, ...type.bodyMd, color: colors.ink, minHeight: 44,
  },
  label: { ...type.headingXs, color: colors.textMuted, marginBottom: 6 },
  sectionLabel: { ...type.headingXs, color: colors.textMuted, marginBottom: spacing.sm },
  dateField: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.input, paddingHorizontal: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    minHeight: 44,
  },
  pickerOverlay: {
    flex: 1, backgroundColor: 'rgba(3,3,2,0.35)',
    alignItems: 'center', justifyContent: 'center', padding: spacing.xl,
  },
  pickerCard: {
    width: '100%', maxWidth: 360, backgroundColor: colors.canvas,
    borderRadius: 20, padding: spacing.lg, gap: spacing.md, ...shadow.md,
  },
  pickerTitle: { ...type.displaySm, color: colors.ink, textAlign: 'center' },
})
