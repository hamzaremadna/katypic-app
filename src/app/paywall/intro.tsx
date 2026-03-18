import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { navigate } from "@/utils/navigation";
import MaskedView from "@react-native-masked-view/masked-view";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { Icon } from "../../components/ui/Icon";
import { Mascot } from "../../components/ui/Mascot";

// ─── Constants ───────────────────────────────────────────────────────────────

const PW_START = { x: 0.2, y: 0.1 };
const PW_END = { x: 0.8, y: 0.9 };
const { width: SW } = Dimensions.get("window");

// ─── Gradient text ───────────────────────────────────────────────────────────

function GradientText({ text, style }: { text: string; style: any }) {
  return (
    <MaskedView
      maskElement={
        <Text style={[style, { backgroundColor: "transparent" }]}>{text}</Text>
      }
    >
      <LinearGradient colors={Gradients.paywall} start={PW_START} end={PW_END}>
        <Text style={[style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function PaywallIntroScreen() {
  const router = useRouter();

  const mascotAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.stagger(120, [
        Animated.timing(mascotAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(textAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(ctaAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Purple glow in top-right corner */}
      <View style={s.glowWrap}>
        <LinearGradient
          colors={["rgba(152,16,250,0.18)", "transparent"]}
          style={s.glow}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      {/* ── Decorative elements ── */}
      <View style={s.decorSparkle}>
        <Icon name="decor-sparkle" size={39} color="#C27AFF" />
      </View>
      <View style={s.decorLightning}>
        <Icon name="decor-lightning" size={34} color="#51A2FF" />
      </View>

      {/* Close */}
      <TouchableOpacity
        style={s.closeBtn}
        onPress={() => router.back()}
        hitSlop={12}
      >
        <Icon name="x" size={22} color={Colors.textSecondary} />
      </TouchableOpacity>

      {/* ── Center content: mascot + title ── */}
      <View style={s.centerContent}>
        <Animated.View style={{ opacity: mascotAnim, transform: [{ translateY: slideAnim }] }}>
          <Mascot size={200} />
        </Animated.View>

        <Animated.View style={[s.textSection, { opacity: textAnim }]}>
          <GradientText text="C'est parti !" style={s.title} />
          <Text style={s.subtitle}>
            C'est le moment de{"\n"}choisir votre plan
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: ctaAnim, width: "100%" }}>
          <TouchableOpacity
            style={s.ctaWrap}
            onPress={() => navigate("/paywall/plans")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Gradients.paywall}
              style={s.ctaGradient}
              start={PW_START}
              end={PW_END}
            >
              <Text style={s.ctaText}>Découvrir les offres</Text>
              <Icon name="sparkles" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Pink star below CTA */}
          <View style={s.decorStar}>
            <Icon name="decor-star" size={29} color="#FB64B6" />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
    paddingTop: Platform.OS === "ios" ? 56 : 36,
  },

  // Background glow
  glowWrap: {
    position: "absolute",
    top: 0,
    right: 0,
    width: SW * 0.7,
    height: SW * 0.7,
    overflow: "hidden",
  },
  glow: {
    width: "100%",
    height: "100%",
    borderBottomLeftRadius: SW * 0.35,
  },

  // Close
  closeBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 36,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  // Decorative icons
  decorSparkle: {
    position: "absolute",
    top: "25%",
    right: SW * 0.1,
    zIndex: 5,
    opacity: 0.7,
  },
  decorLightning: {
    position: "absolute",
    top: "42%",
    left: SW * 0.06,
    zIndex: 5,
    opacity: 0.6,
  },
  decorStar: {
    alignSelf: "flex-start",
    marginLeft: 50,
    opacity: 0.7,
  },

  // Center content (mascot + text grouped)
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },

  // Text
  textSection: {
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  title: {
    fontFamily: Fonts.black,
    fontSize: 30,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },

  ctaWrap: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#F6339A",
    shadowOpacity: 0.35,
    paddingHorizontal: 60,

    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaGradient: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 28,
  },
  ctaText: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: "#fff",
  },
});
