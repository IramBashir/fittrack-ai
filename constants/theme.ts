// constants/theme.ts

export const colors = {
  // ── Backgrounds ──────────────────────────────────────
  bg: "#FAF7F5", // warm off-white — main background
  bgCard: "#FFFFFF", // pure white cards
  bgElevated: "#F2EEF0", // slightly pink-tinted elevated surface
  bgInput: "#F7F3F5", // input field background

  // ── Primary Accent — Dusty Rose ──────────────────────
  accent: "#C4788A", // dusty rose — main brand color
  accentDim: "#C4788A12", // very faint rose (backgrounds)
  accentMid: "#C4788A35", // medium rose (borders)
  accentLight: "#F5E6EA", // very light rose (chips, tags)

  // ── Secondary — Soft Lavender ─────────────────────────
  purple: "#9B8EC4", // soft lavender purple
  purpleDim: "#9B8EC412",
  purpleLight: "#EEE9F8", // very light lavender

  // ── Tertiary — Sage Green ─────────────────────────────
  // Used for positive stats (weight loss, goal reached)
  sage: "#7EAA92", // muted sage green
  sageDim: "#7EAA9212",
  sageLight: "#E6F2EC",

  // ── Warning — Warm Amber ──────────────────────────────
  orange: "#D4956A", // warm terracotta/amber
  orangeDim: "#D4956A12",
  warning: "#E8B86D", // soft golden yellow
  warningLight: "#FDF3E3",

  // ── Danger — Muted Coral ──────────────────────────────
  danger: "#E07070", // soft coral red
  dangerDim: "#E0707012",
  dangerLight: "#FDEAEA",

  // ── Text ──────────────────────────────────────────────
  textPrimary: "#2D2235", // deep plum-charcoal (not harsh black)
  textSecondary: "#7B6B7A", // muted mauve-grey
  textMuted: "#B5A8B3", // very light muted text

  // ── Borders ───────────────────────────────────────────
  border: "#EDE6EA", // soft pink-white border
  borderLight: "#F5F0F3", // barely visible border

  // ── Special ───────────────────────────────────────────
  water: "#89B4CC", // soft steel blue for water tracker
  white: "#FFFFFF",
  shadow: "#C4788A", // shadow color (rose tinted)
};

// ── SPACING ───────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ── BORDER RADIUS ─────────────────────────────────────────
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// ── FONT SIZES ────────────────────────────────────────────
export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
};

// ── SHADOWS ───────────────────────────────────────────────
// Light theme needs real shadows (dark theme uses borders instead)
export const shadows = {
  sm: {
    shadowColor: "#C4788A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: "#C4788A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: "#C4788A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};
