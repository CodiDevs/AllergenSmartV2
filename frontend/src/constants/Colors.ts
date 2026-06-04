/**
 * AllergenSmart V2 — Design Tokens
 * Extracted from HTML reference mockups in HtmlDeReferencia/
 */

// ─── Primary Brand Colors ───────────────────────────────────────
export const Colors = {
  // Core brand
  primary: '#5A7BFA',
  primaryDark: '#2D3A8C',
  primaryLight: '#8FABFF',
  primarySurface: '#EEF3FF',
  primarySurfaceAlt: '#F0F6FF',

  // Success / Safe (Green)
  success: '#24C8A0',
  successDark: '#085041',
  successMid: '#0F6E56',
  successLight: '#3DCFB0',
  successAccent: '#1D9E75',
  successSurface: '#EAF7F2',
  successBorder: '#9FE1CB',
  successBadgeBg: '#9FE1CB',
  successBadgeText: '#04342C',

  // Danger / Alert (Red)
  danger: '#E24B4A',
  dangerDark: '#791F1F',
  dangerMid: '#A32D2D',
  dangerLight: '#F09595',
  dangerSurface: '#FEECEC',
  dangerBorder: '#F7C1C1',
  dangerBadgeBg: '#F7C1C1',
  dangerBadgeText: '#501313',

  // Warning / Amber
  warning: '#EF9F27',
  warningDark: '#412402',
  warningMid: '#854F0B',
  warningAccent: '#BA7517',
  warningLight: '#FFD580',
  warningSurface: '#FDF6E3',
  warningBorder: '#FAC775',
  warningBadgeBg: '#FAC775',
  warningBadgeText: '#412402',
  warningBgWarm: '#FFFDF5',

  // Text colors
  textPrimary: '#1A2340',
  textSecondary: '#6B7A99',
  textTertiary: '#8896B0',
  textQuaternary: '#B0BAD0',

  // Surface / Background
  bgApp: '#FAFBFF',
  bgCard: '#FFFFFF',
  bgInput: '#FFFFFF',
  borderLight: '#E2E8F5',
  borderInput: '#DDE3F0',
  borderCard: '#E8ECF5',
  divider: '#F0F3FA',

  // Dark mode (Scanner)
  darkBg: '#111827',
  darkSurface: '#1F2937',
  darkBorder: '#374151',
  darkText: '#F1F5F9',
  darkTextSecondary: '#CBD5E1',
  darkTextMuted: '#94A3B8',
  darkTextDim: '#64748B',
  darkTextDark: '#475569',
  darkTextDarkest: '#334155',

  // Dark Scanner specific
  darkOcrBg: '#0F2027',
  darkOcrBorder: '#1A3A2A',
  darkStatBg: '#0F1A2B',
  darkStatBorder: '#1E3A5F',
  darkStatText: '#334E7B',

  // Flashlight warm tones
  flashBg: '#2A2205',
  flashBorder: '#3A2E00',
  flashGridColor: '#FAC775',

  // Notification dot
  notifDot: '#E24B4A',

  // Mascot eye colors by state
  mascotBlueEye: '#1A2D8C',
  mascotGreenEye: '#085041',
  mascotRedEye: '#791F1F',
  mascotAmberEye: '#633806',

  // Transparent
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

// ─── Semantic Alert Levels (maps to backend result_status) ──────
export const AlertLevelColors = {
  safe: {
    bg: Colors.successSurface,
    border: Colors.successBorder,
    text: Colors.successDark,
    textSub: Colors.successMid,
    badgeBg: Colors.successBadgeBg,
    badgeText: Colors.successBadgeText,
    dot: Colors.success,
    mascotFill: Colors.success,
  },
  warning: {
    bg: Colors.warningSurface,
    border: Colors.warningBorder,
    text: Colors.warningDark,
    textSub: Colors.warningMid,
    badgeBg: Colors.warningBadgeBg,
    badgeText: Colors.warningBadgeText,
    dot: Colors.warning,
    mascotFill: Colors.warning,
  },
  danger: {
    bg: Colors.dangerSurface,
    border: Colors.dangerBorder,
    text: Colors.dangerDark,
    textSub: Colors.dangerMid,
    badgeBg: Colors.dangerBadgeBg,
    badgeText: Colors.dangerBadgeText,
    dot: Colors.danger,
    mascotFill: Colors.danger,
  },
  processing: {
    bg: Colors.primarySurface,
    border: '#B5D4F4',
    text: '#185FA5',
    textSub: Colors.primary,
    badgeBg: '#E6F1FB',
    badgeText: '#0C447C',
    dot: Colors.primary,
    mascotFill: Colors.primary,
  },
} as const;

export type AlertLevel = keyof typeof AlertLevelColors;
