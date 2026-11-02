---
version: alpha
name: Craft
description: |
  Craft embodies a clean, modern productivity aesthetic that balances playful
  accessibility with professional function. The design language is understated
  and calm, with generous whitespace, soft transitions, and a deliberately
  minimal color palette that doesn't distract from user content. The brand
  expresses optimism and clarity through a sophisticated serif-sans pairing and
  a warm, light canvas (#FCF9F7), creating an atmosphere that feels both
  inviting and uncluttered. Decorative elements—subtle gradients, soft shadows,
  and organic illustration—appear sparingly and purposefully, reinforcing a
  sense of focused creativity rather than visual noise. The system prioritizes
  legibility and hierarchy through tightly controlled typography, with display
  sizes featuring pronounced negative letter-spacing that creates an elegant,
  confident voice.
source:
  url: "https://www.craft.do/"
  pagesAnalyzed: 1
  extractedAt: 2026-11-02
  tokensMeasured: true
colors:
  primary: "#030302"
  canvas: "#FCF9F7"
  ink: "#030302"
  accent-1: "#FF4500"
  neutral-1: "#EFEFEF"
typography:
  display-xl:
    fontFamily: UntitledSerifFont
    fontSize: 66px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: -1.98px
  display-lg:
    fontFamily: UntitledSerifFont
    fontSize: 56px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -1.68px
  display-md:
    fontFamily: UntitledSerifFont
    fontSize: 54px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -1.08px
  display-sm:
    fontFamily: UntitledSerifFont
    fontSize: 46px
    fontWeight: 400
    lineHeight: 1.22
    letterSpacing: -1.38px
  heading-xl:
    fontFamily: UntitledSerifFont
    fontSize: 36px
    fontWeight: 400
    lineHeight: 1.22
    letterSpacing: -1.08px
  heading-xl-tight:
    fontFamily: UntitledSerifFont
    fontSize: 36px
    fontWeight: 400
    lineHeight: 1.11
    letterSpacing: -1.44px
  heading-lg:
    fontFamily: UntitledSerifFont
    fontSize: 30px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: -0.9px
  heading-md:
    fontFamily: UntitledSerifFont
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.56px
  heading-sm:
    fontFamily: UntitledSansFont
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0.16px
    textTransform: uppercase
  heading-xs:
    fontFamily: UntitledSansFont
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0.14px
    textTransform: uppercase
  quote:
    fontFamily: UntitledSerifFont
    fontSize: 32px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: -1.28px
  body-xl:
    fontFamily: UntitledSerifFont
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.72px
  body-lg:
    fontFamily: UntitledSansFont
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: -0.36px
  body-md:
    fontFamily: UntitledSansFont
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  body-md-strong:
    fontFamily: UntitledSansFont
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: -0.32px
  body-md-uppercase:
    fontFamily: UntitledSansFont
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: -0.32px
    textTransform: uppercase
  body-sm:
    fontFamily: UntitledSansFont
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  button:
    fontFamily: UntitledSansFont
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: -0.32px
  caption-xs:
    fontFamily: apple-system
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  caption-xs-tight:
    fontFamily: apple-system
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: -0.24px
  caption-xs-strong:
    fontFamily: apple-system
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0px
rounded:
  none: 0px
  xs: 16px
  sm: 24px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  xxxl: 40px
  section: 48px
  band: 60px
borderWidths:
  thin: 1px
shadows:
  sm: "rgba(0, 0, 0, 0.01) 0px 50px 40px 0px, rgba(0, 0, 0, 0.02) 0px 50px 40px 0px, rgba(0, 0, 0, 0.05) 0px 20px 40px 0px, rgba(0, 0, 0, 0.08) 0px 3px 10px 0px"
  md: "rgba(0, 0, 0, 0.1) 0px 12px 12px 2px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px"
  lg: "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px"
elevationStrategy: layered-micro
themes:
  derived: dark   # the other theme is the site's measured palette
  light:
    bg: "#FCF9F7"
    surface: "#F4F2F0"
    surfaceRaised: "#EAE8E6"
    text: "#030302"
    textMuted: "#5A5958"
    border: "#DEDBDA"
    accent: "#030302"
    accentFg: "#FFFFFF"
    focusRing: "#030302"
    elevation: shadow
  dark:
    bg: "#0F0F0F"
    surface: "#1D1D1D"
    surfaceRaised: "#292929"
    text: "#F5F5F5"
    textMuted: "#9E9E9E"
    border: "#353535"
    accent: "#7D7D54"
    accentFg: "#0B0B0C"
    focusRing: "#656543"
    elevation: "border+surface"
gradients:
  - context: hero
    kind: linear
    value: "linear-gradient(in oklab, rgb(158, 212, 239) 0px, rgb(209, 238, 249) 100%)"
  - context: hero
    kind: linear
    value: "linear-gradient(in oklab, rgba(0, 0, 0, 0) 0px, rgb(255, 255, 255) 100%)"
  - context: section
    kind: linear
    value: "linear-gradient(rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.59) 25%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.84) 75%)"
  - context: section
    kind: linear
    value: "linear-gradient(rgba(255, 255, 255, 0.4) 10%, rgba(255, 255, 255, 0.8))"
  - context: section
    kind: linear
    value: "linear-gradient(oklab(0 0 0 / 0) 0px, rgb(255, 255, 255) 100%)"
  - context: section
    kind: linear
    value: "linear-gradient(oklab(0 0 0 / 0) 0px, rgb(255, 243, 231) 100%)"
components:
  button-primary:
    typography: "{typography.heading-sm}"
    textColor: "rgb(255, 255, 255)"
    height: 56px
    padding: "16px 32px 16px 32px"
    boxShadow: "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px"
    rounded: "{rounded.sm}"
    backgroundColor: "{colors.primary}"
  button-filled:
    textColor: "{colors.ink}"
    height: 44px
    padding: "12px 16px 12px 16px"
    fontSize: 14px
    fontFamily: UntitledSansFont
    fontWeight: 500
    lineHeight: 1.43
    rounded: 14px
    backgroundColor: "rgb(155, 216, 169)"
  button-primary-sm:
    typography: "{typography.heading-sm}"
    textColor: "rgb(255, 255, 255)"
    height: 36px
    padding: "8px 14px 8px 14px"
    boxShadow: "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px"
    rounded: "3.35544e+07px"
    backgroundColor: "{colors.primary}"
  button-text:
    typography: "{typography.heading-sm}"
    textColor: "{colors.ink}"
    height: 56px
    padding: "16px 32px 16px 32px"
    boxShadow: "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 12px 12px 2px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px"
    rounded: "{rounded.sm}"
    backgroundColor: "oklab(1 0 5.96046e-8 / 0.4)"
  button-filled-lg:
    typography: "{typography.heading-sm}"
    textColor: "{colors.ink}"
    height: 48px
    padding: "16px 32px 16px 32px"
    rounded: "3.35544e+07px"
    backgroundColor: "rgb(255, 255, 255)"
  button-outline:
    typography: "{typography.body-md}"
    textColor: "rgb(255, 255, 255)"
    border: "1px solid oklab(1 0 5.96046e-8 / 0.3)"
    height: 32px
    padding: "3px 3px 3px 3px"
    rounded: 8px
  card:
    typography: "{typography.body-md}"
    textColor: "{colors.ink}"
    border: "1px solid rgba(3, 3, 2, 0.09)"
    boxShadow: "rgba(0, 0, 0, 0.01) 0px 50px 40px 0px, rgba(0, 0, 0, 0.02) 0px 50px 40px 0px, rgba(0, 0, 0, 0.05) 0px 20px 40px 0px, rgba(0, 0, 0, 0.08) 0px 3px 10px 0px"
    rounded: "{rounded.xs}"
    backgroundColor: "rgb(255, 255, 255)"
  card-2:
    typography: "{typography.body-md}"
    textColor: "rgb(255, 255, 255)"
    border: "1px solid rgba(3, 3, 2, 0.09)"
    boxShadow: "rgba(0, 0, 0, 0.01) 0px 50px 40px 0px, rgba(0, 0, 0, 0.02) 0px 50px 40px 0px, rgba(0, 0, 0, 0.05) 0px 20px 40px 0px, rgba(0, 0, 0, 0.08) 0px 3px 10px 0px"
    rounded: "{rounded.xs}"
    backgroundColor: "rgb(255, 255, 255)"
  card-featured:
    typography: "{typography.body-md}"
    textColor: "{colors.ink}"
    padding: "24px 24px 24px 24px"
    boxShadow: "rgba(0, 0, 0, 0.01) 0px 50px 40px 0px, rgba(0, 0, 0, 0.02) 0px 50px 40px 0px, rgba(0, 0, 0, 0.05) 0px 20px 40px 0px, rgba(0, 0, 0, 0.08) 0px 3px 10px 0px"
    rounded: "{rounded.sm}"
    backgroundColor: "{colors.accent-1}"
  navigation:
    typography: "{typography.body-md}"
    textColor: "{colors.ink}"
    height: 24px
  footer:
    typography: "{typography.body-md}"
    textColor: "{colors.ink}"
    padding: "0px 24px 0px 24px"
    rounded: "{rounded.sm}"
    backgroundColor: "{colors.primary}"
  link:
    typography: "{typography.body-md}"
    textColor: "rgba(3, 3, 2, 0.75)"
    padding: "24px 24px 24px 24px"
    boxShadow: "rgba(0, 0, 0, 0.01) 0px 50px 40px 0px, rgba(0, 0, 0, 0.02) 0px 50px 40px 0px, rgba(0, 0, 0, 0.05) 0px 20px 40px 0px, rgba(0, 0, 0, 0.08) 0px 3px 10px 0px"
    rounded: "{rounded.xs}"
    backgroundColor: "oklab(1 0 5.96046e-8 / 0.9)"
  link-lg:
    typography: "{typography.body-md}"
    textColor: "rgba(3, 3, 2, 0.75)"
states:
  link-hover:
    target: link
    state: hover
    textColor: "rgba(3, 3, 2, 0.9)"
  other-hover:
    target: other
    state: hover
    borderColor: "rgba(3, 3, 2, 0.2)"
  card-hover:
    target: card
    state: hover
    backgroundColor: "rgba(3, 3, 2, 0.1)"
  other-focus:
    target: other
    state: focus
    borderColor: "rgba(3, 3, 2, 0.15)"
breakpoints:
  - width: 375
    containerWidth: 343
    gridColumns: 4
    navLinksVisible: 17
    menuToggleVisible: true
    headingPx: 48
    bodyPx: 16
    sectionPaddingX: 16
  - width: 768
    containerWidth: 736
    gridColumns: 5
    navLinksVisible: 4
    menuToggleVisible: true
    headingPx: 58
    bodyPx: 16
    sectionPaddingX: 16
  - width: 1024
    containerWidth: 984
    gridColumns: 6
    navLinksVisible: 6
    menuToggleVisible: true
    headingPx: 62
    bodyPx: 16
    sectionPaddingX: 20
  - width: 1280
    containerWidth: 1240
    gridColumns: 6
    navLinksVisible: 6
    menuToggleVisible: true
    headingPx: 66
    bodyPx: 16
    sectionPaddingX: 20
  - width: 1440
    containerWidth: 1400
    gridColumns: 6
    navLinksVisible: 6
    menuToggleVisible: true
    headingPx: 66
    bodyPx: 16
    sectionPaddingX: 20
coverage:
  statesFound: 62
  gradientsFound: 6
  rolesUnassigned: 2
  archetypesUnnamed: 0
  archetypesDetected: 0
  responsiveMeasured: true
  stylesheetsBlocked: false
  semanticRampDeclared: false
---

# Design System Inspired by Craft

## 1. Visual Theme & Atmosphere

Craft embodies a **clean, modern productivity aesthetic** that balances playful accessibility with professional function. The design language is understated and calm, with generous whitespace, soft transitions, and a deliberately minimal color palette that doesn't distract from user content. The brand expresses optimism and clarity through a sophisticated serif-sans pairing and a warm, light canvas (`{colors.canvas}` — `#FCF9F7`), creating an atmosphere that feels both inviting and uncluttered. Decorative elements—subtle gradients, soft shadows, and organic illustration—appear sparingly and purposefully, reinforcing a sense of focused creativity rather than visual noise. The system prioritizes legibility and hierarchy through tightly controlled typography, with display sizes featuring pronounced negative letter-spacing that creates an elegant, confident voice.

**Key Characteristics**
- Warm, off-white canvas (`#FCF9F7`) as the dominant neutral backdrop
- Deep ink primary (`#030302`) for headings, CTAs, and brand moments
- Pill-shaped buttons (`{rounded.full}`) as the signature affordance
- Serif display faces for headlines, sans-serif for body and UI
- Layered micro-shadows for barely-visible depth cues
- Restrained color palette with minimal saturation
- Generous internal spacing within components and sections
- Negative letter-spacing on large text for visual sophistication

## 2. Color Palette & Roles

### Primary
- **Primary / Brand / Ink** (`{colors.primary}` — `#030302`): Used for headings, primary call-to-action buttons, active states, and all primary text. The brand's core dark anchor, providing maximum contrast against light surfaces.

### Neutral Scale
- **Canvas** (`{colors.canvas}` — `#FCF9F7`): Default page background and primary surface. A warm off-white that defines the system's calm, approachable aesthetic.
- **Neutral** (`{colors.neutral-1}` — `#EFEFEF`): Secondary neutral for subtle surface differentiation, borders, and disabled states.

### Accent Colors
- **Accent Decorative** (`{colors.accent-1}` — `#FF4500`): A warm orange-red used for decorative and highlighted moments (e.g., featured card backgrounds, illustration accents). No primary UI role; serves as a visual highlight and energy point.

### Interactive & Semantic
No error, success, or warning semantic colors are declared in the site's markup. All interactive state changes rely on opacity shifts, border refinements, and hover layer treatments rather than color swaps.

## 3. Typography Rules

### Font Family

**Primary Display Face (UntitledSerifFont)**
Serif font stack: `UntitledSerifFont, Georgia, serif`
Used for headlines, display text, and brand-forward messaging. Conveys sophistication and editorial authority.

**Primary Body Face (UntitledSansFont)**
Sans-serif font stack: `UntitledSansFont, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`
Used for navigation, buttons, body copy, and UI labels. Ensures legibility at small sizes and on interactive elements.

**System Fallback (apple-system)**
System stack: `apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`
Captions and utility text. Guarantees legibility when custom fonts fail to load.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|---|
| Display XL | UntitledSerifFont | 66px | 400 | 1 | −1.98px | Hero headlines, maximum presence |
| Display LG | UntitledSerifFont | 56px | 400 | 1.1 | −1.68px | Section hero text, strong emphasis |
| Display SM | UntitledSerifFont | 46px | 400 | 1.22 | −1.38px | Secondary headlines, featured sections |
| Display MD | UntitledSerifFont | 54px | 400 | 1.1 | −1.08px | Large feature text |
| Heading XL | UntitledSerifFont | 36px | 400 | 1.22 | −1.08px | Page section headers |
| Heading XL Tight | UntitledSerifFont | 36px | 400 | 1.11 | −1.44px | Condensed heading variant |
| Heading LG | UntitledSerifFont | 30px | 400 | 1 | −0.9px | Subsection headers |
| Heading MD | UntitledSerifFont | 28px | 400 | 1.2 | −0.56px | Card titles, module headers |
| Quote | UntitledSerifFont | 32px | 400 | 1.5 | −1.28px | Testimonial and callout text |
| Body XL | UntitledSerifFont | 24px | 400 | 1.2 | −0.72px | Feature body copy |
| Body LG | UntitledSansFont | 18px | 400 | 1.4 | −0.36px | Large supporting text |
| Body MD | UntitledSansFont | 16px | 400 | 1.5 | 0px | Standard body copy and list items |
| Body MD Strong | UntitledSansFont | 16px | 500 | 1.4 | −0.32px | Emphasized inline text |
| Body MD Uppercase | UntitledSansFont | 16px | 500 | 1.4 | −0.32px | Uppercase labels and micro-headings |
| Button | UntitledSansFont | 16px | 400 | 1.4 | −0.32px | Button and link text |
| Heading SM | UntitledSansFont | 16px | 500 | 1.5 | 0.16px / 0px | Uppercase section labels and form headers |
| Heading XS | UntitledSansFont | 14px | 500 | 1.5 | 0.14px | Uppercase micro-headings and badges |
| Body SM | UntitledSansFont | 14px | 400 | 1.5 | 0px | Small supporting text and secondary copy |
| Caption XS | apple-system | 12px | 400 | 1.5 | 0px | Fine print, metadata, timestamps |
| Caption XS Strong | apple-system | 12px | 600 | 1.5 | 0px | Emphasized caption, strong fine print |
| Caption XS Tight | apple-system | 12px | 400 | 1.4 | −0.24px | Compact captions with tighter leading |

### Principles

- **Negative tracking on display** — All serif display sizes (`{typography.display-xl}` through `{typography.quote}`) employ tightly controlled negative letter-spacing (−0.56px to −1.98px) to create visual confidence and elegance; this is a defining trait of the brand voice.
- **Serif for authority** — Headlines and display text use UntitledSerifFont to convey editorial craft and intentionality.
- **Sans-serif for clarity** — Navigation, buttons, and body copy rely on UntitledSansFont (or system fallback) for legibility and modern, accessible interface design.
- **Generous line heights on body** — Body and caption text use 1.4–1.5 line-height for comfortable reading and accessibility.
- **Consistent 16px button baseline** — Most interactive text is 16px, creating a predictable affordance scale.
- **Uppercase for micro-hierarchy** — Section labels, headings, and badges use `text-transform: uppercase` at smaller scales (14px–16px) to create visual breaks and scanability.

## 4. Component Stylings

### Buttons

**Primary Button**
- **Font**: `{typography.body-md-strong}` (16px, weight 500, UntitledSansFont)
- **Background**: `{colors.primary}` (`#030302`)
- **Text Color**: `#FFFFFF`
- **Padding**: `{spacing.md}` `{spacing.xl}` (`16px 32px`)
- **Height**: `56px`
- **Border Radius**: `{rounded.full}` (9999px, pill shape)
- **Border**: none
- **Box Shadow**: `rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px`
- **Width**: fits content (320px as measured)
- **Hover**: Text and background remain; shadow layer applies via composite ring effect
- **Role**: Primary call-to-action (sign-up, free trial, main interaction)

**Primary Button Small**
- **Font**: `{typography.body-md-strong}` (16px, weight 500, UntitledSansFont)
- **Background**: `{colors.primary}` (`#030302`)
- **Text Color**: `#FFFFFF`
- **Padding**: `{spacing.xs}` `{spacing.sm}` (`8px 14px`)
- **Height**: `36px`
- **Border Radius**: `{rounded.full}` (9999px, pill shape)
- **Border**: none
- **Box Shadow**: `rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px`
- **Width**: fits content (133px as measured)
- **Role**: Compact primary action, secondary locations

**Filled Button (Green)**
- **Font**: `{typography.heading-xs}` (14px, weight 500, UntitledSansFont)
- **Background**: `#9BD8A9` (green, accent variant)
- **Text Color**: `{colors.primary}` (`#030302`)
- **Padding**: `{spacing.sm}` (`12px 16px`)
- **Height**: `44px`
- **Border Radius**: `14px`
- **Border**: none
- **Box Shadow**: none
- **Width**: fits content (296px as measured)
- **Role**: Secondary / positive action; calls less urgency than primary

**Filled Button Large (White)**
- **Font**: `{typography.body-md-strong}` (16px, weight 500, UntitledSansFont)
- **Background**: `#FFFFFF`
- **Text Color**: `{colors.primary}` (`#030302`)
- **Padding**: `{spacing.md}` `{spacing.xl}` (`16px 32px`)
- **Height**: `48px`
- **Border Radius**: `{rounded.full}` (9999px, pill shape)
- **Border**: none
- **Box Shadow**: none
- **Width**: fits content (188px as measured)
- **Role**: Secondary call-to-action on dark or contrasting backgrounds

**Text Button**
- **Font**: `{typography.body-md-strong}` (16px, weight 500, UntitledSansFont)
- **Background**: `rgba(1, 1, 1, 0.04)` (nearly transparent, light hover layer)
- **Text Color**: `{colors.primary}` (`#030302`)
- **Padding**: `{spacing.md}` `{spacing.xl}` (`16px 32px`)
- **Height**: `56px`
- **Border Radius**: `{rounded.full}` (9999px, pill shape)
- **Border**: none
- **Box Shadow**: `rgba(0, 0, 0, 0.1) 0px 12px 12px 2px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px`
- **Width**: fits content (193px as measured)
- **Role**: Tertiary / ghost action; minimal visual weight, contextual or footer use

**Outline Button (Icon)**
- **Font**: `{typography.body-md-strong}` (16px, weight 400, UntitledSansFont)
- **Background**: transparent (`rgba(0, 0, 0, 0)`)
- **Text Color**: `#FFFFFF`
- **Padding**: `{spacing.xxs}` (`3px`)
- **Height**: `32px`
- **Width**: `32px`
- **Border**: `1px solid rgba(1, 1, 1, 0.3)` (subtle light border)
- **Border Radius**: `8px`
- **Box Shadow**: none
- **Role**: Icon-only action button, typically on dark/image backgrounds

### Cards & Containers

**Card Default**
- **Font**: `{typography.body-md}` (16px, weight 400, UntitledSansFont)
- **Background**: `#FFFFFF`
- **Text Color**: `{colors.primary}` (`#030302`)
- **Padding**: none (container acts as flex/grid parent; interior content uses `{spacing.md}`–`{spacing.xl}`)
- **Border**: `1px solid rgba(3, 3, 2, 0.09)` (hairline neutral)
- **Border Radius**: `{rounded.xs}` (16px)
- **Box Shadow**: `{shadows.sm}` (`rgba(0, 0, 0, 0.01) 0px 50px 40px 0px, rgba(0, 0, 0, 0.02) 0px 50px 40px 0px, rgba(0, 0, 0, 0.05) 0px 20px 40px 0px, rgba(0, 0, 0, 0.08) 0px 3px 10px 0px`)
- **Width**: 440px (or responsive full-width container)
- **Height**: auto (422px as measured)
- **Hover**: Background shifts to `rgba(3, 3, 2, 0.1)` (subtle darkening); opacity may reach `1` for full visibility

**Card Featured**
- **Font**: `{typography.body-md}` (16px, weight 400, UntitledSansFont)
- **Background**: `{colors.accent-1}` (`#FF4500`, warm orange-red)
- **Text Color**: `#FFFFFF`
- **Padding**: `{spacing.xl}` (`24px`)
- **Border**: none
- **Border Radius**: `{rounded.sm}` (24px)
- **Box Shadow**: `{shadows.sm}`
- **Width**: 248px (or responsive square/flex container)
- **Height**: 248px (square as measured)
- **Role**: Hero or highlight card; draws attention through color and prominence

### Inputs & Forms

No specific form input component data was extracted from the site's measured styles. See **Known Gaps** for details.

### Navigation

**Navigation Bar Default**
- **Font**: `{typography.body-md}` (16px, weight 400, UntitledSansFont)
- **Background**: transparent (`rgba(0, 0, 0, 0)`)
- **Text Color**: `{colors.primary}` (`#030302`)
- **Border**: none
- **Border Radius**: `{rounded.none}` (0px, sharp edges)
- **Box Shadow**: none
- **Height**: 24px (or natural fit)
- **Padding**: none (links use inline spacing)
- **Hover State** (links): Text color becomes `rgba(3, 3, 2, 0.9)` (slightly darkened)
- **Role**: Top-level site navigation, responsive collapse at mobile breakpoints

### Footer

**Footer Default**
- **Font**: `{typography.body-md}` (16px, weight 400, UntitledSansFont)
- **Background**: `{colors.primary}` (`#030302`, dark)
- **Text Color**: `rgba(3, 3, 2, 0.75)` (lighter ink on dark, reduced contrast for secondary hierarchy)
- **Border**: none
- **Border Radius**: `{rounded.sm}` (24px, soft top corners)
- **Box Shadow**: none
- **Padding**: `{spacing.md}` horizontal (`24px`)
- **Width**: full container (1408px as measured)
- **Height**: auto (562.5px as measured)
- **Role**: Site-wide footer; contains links, legal, secondary navigation

## 5. Layout Principles

### Spacing System

Craft uses an 8px base unit scaled into a geometric progression, allowing predictable, composable whitespace:

- **`{spacing.xxs}`** = 4px — smallest gap, micro-spacing within components (e.g., icon–text pairs)
- **`{spacing.xs}`** = 8px — tight padding for small UI elements (buttons, tags, narrow containers)
- **`{spacing.sm}`** = 12px — snug spacing for compact layouts and button-like elements
- **`{spacing.md}`** = 16px — default/standard padding for most components (cards, sections, buttons)
- **`{spacing.lg}`** = 20px — comfortable breathing room between component groups
- **`{spacing.xl}`** = 24px — generous internal padding for prominent cards or sections
- **`{spacing.xxl}`** = 32px — substantial vertical or horizontal breaks between major content blocks
- **`{spacing.xxxl}`** = 40px — emphatic separation (e.g., above a section heading)
- **`{spacing.section}`** = 48px — major content section vertical margins and padding
- **`{spacing.band}`** = 60px — hero or full-width section rhythm

**Usage Context**:
- Component padding: `{spacing.md}` to `{spacing.xl}`
- Section margins: `{spacing.section}` to `{spacing.band}`
- Tight inline gaps: `{spacing.xs}` to `{spacing.sm}`
- Hero/banner vertical padding: `{spacing.band}`

### Grid & Container

- **Max Width**: 1240px content column (responsive to 1400px at 1440px viewport)
- **Column Strategy**: 
  - Mobile (375px): 4-column grid, single-content flow
  - Tablet (768px): 5-column grid
  - Desktop (1024px+): 6-column grid
- **Section Padding**: `{spacing.md}` (16px) horizontal at all breakpoints; increases to `{spacing.lg}` (20px) at 1024px and above
- **Container Pattern**: Full-width sections (100vw) with centered max-width content containers; section backgrounds bleed to edges while content respects max-width

### Whitespace Philosophy

The design embraces **assertive, structured whitespace** as a core principle:

- **Breathing room**: Large gaps between section blocks (`{spacing.section}`–`{spacing.band}`) create visual rest and clear semantic boundaries.
- **Generous internal padding**: Cards and components use `{spacing.xl}` (24px) or more, never cramping content.
- **Negative space as hierarchy**: Empty space itself signals importance; content-dense sections are rare and intentional.
- **Responsive scaling**: Whitespace reduces at smaller viewports to preserve readability, but never disappears entirely.
- **Soft edges**: Curved corners (`{rounded.xs}`–`{rounded.sm}`) on cards and containers enhance the spacious, uncluttered feel.

### Border Radius Scale

- **`{rounded.none}`** = 0px — sharp, architectural edge; used sparingly on footer or navigation edges
- **`{rounded.xs}`** = 16px — subtle rounding on cards and standard containers; default component radius
- **`{rounded.sm}`** = 24px — softer, more welcoming curves on larger featured cards and footer sections
- **`{rounded.full}`** = 9999px — pill shape; applied exclusively to buttons (primary, small, text variants) and some small UI affordances

**Component Radius Mapping**:
- Buttons (primary, small, text): `{rounded.full}` (pill)
- Cards (standard, featured): `{rounded.xs}` to `{rounded.sm}`
- Navigation / footer: `{rounded.none}` or `{rounded.sm}`
- Images: `{rounded.none}` (unrounded, photograph-like)

### Border Widths

- **Thin** = 1px — used on card and container borders for subtle visual definition without heaviness (`rgba(3, 3, 2, 0.09)` on most elements)

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat (base) | No shadow; background or border only | Text, icons, flat UI sections, body background |
| Micro Lift (sm) | `rgba(0, 0, 0, 0.01) 0px 50px 40px 0px, rgba(0, 0, 0, 0.02) 0px 50px 40px 0px, rgba(0, 0, 0, 0.05) 0px 20px 40px 0px, rgba(0, 0, 0, 0.08) 0px 3px 10px 0px` | Cards, containers, standard elevated surfaces |
| Subtle Lift (md) | `rgba(0, 0, 0, 0.1) 0px 12px 12px 2px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px` | Navigation bar, subtle overlays, tertiary buttons |
| Soft Lift (lg) | `rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px` | Primary buttons, interactive surfaces receiving focus |

**Shadow Philosophy**: The system uses a **layered-micro** elevation strategy. Rather than a single heavy shadow, each level stacks multiple barely-transparent layers to create barely-perceptible depth cues. This avoids harsh drop-shadows and maintains the calm, refined aesthetic. Depth is implied through subtle layering and color shifts rather than aggressive 3D effects.

### Opacity Levels

- **30%** (0.30) — heavily muted elements, disabled text
- **50%** (0.50) — secondary or supporting content; medium reduction
- **60%** (0.60) — reduced emphasis for tertiary or contextual information
- **75%** (0.75) — lightly muted text, secondary headings, supporting labels
- **80%** (0.80) — near-full visibility; minimal opacity shift for hover or emphasis
- **20%** (0.20) — strong reduction for backgrounds, overlays, or border softening (e.g., `rgba(3, 3, 2, 0.2)` for hover backgrounds)

These opacity values are used to adjust text color prominence, create hover states, and modulate overlay backgrounds without introducing new hues.

### Z-index / Layering

- **Base** = 1 — default stacking order for regular content
- **Dropdown/Overlay Layer 1** = 10 — floating panels, dropdowns, modals
- **Dropdown/Overlay Layer 2** = 20 — secondary overlays or stacked modals
- **Dropdown/Overlay Layer 3** = 22 — tertiary overlay depth
- **Sticky/Fixed Layer** = 40 — sticky headers, persistent UI
- **Modal/Alert Layer** = 50 — topmost modals, alerts, toasts

Stack modals and overlays in this order to prevent unintended hiding or visual conflicts.

## 7. Do's and Don'ts

### Do

- **Use pill-shaped buttons** — All primary and secondary buttons should employ `{rounded.full}` (9999px) as the signature affordance shape.
- **Apply negative letter-spacing to display text** — All `{typography.display-*}` and `{typography.heading-*}` sizes should preserve their specified letter-spacing values (e.g., −1.98px) to maintain the brand's elegant, confident tone.
- **Respect the spacing system** — Use multiples of the base 8px unit (`{spacing.xs}` through `{spacing.band}`) for all padding, margins, and gaps. Never invent intermediate values.
- **Layer shadows via micro-stacking** — Use the full shadow stack provided for each elevation level; avoid simplifying to a single shadow.
- **Maintain warm canvas tones** — Keep the page background as `{colors.canvas}` (`#FCF9F7`); this warm off-white is central to the calm aesthetic.
- **Ensure serif-sans pairing hierarchy** — Use UntitledSerifFont for headings and display, UntitledSansFont for body and UI, with no mixing within a given role.
- **Test link hover states** — Link text should shift to `rgba(3, 3, 2, 0.9)` on hover; verify this contrast remains sufficient.
- **Use decorative accent color sparingly** — `{colors.accent-1}` (`#FF4500`) should appear only on featured cards or deliberate highlight moments, not as a ubiquitous CTA color.

### Don't

- **Don't use sharp button corners** — Buttons must always be pill-shaped (`{rounded.full}`); square or mildly rounded buttons break the brand voice.
- **Don't drop letter-spacing from headlines** — Never reset display text to `letter-spacing: 0` or normal spacing; the tight, negative tracking is a core design trait.
- **Don't invent new spacing values** — All padding, margins, and gaps must align to the documented spacing scale. Do not add 18px, 22px, or other intermediate values.
- **Don't use harsh drop-shadows** — Avoid single, opaque shadows. Always layer shadow values as specified; micro-shadows are quieter and more refined.
- **Don't apply the primary dark color as a background fill** — `{colors.primary}` (`#030302`) is reserved for text and specific UI roles (footer, nav, buttons). Use `{colors.canvas}` for main backgrounds.
- **Don't mix serif and sans fonts within a single heading or body copy block** — Maintain clear family separation for readability and brand coherence.
- **Don't ignore hover states** — Interactive elements (links, cards, buttons) should demonstrate visible feedback. Refer to the interaction states data for exact color and opacity shifts.
- **Don't introduce semantic colors outside the palette** — Red, green, or yellow alerts should not appear unless explicitly extracted and measured from the live site.

## 8. Responsive Behavior

### Breakpoints

| Viewport Width | Content Width | Grid Columns | Visible Nav Links | Menu Toggle | Display Heading Size | Body Size | Section Padding-X |
|---|---|---|---|---|---|---|---|
| 375px | 343px | 4 | 1–2 | Yes | 48px (`{typography.display-sm}`) | 16px | 16px (`{spacing.md}`) |
| 768px | 736px | 5 | 4 | Yes | 58px (between `display-sm` and `display-lg`) | 16px | 16px (`{spacing.md}`) |
| 1024px | 984px | 6 | 6 | Yes | 62px (between `display-lg` and `display-xl`) | 16px | 20px (`{spacing.lg}`) |
| 1280px | 1240px | 6 | 6 | No | 66px (`{typography.display-xl}`) | 16px | 20px (`{spacing.lg}`) |
| 1440px | 1400px | 6 | 6 | No | 66px (`{typography.display-xl}`) | 16px | 20px (`{spacing.lg}`) |

**Key Changes**:
- **Mobile (375px)**: Single-column or 4-column grid flow; headings scale down to 48px; nav links collapse; menu toggle visible.
- **Tablet (768px)**: 5-column grid; 4 nav links visible inline; heading scales to ~58px.
- **Desktop (1024px+)**: 6-column grid; full 6 nav links visible; section padding increases to 20px; heading reaches full 66px display size.
- **Large (1280px+)**: No further layout shift; nav remains stable; heading at max size.

### Touch Targets

- **Minimum interactive size**: 44px (height/width) — applied to buttons, links, and form inputs on touch devices.
- **Button padding**: Primary buttons use `{spacing.md}` `{spacing.xl}` (16px 32px) with 56px height, exceeding minimum; smaller variants (primary-sm) are 36px, still accessible but compact.
- **Spacing between buttons**: Maintain at least `{spacing.lg}` (20px) gap horizontally and `{spacing.md}` (16px) vertically to prevent mis-taps.

### Collapsing Strategy

- **Navigation collapse**: At mobile viewports, inline nav links collapse into a hamburger menu toggle. The toggle appears at all breakpoints but only controls menu visibility below 1280px.
- **Column reflow**: Featured card grids and multi-column sections reflow to single columns or reduced grids at tablet (768px) and mobile (375px) viewports.
- **Heading scale**: Display text reduces proportionally: 66px → 62px → 58px → 48px as viewport shrinks.
- **Padding reduction**: Section padding-x drops from 20px to 16px at tablet and below, but never collapses further; content edge-to-viewport gap remains consistent.
- **Hero section**: Full-width hero backgrounds and gradients persist across all breakpoints; overlaid content (text, buttons) scales and reflows to fit.

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA / Brand / Ink**: Primary (`{colors.primary}` — `#030302`) — Use for buttons, headings, primary text, and brand moments.
- **Background**: Canvas (`{colors.canvas}` — `#FCF9F7`) — Warm off-white page background.
- **Heading text**: Primary (`{colors.primary}` — `#030302`) — All display and body headings.
- **Neutral / Border**: Neutral (`{colors.neutral-1}` — `#EFEFEF`) — Subtle surface differentiation and borders.
- **Accent / Highlight**: Accent Decorative (`{colors.accent-1}` — `#FF4500`) — Featured cards and decorative highlights only.

### Iteration Guide

1. **Buttons are always pills** — Every button variant uses `{rounded.full}` (9999px). No exceptions for size or state.
2. **Preserve negative letter-spacing** — Display and heading text must retain exact tracking values (e.g., `{typography.display-xl}` at −1.98px). Never normalize to 0.
3. **Layer shadows, never simplify** — Use the full multi-layer shadow values specified for each elevation level (`{shadows.sm}`, `{shadows.md}`, `{shadows.lg}`). A single shadow violates the system.
4. **Serif for headlines, sans for UI** — UntitledSerifFont (or serif fallback) for all `{typography.display-*}` and `{typography.heading-*}` roles; UntitledSansFont (or sans fallback) for navigation, buttons, body, and form elements.
5. **Space to the grid** — All padding, margins, and gaps must align to the documented scale (`{spacing.xxs}` through `{spacing.band}`). Intermediate values break the rhythm.
6. **Cards use hairline borders** — Card and container borders are always 1px with `rgba(3, 3, 2, 0.09)` color (or equivalent neutral at ~9% opacity). Never omit or thicken.
7. **Hover = opacity and color shift** — Interactive elements shift text color to `rgba(3, 3, 2, 0.9)` or apply subtle background opacity changes on hover (e.g., cards to `rgba(3, 3, 2, 0.1)`). Do not introduce new hues.
8. **Content respects max-width** — Full-width sections are fine; content inside must center and respect the responsive max-width (1240px–1400px depending on viewport).
9. **Navigation collapses below 1280px** — At 1024px, nav links are visible but menu toggle remains active. Below 768px, links fully collapse into menu.
10. **Test all text contrast** — Primary text (`#030302`) on canvas (`#FCF9F7`) meets WCAG AA. Verify muted text (e.g., `rgba(3, 3, 2, 0.75)`) remains legible at intended sizes.

## 10. Known Gaps

- **No semantic status colors** — The extracted site does not declare error, success, warning, or info state colors. All validation and feedback relies on text change, opacity shift, or border refinement, not color swap.
- **2 colors have no measured role** — `{colors.accent-1}` (`#FF4500`) was observed only in decorative contexts (featured card backgrounds, illustration). No primary UI role (CTA, hover state, link) was measured for this color.
- **Form input styles not extracted** — No input, textarea, or select element data was captured. Inputs, placeholders, focus states, and error states are not covered by this system.
- **Interaction states partially captured** — Hover states are documented; focus, active, and disabled states were observed in stylesheets but not exhaustively tested across all component types. Some button and card variants may lack full state coverage.
- **Dark mode not included** — The extraction covers the light theme only. No dark-mode variant, system preference (@prefers-color-scheme), or alternative palette was measured or is included in this system.
- **Pages beyond homepage not visited** — Only the landing page (https://www.craft.do/) was analyzed. Authenticated surfaces, app dashboard, pricing page, and other secondary pages were not captured. Typography, component usage, or color roles on those pages may differ.
- **Animation and transition timing not extracted** — No duration, easing, or transition values were measured. Hover animations, page transitions, and micro-interactions are not documented.
- **Grid and layout specifics** — The responsive grid behavior is inferred from breakpoint data; CSS Grid or Flexbox implementation details, gap values, and auto-placement strategies are not specified.
- **Icon library not included** — Individual icon styles, weights, sizes, and stroke values are not covered.
- **No component variants beyond measured** — Only button, card, navigation, footer, and link components were explicitly extracted. Other components (badges, tabs, breadcrumbs, tooltips, modals) may exist on other pages but were not captured here.

---

**System Confidence**: This design system is accurate and reproducible from the landing page of craft.do. Implementations on other pages, authenticated states, and future design changes may introduce new tokens and components not present in this extraction. Refer to the original site or design files for comprehensive, real-time reference.