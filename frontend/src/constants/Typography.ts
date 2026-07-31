/**
 * AllergenSmart V2 — Typography
 * Fonts: Nunito (headings, labels, badges) + Inter (body, descriptions)
 */

export const FontFamily = {
  // Nunito — used for titles, badges, labels, brand name, stats
  nunitoRegular: 'Nunito_400Regular',
  nunitoMedium: 'Nunito_500Medium',
  nunitoSemiBold: 'Nunito_600SemiBold',
  nunitoBold: 'Nunito_700Bold',
  nunitoExtraBold: 'Nunito_800ExtraBold',
  nunitoBlack: 'Nunito_900Black',

  // Inter — used for body text, descriptions, secondary info
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
} as const;

export const FontSize = {
  // Mapped from HTML reference px values
  xxs: 8,
  xs: 9,
  sm: 10,
  md: 11,
  base: 12,
  lg: 13,
  xl: 14,
  '2xl': 16,
  '3xl': 17,
  '4xl': 18,
  '5xl': 20,
  '6xl': 24,
} as const;

export const LineHeight = {
  tight: 1.2,
  snug: 1.3,
  normal: 1.4,
  relaxed: 1.5,
  loose: 1.6,
} as const;

// Pre-built text style presets
export const TextStyles = {
  // Titles
  screenTitle: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: FontSize['3xl'],
    lineHeight: FontSize['3xl'] * LineHeight.tight,
  },
  sectionTitle: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: FontSize.lg,
    lineHeight: FontSize.lg * LineHeight.tight,
  },
  cardTitle: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.tight,
  },

  // Body
  body: {
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.normal,
  },
  bodySmall: {
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  caption: {
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.loose,
  },

  // Labels / Badges
  badge: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.tight,
  },
  label: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.tight,
  },
  sectionLabel: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: FontSize.md,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },

  // Navigation
  navLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.tight,
  },

  // Stats
  statNumber: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: FontSize['5xl'],
    lineHeight: FontSize['5xl'] * LineHeight.tight,
  },

  // Brand
  brandName: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: FontSize.xl,
    lineHeight: FontSize.xl * LineHeight.tight,
  },

  // Buttons
  buttonPrimary: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.tight,
  },
  buttonSecondary: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * LineHeight.tight,
  },

  // Input
  inputText: {
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.md,
  },
  inputPlaceholder: {
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.md,
  },
} as const;
