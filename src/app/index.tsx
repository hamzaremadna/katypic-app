import { Redirect } from "expo-router";
import { useAuthStore } from "../stores/authStore";
import { useOnboardingStore } from "../stores/onboardingStore";

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/(auth)/onboarding/welcome" />;
  }

  return <Redirect href="/(auth)/login" />;
}
