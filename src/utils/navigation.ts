import { router, Href } from "expo-router";

/**
 * Type-safe navigation helpers.
 * Centralizes the Href cast so individual screens don't need `as any`.
 */
export function navigate(href: string) {
  router.push(href as Href);
}

export function navigateReplace(href: string) {
  router.replace(href as Href);
}
