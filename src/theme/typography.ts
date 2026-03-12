// ─── Montserrat font family constants ────────────────────────────────────────
// Maps to the weights loaded in _layout.tsx via @expo-google-fonts/montserrat

export const Fonts = {
  light:     "Montserrat_300Light",
  regular:   "Montserrat_400Regular",
  medium:    "Montserrat_500Medium",
  semibold:  "Montserrat_600SemiBold",
  bold:      "Montserrat_700Bold",
  extrabold: "Montserrat_800ExtraBold",
  black:     "Montserrat_900Black",
} as const;

// ─── Pre-composed text variant styles ────────────────────────────────────────
// Use these directly in StyleSheet.create() for consistent typography

export const Typography = {
  h1: { fontFamily: Fonts.black,     fontSize: 32, letterSpacing: -0.5 },
  h2: { fontFamily: Fonts.extrabold, fontSize: 26, letterSpacing: -0.3 },
  h3: { fontFamily: Fonts.bold,      fontSize: 20 },
  h4: { fontFamily: Fonts.bold,      fontSize: 17 },
  h5: { fontFamily: Fonts.semibold,  fontSize: 15 },

  bodyLarge:  { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 24 },
  body:       { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 22 },
  bodySmall:  { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 20 },

  labelLarge: { fontFamily: Fonts.semibold, fontSize: 15 },
  label:      { fontFamily: Fonts.semibold, fontSize: 13 },
  labelSmall: { fontFamily: Fonts.semibold, fontSize: 11, letterSpacing: 0.8 },

  caption:    { fontFamily: Fonts.medium,   fontSize: 12 },
  overline:   { fontFamily: Fonts.bold,     fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" as const },

  button:     { fontFamily: Fonts.bold,     fontSize: 16, letterSpacing: 0.3 },
  buttonSm:   { fontFamily: Fonts.bold,     fontSize: 14 },

  tabLabel:   { fontFamily: Fonts.semibold, fontSize: 10 },
} as const;
