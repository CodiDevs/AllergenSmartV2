/**
 * AllergenSmart V2 — Spacing & Layout Tokens
 */

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 14,
  '3xl': 16,
  '4xl': 18,
  '5xl': 20,
  '6xl': 24,
  '7xl': 28,
  '8xl': 32,
} as const;

export const BorderRadius = {
  xs: 3,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  '2xl': 16,
  '3xl': 20,
  pill: 9999,
} as const;

export const IconSize = {
  xs: 13,
  sm: 14,
  md: 15,
  lg: 17,
  xl: 19,
  '2xl': 20,
  '3xl': 22,
  '4xl': 28,
  mascotSm: 22,
  mascotMd: 34,
  mascotLg: 52,
  mascotXl: 70,
  mascotFull: 80,
} as const;

// Component-specific tokens
export const Component = {
  // Status bar
  statusBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    fontSize: 10,
  },

  // Navigation bar
  navbar: {
    height: 60,
    paddingHorizontal: 18,
    iconButtonSize: 34,
    iconButtonRadius: 10,
  },

  // Bottom tab bar
  tabBar: {
    height: 70,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 14,
    itemPadding: 4,
    itemPaddingHorizontal: 10,
    itemRadius: 12,
    iconSize: 20,
  },

  // Cards
  card: {
    radius: 14,
    padding: 12,
    borderWidth: 1,
  },

  // Hero card
  heroCard: {
    radius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
  },

  // Stats grid
  statsGrid: {
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  // Inputs
  input: {
    height: 44,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    radius: 10,
    gap: 7,
  },

  // Buttons
  button: {
    height: 44,
    paddingVertical: 10,
    radius: 12,
  },

  // Phone shell (for reference)
  phone: {
    width: 295,
    radius: 40,
    borderWidth: 1.5,
  },

  // Allergen chip
  allergenChip: {
    minWidth: 62,
    paddingHorizontal: 12,
    paddingVertical: 10,
    iconSize: 28,
    iconRadius: 8,
    radius: 14,
  },

  // History item
  historyItem: {
    dotSize: 10,
    padding: 10,
    paddingHorizontal: 12,
    radius: 14,
    gap: 10,
  },
} as const;
