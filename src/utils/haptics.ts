/**
 * Haptic feedback helpers — semantic wrappers around expo-haptics.
 * Use these throughout the app instead of calling expo-haptics directly.
 */
import * as Haptics from "expo-haptics";

/** Subtle tap — navigation, toggles, minor interactions */
export const hapticLight = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

/** Clear tap — taking a photo, submitting a form, starting a quest */
export const hapticMedium = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

/** Strong tap — high-intent CTAs, purchases, paywall actions */
export const hapticHeavy = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

/** Three-beat success — quest complete, level up, badge unlock */
export const hapticSuccess = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

/** Error shake — form validation, failed action */
export const hapticError = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

/** Warning — soft alert */
export const hapticWarning = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
