import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { Icon } from "../ui/Icon";
import type { AssistantMode } from "./AssistantModeModal";

const CATEGORY_ICONS: Record<string, string> = {
  composition: "grid",
  lumiere: "sun",
  couleur: "sliders",
  technique: "settings",
  creativite: "sparkles",
};

// Positive alerts get a green tint; warnings get the accent gradient
const POSITIVE_ALERTS = ["Belle lumière ✓"];

interface Props {
  tip: string;
  alert?: string;
  category: string;
  mode: AssistantMode;
  onClose: () => void;
  onListen: () => void;
}

export function AiTipOverlay({ tip, alert, category, mode, onClose, onListen }: Props) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset animation each time the tip changes
    slideAnim.setValue(40);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 70,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tip]);

  const iconName = CATEGORY_ICONS[category] ?? "sparkles";
  const showListen = mode === "oral" || mode === "both";
  const isPositive = alert ? POSITIVE_ALERTS.includes(alert) : false;

  return (
    <Animated.View
      style={[
        s.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents="box-none"
    >
      <View style={s.card}>
        <LinearGradient
          colors={["rgba(20,10,45,0.97)", "rgba(10,6,28,0.99)"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Top accent */}
        <LinearGradient
          colors={isPositive ? ["#22c55e", "#16a34a"] : [Colors.gradientPink, Colors.gradientPurple]}
          style={s.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={[s.iconCircle, isPositive && s.iconCircleGreen]}>
              <Icon name={iconName as any} size={13} color="#fff" />
            </View>
            <Text style={s.headerTitle}>Aide magique de l'IA</Text>
          </View>
        </View>

        {/* Alert badge — the short specific label */}
        {alert && (
          <View style={[s.alertBadge, isPositive && s.alertBadgeGreen]}>
            <Text style={s.alertText}>{alert}</Text>
          </View>
        )}

        {/* Tip text */}
        <Text style={s.tipText}>{tip}</Text>

        {/* Actions */}
        <View style={s.actions}>
          {showListen && (
            <TouchableOpacity style={s.listenBtn} onPress={onListen} activeOpacity={0.8}>
              <LinearGradient
                colors={[Colors.gradientPink, Colors.gradientPurple]}
                style={s.listenGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon name="mic" size={12} color="#fff" />
                <Text style={s.listenText}>Écoutez</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={s.closeText}>✕ Fermez</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 160,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(233,30,140,0.35)",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 10,
    shadowColor: Colors.gradientPink,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  accent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gradientPink,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleGreen: {
    backgroundColor: "#22c55e",
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.gradientPink,
    letterSpacing: 0.3,
  },
  // Alert badge — short specific label like "Trop de ciel"
  alertBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(233,30,140,0.18)",
    borderWidth: 1,
    borderColor: "rgba(233,30,140,0.45)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  alertBadgeGreen: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderColor: "rgba(34,197,94,0.4)",
  },
  alertText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: "#fff",
    letterSpacing: 0.2,
  },
  tipText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  listenBtn: {
    borderRadius: 10,
    overflow: "hidden",
  },
  listenGrad: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 14,
    gap: 5,
    borderRadius: 10,
  },
  listenText: { fontSize: 13, fontFamily: Fonts.bold, color: "#fff" },
  closeBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  closeText: { fontSize: 13, fontFamily: Fonts.medium, color: Colors.textSecondary },
});
