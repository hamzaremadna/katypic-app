export const Colors = {
  // ─── Backgrounds ───────────────────────────────
  bgDeep: "#0A0A14",
  bgDark: "#0F0F1E",
  bgCard: "#1A1A2E",
  bgCardAlt: "#1A1A32",
  bgCardHover: "#1E1E38",
  bgInput: "#1E1E38",

  // ─── Brand ─────────────────────────────────────
  gradientPurple: "#7B2FBE",
  gradientPink: "#E91E8C",
  gradientBlue: "#2D1B69",
  gradientDeepBlue: "#2D1B69",

  // ─── Accents ───────────────────────────────────
  accentPurple: "#9B59B6",
  accentPink: "#E91E8C",
  accentGreen: "#00C851",
  accentRed: "#FF3B30",
  accentBlue: "#4A90E2",

  // ─── Text ──────────────────────────────────────
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A0C0",
  textMuted: "#606080",
  textAccent: "#A78BFA",

  // ─── Selection & States ────────────────────────
  selectedBorder: "#E91E8C",
  selectedDot: "#9B59B6",
  scoreExcellent: "#E91E8C",

  // ─── UI Chrome ─────────────────────────────────
  divider: "rgba(255,255,255,0.08)",
  overlay: "rgba(10,10,20,0.7)",
  cardBorder: "rgba(255,255,255,0.06)",
  inputBorder: "rgba(255,255,255,0.12)",
} as const;

export const Gradients = {
  // Core brand
  brand: ["#5F2097", "#1F63DA"] as [string, string],
  brandReverse: ["#E91E8C", "#7B2FBE"] as [string, string],

  // Backgrounds
  bgRadial: ["#2D1B69", "#0A0A14"] as [string, string],
  deepBg: ["#0E0A24", "#080814"] as [string, string],

  // Cards & surfaces
  card: ["rgba(26,26,46,0.9)", "rgba(15,15,30,0.95)"] as [string, string],
  inputFill: ["rgba(30,30,60,0.8)", "rgba(20,20,40,0.9)"] as [string, string],

  // Navigation & overlays
  header: ["rgba(10,10,20,0.0)", "rgba(10,10,20,0.95)"] as [string, string],
  tabBar: ["rgba(10,10,20,0.98)", "rgba(8,8,16,1)"] as [string, string],
  overlay: ["rgba(8,8,20,0.6)", "rgba(8,8,20,0.95)"] as [string, string],

  // Progress & indicators
  progress: ["#7B2FBE", "#E91E8C"] as [string, string],
  purpleBlue: ["#3D2E9E", "#7B2FBE"] as [string, string],

  // Utility
  green: ["#00C851", "#00A844"] as [string, string],
  redPink: ["#FF3B30", "#E91E8C"] as [string, string],

  // Paywall – 142.9deg from Figma
  paywall: ["#9810FA", "#F6339A", "#2B7FFF"] as [string, string, string],
} as const;
