import { useEffect, useRef, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Easing, Platform, Linking, AccessibilityInfo,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, type, shadow } from '../../src/theme'

const GITHUB_URL = 'https://github.com/Nithin0620/splitWise'
const YEAR = new Date().getFullYear()
const SERIF = Platform.select({ ios: 'Georgia', default: 'serif' })

const FEATURES = [
  { icon: '🔀', tint: '#FFF0E8', title: 'Split any way',
    body: 'Equal, exact amounts, percentages, or line items. Every split stays fair and fully editable.' },
  { icon: '⚡', tint: '#FFF7DB', title: 'Live balances',
    body: 'Add an expense and everyone sees the updated balance instantly on web and mobile.' },
  { icon: '✉️', tint: '#EAF2FF', title: 'Invite by email',
    body: 'Bring friends in even if they have never used SplitWise. One link and they are in the trip.' },
  { icon: '🌍', tint: '#EAF7F0', title: 'Multi-currency',
    body: 'Log expenses in the currency you paid. Balances settle in the trip currency automatically.' },
  { icon: '🔁', tint: '#F3EDFF', title: 'Recurring expenses',
    body: 'Rent, subscriptions, and daily stays can repeat on their own schedule without manual entry.' },
  { icon: '📶', tint: '#F1F1EF', title: 'Offline ready',
    body: 'Cached trips and an offline banner keep the app usable when the signal drops.' },
]

const ROADMAP = [
  { icon: '👥', tint: '#EAF2FF', title: 'Multi-user trip sharing',
    body: 'Plan together in real time with shared edit access, roles, and live presence.' },
  { icon: '🧩', tint: '#F3EDFF', title: 'Trip template sharing',
    body: 'Publish a trip as a template, then let friends clone and remix it in one tap.' },
  { icon: '🔗', tint: '#EAF7F0', title: 'Profile sharing',
    body: 'Share your travel style, preferences, and past trips with the people you plan with.' },
  { icon: '👛', tint: '#FFF0E8', title: 'Smart settle-up',
    body: 'Fewer transfers, better payment suggestions, and a clear record of who paid whom.' },
  { icon: '💬', tint: '#FFF7DB', title: 'Group polls and chat',
    body: 'Pick the stay, the cab, and the plan without leaving the trip workspace.' },
  { icon: '🧾', tint: '#FDF2F8', title: 'Receipt scanning',
    body: 'Snap a bill and let SplitWise read the line items, tax, and tip for the group.' },
  { icon: '🌐', tint: '#ECFEFF', title: 'Public trip pages',
    body: 'A clean shareable page for the itinerary, budget, and who is coming along.' },
  { icon: '✨', tint: '#FFF1E6', title: 'And more in the library',
    body: 'Curated places, packing lists, and group memory albums are on the same roadmap.' },
]

const TRAVELLERS = [
  { initial: 'A', bg: '#FFE0D3', fg: '#B23A0B' },
  { initial: 'M', bg: '#E7F0FF', fg: '#1D4ED8' },
  { initial: 'R', bg: '#EAF7F0', fg: '#047857' },
  { initial: 'K', bg: '#F3EDFF', fg: '#6D28D9' },
]

function useFloat(distance, duration, enabled) {
  const [value] = useState(() => new Animated.Value(0))
  useEffect(() => {
    if (!enabled) return undefined
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [value, duration, enabled])
  return value.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] })
}

function useReduceMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    let active = true
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => { if (active) setReduce(!!v) })
      .catch(() => {})
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => setReduce(!!v))
    return () => { active = false; sub?.remove?.() }
  }, [])
  return reduce
}

function BrandMark({ size = 34 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.ink,
      alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.white, fontSize: size * 0.5, fontWeight: '700', marginTop: -2 }}>⇄</Text>
    </View>
  )
}

function Check({ label, light }) {
  return (
    <View style={styles.checkItem}>
      <Text style={[styles.checkMark, light && { color: 'rgba(255,255,255,0.7)' }]}>✓</Text>
      <Text style={[styles.checkText, light && { color: 'rgba(255,255,255,0.6)' }]}>{label}</Text>
    </View>
  )
}

function HeroVisual({ animate }) {
  const floatMain = useFloat(12, 7000, animate)
  const floatChip = useFloat(10, 6000, animate)

  return (
    <View style={styles.heroVisual} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={{ transform: [{ translateY: floatMain }, { rotate: '-3deg' }] }}>
        <View style={styles.phone}>
          <View style={styles.phoneHeader}>
            <Text style={styles.phoneTitle}>Rishikesh 2026</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          <View style={styles.sunset}>
            <View style={styles.sunsetGlow} />
            <View style={styles.sun} />
            <View style={[styles.peak, { left: -10, bottom: -70, backgroundColor: '#E85D20', opacity: 0.55 }]} />
            <View style={[styles.peak, { left: 110, bottom: -80, backgroundColor: '#E85D20', opacity: 0.55 }]} />
            <View style={[styles.peak, { left: 40, bottom: -95, backgroundColor: '#8C2F0D' }]} />
            <View style={[styles.peak, { left: 190, bottom: -90, backgroundColor: '#8C2F0D' }]} />
          </View>

          <View style={{ padding: spacing.sm }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row' }}>
                {TRAVELLERS.map((t, i) => (
                  <View key={t.initial} style={[styles.miniAvatar,
                    { backgroundColor: t.bg, marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i }]}>
                    <Text style={[styles.miniAvatarText, { color: t.fg }]}>{t.initial}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.caption}>4 travellers</Text>
            </View>

            <View style={{ marginTop: spacing.sm }}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>You are owed</Text>
                <Text style={[styles.balanceValue, { color: '#047857' }]}>INR 1,149</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>You owe</Text>
                <Text style={[styles.balanceValue, { color: '#B91C1C' }]}>INR 287</Text>
              </View>
              <View style={[styles.balanceRow, styles.netRow]}>
                <Text style={styles.balanceValue}>Net balance</Text>
                <Text style={styles.netValue}>INR 862</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm }}>
              <View style={styles.mockPrimary}><Text style={styles.mockPrimaryText}>Settle up</Text></View>
              <View style={styles.mockGhost}><Text style={{ fontSize: 15 }}>⇄</Text></View>
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.floatChip, { transform: [{ translateY: floatChip }] }]}>
        <View style={[styles.miniAvatar, { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFE0D3' }]}>
          <Text style={[styles.miniAvatarText, { color: '#B23A0B', fontSize: 13 }]}>A</Text>
        </View>
        <View>
          <Text style={styles.caption}>Aarav added</Text>
          <Text style={styles.chipStrong}>Dinner · INR 1,850</Text>
        </View>
      </Animated.View>
    </View>
  )
}

function InfoCard({ item, soon }) {
  return (
    <View style={styles.infoCard}>
      <View style={[styles.infoIcon, { backgroundColor: item.tint }]}>
        <Text style={{ fontSize: 20 }}>{item.icon}</Text>
      </View>
      <Text style={styles.infoTitle}>{item.title}</Text>
      <Text style={styles.infoBody}>{item.body}</Text>
      {soon ? <View style={[styles.pill, { alignSelf: 'flex-start', marginTop: spacing.sm }]}>
        <Text style={styles.pillText}>Soon</Text>
      </View> : null}
    </View>
  )
}

export default function WelcomeScreen() {
  const router = useRouter()
  const scrollRef = useRef(null)
  const featuresY = useRef(0)
  const reduceMotion = useReduceMotion()

  const goToLogin = () => router.push('/(auth)/login')
  const scrollToFeatures = () => scrollRef.current?.scrollTo({ y: featuresY.current, animated: true })

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <BrandMark />
          <Text style={styles.brandName}>SplitWise</Text>
        </View>
        <TouchableOpacity onPress={goToLogin} style={styles.signInPill} accessibilityRole="button"
          accessibilityLabel="Sign in">
          <Text style={styles.signInText}>Sign in</Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: spacing.section }}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.blob, { left: -120, top: -140, backgroundColor: 'rgba(255,69,0,0.06)' }]} />
          <View style={[styles.blob, { right: -140, top: 60, backgroundColor: 'rgba(255,184,0,0.08)' }]} />

          <View style={[styles.pill, { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
            <View style={styles.accentDot} />
            <Text style={styles.pillText}>Now available on Android</Text>
          </View>

          <Text style={styles.heroTitle} accessibilityRole="header">
            Split the bill,{'\n'}
            <Text style={{ color: colors.accent }}>not the friendship.</Text>
          </Text>
          <Text style={styles.heroBody}>
            Plan trips, track shared spending, and settle up in a tap. SplitWise keeps every balance clear,
            every invite simple, and every group on the same page.
          </Text>

          <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
            <TouchableOpacity onPress={goToLogin} style={styles.primaryBtn} activeOpacity={0.85}
              accessibilityRole="button">
              <Text style={styles.primaryBtnText}>Get started</Text>
              <Text style={[styles.primaryBtnText, { fontSize: 18 }]}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={scrollToFeatures} style={styles.ghostBtn} activeOpacity={0.85}
              accessibilityRole="button">
              <Text style={styles.ghostBtnText}>See what it does</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.checks}>
            <Check label="Free to use" />
            <Check label="Same Google login" />
            <Check label="Web and Android" />
          </View>

          <HeroVisual animate={!reduceMotion} />
        </View>

        {/* Features */}
        <View style={styles.bandSurface} onLayout={(e) => { featuresY.current = e.nativeEvent.layout.y }}>
          <View style={[styles.pill, styles.pillInk]}>
            <Text style={[styles.pillText, { color: colors.white }]}>Everything in one place</Text>
          </View>
          <Text style={styles.sectionTitle} accessibilityRole="header">Less math. More trip.</Text>
          <Text style={styles.sectionBody}>
            Built for real groups: the friend who pays first, the one who forgets, and everyone in between.
          </Text>
          <View style={styles.cardList}>
            {FEATURES.map((f) => <InfoCard key={f.title} item={f} />)}
          </View>
        </View>

        {/* CTA */}
        <View style={styles.band}>
          <View style={styles.ctaCard}>
            <View style={styles.ctaGlow} />
            <View style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start' }]}>
              <Text style={[styles.pillText, { color: '#FFD9C7' }]}>One account everywhere</Text>
            </View>
            <Text style={styles.ctaTitle}>Your trips, in your pocket.</Text>
            <Text style={styles.ctaBody}>
              Sign in with Google. It is the same account as the web app, so your trips are already here
              when you open it.
            </Text>
            <View style={[styles.checks, { marginTop: spacing.md }]}>
              <Check light label="Live sync" />
              <Check light label="Works offline" />
              <Check light label="Free" />
            </View>
            <TouchableOpacity onPress={goToLogin} style={styles.ctaBtn} activeOpacity={0.85}
              accessibilityRole="button">
              <Text style={styles.ctaBtnText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Roadmap */}
        <View style={styles.bandSurface}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>✨ Coming to the library</Text>
          </View>
          <Text style={styles.sectionTitle} accessibilityRole="header">The next chapter is agentic.</Text>
          <Text style={styles.sectionBody}>
            We are turning SplitWise into a shared trip library: a place where plans, templates, and profiles
            get smarter together. Here is what is landing next.
          </Text>
          <Text style={[styles.caption, { marginTop: spacing.xs }]}>Roadmap · 2026</Text>

          <View style={styles.cardList}>
            <View style={styles.flagship}>
              <View style={[styles.pill, styles.pillInk]}>
                <Text style={[styles.pillText, { color: colors.white }]}>Flagship</Text>
              </View>
              <Text style={styles.flagshipTitle}>Agentic trip planner</Text>
              <Text style={styles.infoBody}>
                Describe the trip in one sentence. The planner drafts the itinerary, estimates the budget,
                sets up the splits, and keeps the whole group in sync from day one.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md }}>
                {['Itinerary', 'Budget', 'Auto-splits', 'Group-ready'].map((tag) => (
                  <View key={tag} style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                    <Text style={styles.pillText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
            {ROADMAP.map((r) => <InfoCard key={r.title} item={r} soon />)}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <BrandMark size={30} />
            <Text style={[styles.brandName, { fontSize: 22 }]}>SplitWise</Text>
          </View>
          <Text style={[styles.sectionBody, { marginTop: spacing.xs }]}>Shared expenses, settled simply.</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={scrollToFeatures}><Text style={styles.footerLink}>Features</Text></TouchableOpacity>
            <TouchableOpacity onPress={goToLogin}><Text style={styles.footerLink}>Sign in</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL(GITHUB_URL)} accessibilityRole="link">
              <Text style={styles.footerLink}>GitHub</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.caption, { marginTop: spacing.lg }]}>© {YEAR} SplitWise. Built for trips with friends.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.canvas,
  },
  brandName: { fontFamily: SERIF, fontSize: 24, color: colors.ink },
  signInPill: {
    height: 38, paddingHorizontal: spacing.md, borderRadius: 9999, backgroundColor: colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  signInText: { ...type.bodySm, fontWeight: '600', color: colors.white },

  hero: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.band, overflow: 'hidden' },
  blob: { position: 'absolute', width: 320, height: 320, borderRadius: 160 },
  pill: { backgroundColor: colors.neutral, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  pillInk: { backgroundColor: colors.ink, alignSelf: 'flex-start' },
  pillText: { ...type.captionStrong, color: colors.textMuted },
  accentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  heroTitle: {
    fontFamily: SERIF, fontSize: 44, lineHeight: 46, letterSpacing: -1.4,
    color: colors.ink, marginTop: spacing.lg,
  },
  heroBody: { ...type.bodyLg, color: colors.textMuted, marginTop: spacing.lg },
  primaryBtn: {
    height: 54, borderRadius: 9999, backgroundColor: colors.ink, flexDirection: 'row', gap: 8,
    alignItems: 'center', justifyContent: 'center', ...shadow.sm,
  },
  primaryBtnText: { ...type.bodyMdStrong, color: colors.white },
  ghostBtn: {
    height: 54, borderRadius: 9999, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
  },
  ghostBtnText: { ...type.bodyMdStrong, color: colors.ink },
  checks: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: 6, marginTop: spacing.lg },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  checkMark: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  checkText: { ...type.caption, color: colors.textMuted },

  heroVisual: { marginTop: spacing.xxxl, alignSelf: 'center', width: '100%', maxWidth: 380, paddingHorizontal: spacing.xs },
  phone: {
    borderRadius: 34, backgroundColor: colors.white, borderWidth: 1, borderColor: 'rgba(3,3,2,0.10)',
    padding: 14, ...shadow.md,
  },
  phoneHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 6, paddingBottom: 10 },
  phoneTitle: { fontFamily: SERIF, fontSize: 20, color: colors.ink },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#D1FAE5',
    borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#065F46' },
  liveText: { ...type.captionStrong, color: '#065F46' },
  sunset: { height: 120, borderRadius: 22, overflow: 'hidden', backgroundColor: '#FFB38A' },
  sunsetGlow: { position: 'absolute', left: 0, right: 0, top: 0, height: 60, backgroundColor: '#FFD9C2', opacity: 0.8 },
  sun: { position: 'absolute', right: 48, top: 18, width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#FFF7EF', opacity: 0.9 },
  peak: { position: 'absolute', width: 130, height: 130, transform: [{ rotate: '45deg' }] },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  miniAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.white,
    alignItems: 'center', justifyContent: 'center' },
  miniAvatarText: { fontSize: 11, fontWeight: '600' },
  caption: { ...type.caption, color: colors.textMuted },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  balanceLabel: { ...type.bodySm, color: colors.textMuted },
  balanceValue: { ...type.bodyMdStrong, color: colors.ink },
  netRow: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4, paddingTop: 10 },
  netValue: { fontFamily: SERIF, fontSize: 22, color: colors.ink },
  mockPrimary: { flex: 1, height: 42, borderRadius: 9999, backgroundColor: colors.ink,
    alignItems: 'center', justifyContent: 'center' },
  mockPrimaryText: { ...type.bodySm, fontWeight: '600', color: colors.white },
  mockGhost: { width: 46, height: 42, borderRadius: 9999, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center' },
  floatChip: {
    position: 'absolute', right: -4, bottom: -22, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(3,3,2,0.09)',
    paddingHorizontal: 12, paddingVertical: 10, ...shadow.md,
  },
  chipStrong: { ...type.bodySm, fontWeight: '500', color: colors.ink },

  bandSurface: {
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.band,
  },
  band: { paddingHorizontal: spacing.xl, paddingVertical: spacing.band },
  sectionTitle: { fontFamily: SERIF, fontSize: 34, lineHeight: 37, letterSpacing: -0.7, color: colors.ink,
    marginTop: spacing.md },
  sectionBody: { ...type.bodyMd, color: colors.textMuted, marginTop: spacing.sm },
  cardList: { gap: spacing.sm, marginTop: spacing.xl },
  infoCard: {
    backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(3,3,2,0.09)',
    padding: spacing.lg, ...shadow.sm,
  },
  infoIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm },
  infoTitle: { ...type.bodyMdStrong, color: colors.ink },
  infoBody: { ...type.bodySm, color: colors.textMuted, marginTop: 4 },
  flagship: {
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(3,3,2,0.09)', backgroundColor: '#FFE9DC',
    padding: spacing.lg,
  },
  flagshipTitle: { fontFamily: SERIF, fontSize: 28, lineHeight: 31, letterSpacing: -0.6, color: colors.ink,
    marginTop: spacing.md },

  ctaCard: { borderRadius: 28, backgroundColor: '#1D1B19', padding: spacing.xl, overflow: 'hidden', ...shadow.sm },
  ctaGlow: { position: 'absolute', right: -90, top: -110, width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,69,0,0.35)' },
  ctaTitle: { fontFamily: SERIF, fontSize: 32, lineHeight: 35, letterSpacing: -0.6, color: colors.white,
    marginTop: spacing.md },
  ctaBody: { ...type.bodyMd, color: 'rgba(255,255,255,0.70)', marginTop: spacing.sm },
  ctaBtn: { height: 54, borderRadius: 9999, backgroundColor: colors.white, alignItems: 'center',
    justifyContent: 'center', marginTop: spacing.xl },
  ctaBtnText: { ...type.bodyMdStrong, color: colors.ink },

  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, borderTopWidth: 1, borderTopColor: colors.border },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.lg },
  footerLink: { ...type.bodySm, color: colors.textMuted },
})
