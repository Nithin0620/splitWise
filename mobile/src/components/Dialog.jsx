import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Button } from './ui'
import { colors, spacing, type, radius, shadow } from '../theme'

const DialogContext = createContext(null)

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolverRef = useRef(null)

  const close = useCallback((result) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setDialog(null)
  }, [])

  const open = useCallback((config) => new Promise((resolve) => {
    resolverRef.current?.(false)
    resolverRef.current = resolve
    setDialog(config)
  }), [])

  const alert = useCallback((title, message, options = {}) => open({
    title,
    message,
    confirmText: options.confirmText || 'OK',
    hideCancel: true,
    destructive: options.destructive || false,
    variant: options.variant || 'default',
  }), [open])

  const confirm = useCallback((title, message, options = {}) => open({
    title,
    message,
    confirmText: options.confirmText || 'Confirm',
    cancelText: options.cancelText || 'Cancel',
    destructive: options.destructive || false,
    variant: options.variant || 'default',
    hideCancel: false,
  }), [open])

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm])

  return (
    <DialogContext.Provider value={value}>
      {children}

      <Modal
        visible={Boolean(dialog)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => close(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => close(false)}
            accessibilityLabel="Dismiss dialog"
          />

          <View style={styles.card} accessibilityViewIsModal>
            {dialog?.variant === 'error' && <Text style={styles.emoji}>⚠️</Text>}
            {dialog?.variant === 'success' && <Text style={styles.emoji}>✅</Text>}

            <Text style={styles.title}>{dialog?.title}</Text>

            {dialog?.message ? (
              <ScrollView style={styles.messageWrap} contentContainerStyle={styles.messageContent}>
                <Text style={styles.message}>{dialog.message}</Text>
              </ScrollView>
            ) : null}

            <View style={styles.actions}>
              {!dialog?.hideCancel && (
                <Button
                  title={dialog?.cancelText || 'Cancel'}
                  variant="ghost"
                  onPress={() => close(false)}
                  style={styles.action}
                />
              )}
              <Button
                title={dialog?.confirmText || 'OK'}
                variant={dialog?.destructive ? 'danger' : 'primary'}
                onPress={() => close(true)}
                style={styles.action}
              />
            </View>
          </View>
        </View>
      </Modal>
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used inside DialogProvider')
  }
  return context
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3,3,2,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadow.md,
  },
  emoji: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  title: {
    ...type.headingLg,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  messageWrap: {
    maxHeight: 220,
  },
  messageContent: {
    paddingVertical: spacing.xs,
  },
  message: {
    ...type.bodyMd,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  action: {
    flex: 1,
  },
})
