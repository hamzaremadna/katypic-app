import { Stack } from "expo-router";

export default function TabsLayout() {
  // We use a custom BottomTabBar component instead of expo-router Tabs
  // so we use Stack here and render the tab bar in each screen
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0A0A14" },
        animation: "fade",
      }}
    />
  );
}
