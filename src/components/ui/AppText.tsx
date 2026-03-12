import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { Fonts } from "../../theme/typography";
import { Colors } from "../../theme/colors";

// Maps React Native fontWeight values → correct Montserrat variant name
const weightToFont: Record<string, string> = {
  "100": Fonts.light,
  "200": Fonts.light,
  "300": Fonts.light,
  "400": Fonts.regular,
  "500": Fonts.medium,
  "600": Fonts.semibold,
  "700": Fonts.bold,
  "800": Fonts.extrabold,
  "900": Fonts.black,
  normal: Fonts.regular,
  bold:   Fonts.bold,
};

interface AppTextProps extends TextProps {
  weight?: keyof typeof Fonts;
}

/**
 * Drop-in replacement for React Native's <Text>.
 * Automatically applies Montserrat — picks the right variant from `weight`
 * or falls back to inferring it from the style's fontWeight.
 *
 * Usage:
 *   <AppText weight="bold" style={{ fontSize: 18 }}>Hello</AppText>
 *   <AppText style={s.title}>Hello</AppText>   // picks weight from style
 */
export function AppText({ weight, style, children, ...props }: AppTextProps) {
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const fw = String(flatStyle.fontWeight ?? "400");
  const fontFamily = weight ? Fonts[weight] : (weightToFont[fw] ?? Fonts.regular);

  return (
    <Text
      style={[{ fontFamily, color: Colors.textPrimary }, style]}
      {...props}
    >
      {children}
    </Text>
  );
}
