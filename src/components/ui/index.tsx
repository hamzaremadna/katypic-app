import { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  KeyboardTypeOptions,
  Platform,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { navigate } from "@/utils/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { Icon, IconName } from "./Icon";

const { width } = Dimensions.get("window");

// ─────────────────────────────────────────────
// Reusable spacer styles (avoid inline `style={{ width: 36 }}`)
// ─────────────────────────────────────────────
const spacer = StyleSheet.create({
  w36: { width: 36 },
});

// ─────────────────────────────────────────────
// KaytiPic Logo Header Bar  (floating gradient pill)
// ─────────────────────────────────────────────
interface HeaderProps {
  showSettings?: boolean;
  showBack?: boolean;
  title?: string;
  onBack?: () => void;
  rightIcon?: React.ReactNode;
}

export function KaytiHeader({
  showSettings = false,
  showBack = false,
  title,
  onBack,
  rightIcon,
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const containerPadding = useMemo<ViewStyle>(
    () => ({ paddingTop: insets.top + 10 }),
    [insets.top],
  );
  return (
    <View style={[header.container, containerPadding]}>
      {showBack ? (
        <TouchableOpacity
          onPress={onBack || (() => router.back())}
          style={header.backBtn}
        >
          <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={spacer.w36} />
      )}

      {title ? (
        <Text style={header.title}>{title}</Text>
      ) : (
        <View style={header.logoRow}>
          <Text style={header.logoKayti}>Kayti</Text>
          <Text style={header.logoPic}>Pic</Text>
        </View>
      )}

      {rightIcon ? (
        rightIcon
      ) : showSettings ? (
        <TouchableOpacity
          style={header.settingsBtn}
          onPress={() => router.push("/(tabs)/settings")}
        >
          <Icon name="settings" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={spacer.w36} />
      )}
    </View>
  );
}

const header = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: 12,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  logoKayti: {
    fontFamily: Fonts.light,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  logoPic: {
    fontFamily: Fonts.extrabold,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  settingsBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─────────────────────────────────────────────
// Bottom Tab Bar
// ─────────────────────────────────────────────
interface TabItem {
  icon: IconName;
  label: string;
  route: string;
  isCamera?: boolean;
}

const TABS: TabItem[] = [
  { icon: "home", label: "Accueil", route: "/(tabs)/home" },
  { icon: "message-chat", label: "Assistant", route: "/(tabs)/assistant" },
  { icon: "camera", label: "", route: "/(tabs)/camera", isCamera: true },
  { icon: "map", label: "Découverte", route: "/(tabs)/discover" },
  { icon: "user", label: "Profil", route: "/(tabs)/profile" },
];

export function BottomTabBar({
  activeRoute,
}: {
  activeRoute: string;
}) {
  const insets = useSafeAreaInsets();
  const containerPadding = useMemo<ViewStyle>(
    () => ({ paddingBottom: Math.max(insets.bottom, 12) }),
    [insets.bottom],
  );
  return (
    <View style={[tabs.container, containerPadding]}>
      <LinearGradient
        colors={Gradients.tabBar}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={tabs.row}>
        {TABS.map((tab) => {
          const isActive = activeRoute === tab.route;
          if (tab.isCamera) {
            return (
              <TouchableOpacity
                key="camera"
                style={tabs.cameraWrapper}
                onPress={() => navigate(tab.route)}
              >
                <View style={tabs.cameraShadow}>
                  <LinearGradient
                    colors={["#D8073E", "#1F5EDA"]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: -1 }}
                    style={tabs.cameraBtn}
                  >
                    <Icon name="camera" size={22} color="#FFFFFF" />
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={tab.route}
              style={tabs.tab}
              onPress={() => navigate(tab.route)}
            >
              <Icon
                name={tab.icon}
                size={20}
                color={isActive ? Colors.textPrimary : Colors.textMuted}
              />
              <Text style={[tabs.tabLabel, isActive && tabs.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tabs = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopColor: Colors.divider,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  tabLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 10,
    color: Colors.textMuted,
  },
  tabLabelActive: { color: Colors.textPrimary },
  cameraWrapper: {
    flex: 1,
    alignItems: "center",
    marginTop: -15,
  },
  cameraShadow: {
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: "#5717A6",
    shadowOpacity: 0.9,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  cameraBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});

// ─────────────────────────────────────────────
// Gradient Primary Button
// ─────────────────────────────────────────────
interface GradientButtonProps {
  label: string;
  onPress: () => void;
  arrow?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
  variant?: "brand" | "dark";
}

export function GradientButton({
  label,
  onPress,
  arrow = true,
  style,
  disabled,
  variant = "brand",
}: GradientButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.85}
      style={[btn.wrapper, style]}
    >
      <LinearGradient
        colors={
          variant === "brand"
            ? disabled
              ? ["#2A2A3E", "#2A2A3E"]
              : Gradients.purpleBlue
            : ["#1E1E38", "#1A1A30"]
        }
        style={btn.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[btn.label, disabled && btn.labelDisabled]}>{label}</Text>
        {arrow && (
          <Icon
            name="arrow-right"
            size={18}
            color={disabled ? Colors.textMuted : Colors.textPrimary}
          />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const btn = StyleSheet.create({
  wrapper: {
    borderRadius: 50,
    overflow: "hidden",
    shadowColor: Colors.gradientPink,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    paddingHorizontal: 32,
    gap: 8,
  },
  label: {
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  labelDisabled: { color: Colors.textMuted },
});

// ─────────────────────────────────────────────
// Feature checklist row
// ─────────────────────────────────────────────
export function FeatureList({
  items,
}: {
  items: string[];
}) {
  return (
    <View style={feat.container}>
      {items.map((item, i) => (
        <View key={i} style={feat.row}>
          <LinearGradient colors={Gradients.brand} style={feat.check}>
            <Icon name="check" size={13} color="#fff" />
          </LinearGradient>
          <Text style={feat.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const feat = StyleSheet.create({
  container: {
    backgroundColor: "rgba(20,20,40,0.7)",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontFamily: Fonts.medium,
    flex: 1,
    fontSize: 15,
    color: Colors.textSecondary,
  },
});

// ─────────────────────────────────────────────
// User Avatar Badge
// ─────────────────────────────────────────────
export function UserBadge({
  size = 48,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  const outerStyle = useMemo<ViewStyle>(
    () => ({
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: "hidden",
      shadowColor: "#00C851",
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 8,
    }),
    [size],
  );
  const fontSize = useMemo(() => size * 0.38, [size]);
  return (
    <View style={[outerStyle, style]}>
      <LinearGradient colors={Gradients.green} style={badge.gradient}>
        <Text style={[badge.letter, { fontSize }]}>R</Text>
      </LinearGradient>
    </View>
  );
}

const badge = StyleSheet.create({
  gradient: { flex: 1, alignItems: "center", justifyContent: "center" },
  letter: {
    fontFamily: Fonts.black,
    color: "#fff",
  },
});

// ─────────────────────────────────────────────
// Input field
// ─────────────────────────────────────────────
export { ReviewModal } from "./ReviewModal";

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  icon: IconName;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  hint?: string;
}

export function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry,
  showPasswordToggle,
  keyboardType,
  autoCapitalize = "none",
  hint,
}: InputFieldProps) {
  const [hidden, setHidden] = useState<boolean>(true);
  const isSecure = secureTextEntry && hidden;

  return (
    <View style={inp.wrapper}>
      <Text style={inp.label}>{label}</Text>
      <View style={inp.inputRow}>
        <LinearGradient colors={Gradients.inputFill} style={inp.inputBg}>
          <Icon name={icon} size={16} color={Colors.textMuted} />
          <TextInput
            style={inp.input}
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={isSecure}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
          />
          {secureTextEntry && showPasswordToggle && (
            <TouchableOpacity
              onPress={() => setHidden((h) => !h)}
              hitSlop={10}
              style={inp.eyeBtn}
            >
              <Icon
                name={hidden ? "eye" : "eye-off"}
                size={18}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
      {hint && <Text style={inp.hint}>{hint}</Text>}
    </View>
  );
}

const inp = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  inputRow: { borderRadius: 12, overflow: "hidden" },
  inputBg: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    gap: 10,
  },
  input: {
    fontFamily: Fonts.regular,
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  eyeBtn: {
    padding: 2,
  },
  hint: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    paddingLeft: 4,
  },
});
