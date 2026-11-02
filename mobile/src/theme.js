// Craft Design System — React Native tokens
// Mirrors the web Design.md exactly

export const colors = {
  canvas:       '#FCF9F7',
  ink:          '#030302',
  accent:       '#FF4500',
  neutral:      '#EFEFEF',
  surface:      '#F4F2F0',
  surfaceRaised:'#EAE8E6',
  textMuted:    '#5A5958',
  border:       '#DEDBDA',
  white:        '#FFFFFF',
  // semantic helpers (not in spec — inferred from context)
  success:      '#059669',
  danger:       '#DC2626',
  warning:      '#D97706',
}

export const spacing = {
  xxs:     4,
  xs:      8,
  sm:      12,
  md:      16,
  lg:      20,
  xl:      24,
  xxl:     32,
  xxxl:    40,
  section: 48,
  band:    60,
}

export const radius = {
  none: 0,
  xs:   16,
  sm:   24,
  full: 9999,
  // component-specific
  input:  12,
  button: 9999,
  card:   16,
  badge:  9999,
  avatar: 9999,
}

// Craft serif = Lora (closest available via expo-google-fonts or system serif)
// Craft sans  = Inter (system default on most devices, or expo-google-fonts)
export const fonts = {
  serif: 'serif',  // replaced with loaded font in _layout
  sans:  'System',
}

export const shadow = {
  sm: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius:  8,
    elevation:     3,
  },
  md: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius:  12,
    elevation:     6,
  },
}

// Typography scale — matches Design.md exactly
export const type = {
  displayLg: { fontSize: 36, fontWeight: '400', lineHeight: 42, letterSpacing: -1.08 },
  displayMd: { fontSize: 28, fontWeight: '400', lineHeight: 34, letterSpacing: -0.56 },
  displaySm: { fontSize: 24, fontWeight: '400', lineHeight: 29, letterSpacing: -0.72 },
  headingLg: { fontSize: 22, fontWeight: '400', lineHeight: 26, letterSpacing: -0.66 },
  headingSm: { fontSize: 13, fontWeight: '600', lineHeight: 20, letterSpacing: 0.5,  textTransform: 'uppercase' },
  headingXs: { fontSize: 11, fontWeight: '600', lineHeight: 18, letterSpacing: 0.4,  textTransform: 'uppercase' },
  bodyLg:    { fontSize: 17, fontWeight: '400', lineHeight: 24, letterSpacing: -0.2  },
  bodyMd:    { fontSize: 15, fontWeight: '400', lineHeight: 22, letterSpacing: 0     },
  bodyMdStrong: { fontSize: 15, fontWeight: '600', lineHeight: 22, letterSpacing: -0.2 },
  bodySm:    { fontSize: 13, fontWeight: '400', lineHeight: 20, letterSpacing: 0     },
  caption:   { fontSize: 12, fontWeight: '400', lineHeight: 18, letterSpacing: 0     },
  captionStrong: { fontSize: 12, fontWeight: '600', lineHeight: 18, letterSpacing: 0 },
}
