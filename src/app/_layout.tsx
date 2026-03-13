import { useEffect, useCallback } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as Sentry from "@sentry/react-native";
import { useFonts } from "expo-font";
import {
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  Montserrat_900Black,
} from "@expo-google-fonts/montserrat";
import { useAuthStore } from "../stores/authStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useOnboardingStore } from "../stores/onboardingStore";
import { ErrorBoundary } from "../components/ErrorBoundary";

// Init Sentry before anything renders
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? "development" : "production",
  enableAutoSessionTracking: true,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  enabled: !__DEV__ || !!process.env.EXPO_PUBLIC_SENTRY_DSN,
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayout() {
  const loadToken = useAuthStore((s) => s.loadToken);
  const isReady = useAuthStore((s) => s.isReady);
  const onboardingLoaded = useOnboardingStore((s) => s.loaded);

  const [fontsLoaded] = useFonts({
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black,
  });

  useEffect(() => {
    loadToken();
    useSettingsStore.getState().load();
    useOnboardingStore.getState().load();
  }, [loadToken]);

  // Hide splash only when fonts, auth AND onboarding state are ready
  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded && isReady && onboardingLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isReady, onboardingLoaded]);

  if (!fontsLoaded || !isReady || !onboardingLoaded) return null;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutReady}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0A0A14" },
            }}
          />
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// Wrap with Sentry for automatic error boundary + performance tracing
export default Sentry.wrap(RootLayout);
