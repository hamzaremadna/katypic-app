import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  Animated,
  Easing,
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
import { hapticHeavy } from "../../utils/haptics";

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

  // ── Each element has its own animated values ──
  const glowOpacity   = useRef(new Animated.Value(0)).current;

  const closeFade     = useRef(new Animated.Value(0)).current;
  const closeScale    = useRef(new Animated.Value(0.5)).current;

  const sparkleFade   = useRef(new Animated.Value(0)).current;
  const sparkleScale  = useRef(new Animated.Value(0.2)).current;
  const sparkleRot    = useRef(new Animated.Value(-60)).current;

  const lightningFade = useRef(new Animated.Value(0)).current;
  const lightningX    = useRef(new Animated.Value(-50)).current;

  const mascotFade    = useRef(new Animated.Value(0)).current;
  const mascotScale   = useRef(new Animated.Value(0.55)).current;
  const mascotY       = useRef(new Animated.Value(70)).current;
  const mascotFloat   = useRef(new Animated.Value(0)).current;

  const titleFade     = useRef(new Animated.Value(0)).current;
  const titleY        = useRef(new Animated.Value(28)).current;

  const subtitleFade  = useRef(new Animated.Value(0)).current;
  const subtitleY     = useRef(new Animated.Value(16)).current;

  const ctaFade       = useRef(new Animated.Value(0)).current;
  const ctaY          = useRef(new Animated.Value(44)).current;
  const ctaScale      = useRef(new Animated.Value(0.88)).current;

  const starFade      = useRef(new Animated.Value(0)).current;
  const starScale     = useRef(new Animated.Value(0.1)).current;
  const starRot       = useRef(new Animated.Value(120)).current;

  // ── Idle loop values (separate from entrance values) ──────────────────────
  // Sparkle: twinkle scale + gentle rotation oscillation
  const sparkleIdleScale = useRef(new Animated.Value(1)).current;
  const sparkleIdleRot   = useRef(new Animated.Value(0)).current;
  // Lightning: electric opacity flicker + micro Y bounce
  const lightningFlicker = useRef(new Animated.Value(1)).current;
  const lightningIdleY   = useRef(new Animated.Value(0)).current;
  // Star: continuous 360° spin + scale breath
  const starSpin         = useRef(new Animated.Value(0)).current;
  const starBreath       = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Background glow — slow, atmospheric
    Animated.timing(glowOpacity, {
      toValue: 1, duration: 900, useNativeDriver: true,
    }).start();

    // Close button — quick pop (100ms)
    const t1 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(closeFade, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(closeScale, { toValue: 1, tension: 160, friction: 7, useNativeDriver: true }),
      ]).start();
    }, 100);

    // Sparkle — rotates in from top-right (180ms)
    const t2 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(sparkleFade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(sparkleScale, { toValue: 1, tension: 90, friction: 7, useNativeDriver: true }),
        Animated.spring(sparkleRot, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
      ]).start();
    }, 180);

    // Lightning — slides in from the left (260ms)
    const t3 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(lightningFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(lightningX, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
      ]).start();
    }, 260);

    // Mascot — hero entrance: springs up + bounces scale (300ms)
    const t4 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(mascotFade, {
          toValue: 1, duration: 380,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(mascotScale, {
          toValue: 1, tension: 48, friction: 5, useNativeDriver: true,
        }),
        Animated.spring(mascotY, {
          toValue: 0, tension: 55, friction: 8, useNativeDriver: true,
        }),
      ]).start(() => {
        // Continuous float loop after entrance
        Animated.loop(
          Animated.sequence([
            Animated.timing(mascotFloat, {
              toValue: -9, duration: 2000,
              easing: Easing.inOut(Easing.sin), useNativeDriver: true,
            }),
            Animated.timing(mascotFloat, {
              toValue: 0, duration: 2000,
              easing: Easing.inOut(Easing.sin), useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 300);

    // Title — slides up (580ms)
    const t5 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleFade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, tension: 75, friction: 12, useNativeDriver: true }),
      ]).start();
    }, 580);

    // Subtitle — gentle fade + lift (730ms)
    const t6 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(subtitleFade, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(subtitleY, { toValue: 0, tension: 70, friction: 13, useNativeDriver: true }),
      ]).start();
    }, 730);

    // CTA button — pops up with energy (900ms)
    const t7 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(ctaFade, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(ctaY, { toValue: 0, tension: 85, friction: 9, useNativeDriver: true }),
        Animated.spring(ctaScale, { toValue: 1, tension: 100, friction: 7, useNativeDriver: true }),
      ]).start();
    }, 900);

    // Star — spins in last (1020ms)
    const t8 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(starFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(starScale, { toValue: 1, tension: 160, friction: 6, useNativeDriver: true }),
        Animated.spring(starRot, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
      ]).start();
    }, 1020);

    // ── SPARKLE idle — twinkle flash + gentle rotation oscillation ──
    // Starts ~900ms (after entrance spring settles)
    const t9 = setTimeout(() => {
      // Scale twinkle: quick burst then rest
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleIdleScale, {
            toValue: 1.4, duration: 200,
            easing: Easing.out(Easing.quad), useNativeDriver: true,
          }),
          Animated.timing(sparkleIdleScale, {
            toValue: 0.85, duration: 150,
            easing: Easing.in(Easing.quad), useNativeDriver: true,
          }),
          Animated.timing(sparkleIdleScale, {
            toValue: 1.0, duration: 200,
            easing: Easing.out(Easing.quad), useNativeDriver: true,
          }),
          Animated.delay(1800),
        ])
      ).start();
      // Rotation oscillation: independent cycle
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleIdleRot, {
            toValue: 22, duration: 1400,
            easing: Easing.inOut(Easing.sin), useNativeDriver: true,
          }),
          Animated.timing(sparkleIdleRot, {
            toValue: -22, duration: 1400,
            easing: Easing.inOut(Easing.sin), useNativeDriver: true,
          }),
        ])
      ).start();
    }, 900);

    // ── LIGHTNING idle — electric flicker + micro zap ──
    // Starts ~750ms (after timing entrance finishes)
    const t10 = setTimeout(() => {
      // Irregular opacity flicker to simulate electricity
      Animated.loop(
        Animated.sequence([
          Animated.delay(1400),
          Animated.timing(lightningFlicker, { toValue: 0.25, duration: 60, useNativeDriver: true }),
          Animated.timing(lightningFlicker, { toValue: 1.0,  duration: 50, useNativeDriver: true }),
          Animated.timing(lightningFlicker, { toValue: 0.45, duration: 70, useNativeDriver: true }),
          Animated.timing(lightningFlicker, { toValue: 1.0,  duration: 60, useNativeDriver: true }),
          Animated.delay(200),
          Animated.timing(lightningFlicker, { toValue: 0.3,  duration: 50, useNativeDriver: true }),
          Animated.timing(lightningFlicker, { toValue: 1.0,  duration: 80, useNativeDriver: true }),
        ])
      ).start();
      // Micro Y bounce on each zap
      Animated.loop(
        Animated.sequence([
          Animated.delay(1400),
          Animated.timing(lightningIdleY, {
            toValue: -6, duration: 120,
            easing: Easing.out(Easing.quad), useNativeDriver: true,
          }),
          Animated.timing(lightningIdleY, {
            toValue: 0, duration: 300,
            easing: Easing.out(Easing.bounce), useNativeDriver: true,
          }),
          Animated.delay(1800),
        ])
      ).start();
    }, 750);

    // ── STAR idle — slow continuous spin + scale breath ──
    // Starts ~1500ms (after entrance spring settles)
    const t11 = setTimeout(() => {
      // Continuous 360° rotation
      Animated.loop(
        Animated.timing(starSpin, {
          toValue: 1, duration: 4000,
          easing: Easing.linear, useNativeDriver: true,
        })
      ).start();
      // Scale breath: in and out like breathing
      Animated.loop(
        Animated.sequence([
          Animated.timing(starBreath, {
            toValue: 1.3, duration: 1100,
            easing: Easing.inOut(Easing.sin), useNativeDriver: true,
          }),
          Animated.timing(starBreath, {
            toValue: 1.0, duration: 1100,
            easing: Easing.inOut(Easing.sin), useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1500);

    return () => {
      [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11].forEach(clearTimeout);
      mascotFloat.stopAnimation();
      sparkleIdleScale.stopAnimation();
      sparkleIdleRot.stopAnimation();
      lightningFlicker.stopAnimation();
      lightningIdleY.stopAnimation();
      starSpin.stopAnimation();
      starBreath.stopAnimation();
    };
  }, []);

  // Entrance interpolations
  const sparkleRotateStr = sparkleRot.interpolate({
    inputRange: [-60, 0],
    outputRange: ["-60deg", "0deg"],
  });
  const starRotateStr = starRot.interpolate({
    inputRange: [0, 120],
    outputRange: ["0deg", "120deg"],
  });

  // Idle interpolations
  const sparkleIdleRotStr = sparkleIdleRot.interpolate({
    inputRange: [-22, 22],
    outputRange: ["-22deg", "22deg"],
  });
  const starSpinStr = starSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* Animated background glow */}
      <Animated.View style={[s.glowWrap, { opacity: glowOpacity }]}>
        <LinearGradient
          colors={["rgba(152,16,250,0.22)", "transparent"]}
          style={s.glow}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Sparkle — rotates in from top-right, then twinkles + oscillates ── */}
      <Animated.View
        style={[
          s.decorSparkle,
          {
            opacity: sparkleFade,
            transform: [{ scale: sparkleScale }, { rotate: sparkleRotateStr }],
          },
        ]}
      >
        {/* Idle layer: independent twinkle scale + rotation oscillation */}
        <Animated.View
          style={{
            transform: [
              { scale: sparkleIdleScale },
              { rotate: sparkleIdleRotStr },
            ],
          }}
        >
          <Icon name="decor-sparkle" size={39} color="#C27AFF" />
        </Animated.View>
      </Animated.View>

      {/* ── Lightning — slides in from the left, then electric flicker + zap ── */}
      <Animated.View
        style={[
          s.decorLightning,
          { opacity: lightningFade, transform: [{ translateX: lightningX }] },
        ]}
      >
        {/* Idle layer: flicker opacity + micro bounce */}
        <Animated.View
          style={{
            opacity: lightningFlicker,
            transform: [{ translateY: lightningIdleY }],
          }}
        >
          <Icon name="decor-lightning" size={34} color="#51A2FF" />
        </Animated.View>
      </Animated.View>

      {/* ── Close button — pops in ── */}
      <Animated.View
        style={[
          s.closeBtnWrap,
          { opacity: closeFade, transform: [{ scale: closeScale }] },
        ]}
      >
        <TouchableOpacity
          style={s.closeBtn}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Icon name="x" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Center content ── */}
      <View style={s.centerContent}>

        {/* Mascot — hero: bounces up, then floats */}
        <Animated.View
          style={{
            opacity: mascotFade,
            transform: [
              { translateY: mascotY },
              { scale: mascotScale },
            ],
          }}
        >
          <Animated.View style={{ transform: [{ translateY: mascotFloat }] }}>
            <Mascot size={200} />
          </Animated.View>
        </Animated.View>

        {/* Title — slides up */}
        <Animated.View
          style={[
            s.textSection,
            { opacity: titleFade, transform: [{ translateY: titleY }] },
          ]}
        >
          <GradientText text="C'est parti !" style={s.title} />
        </Animated.View>

        {/* Subtitle — gentle lift */}
        <Animated.View
          style={{
            opacity: subtitleFade,
            transform: [{ translateY: subtitleY }],
          }}
        >
          <Text style={s.subtitle}>
            C'est le moment de{"\n"}choisir votre plan
          </Text>
        </Animated.View>

        {/* CTA — pops up */}
        <Animated.View
          style={[
            s.ctaArea,
            {
              opacity: ctaFade,
              transform: [{ translateY: ctaY }, { scale: ctaScale }],
            },
          ]}
        >
          <TouchableOpacity
            style={s.ctaWrap}
            onPress={() => { hapticHeavy(); navigate("/paywall/plans"); }}
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

          {/* Star — spins in, then continuously rotates + breathes */}
          <Animated.View
            style={[
              s.decorStar,
              {
                opacity: starFade,
                transform: [{ scale: starScale }, { rotate: starRotateStr }],
              },
            ]}
          >
            {/* Idle layer: continuous spin + scale breath */}
            <Animated.View
              style={{
                transform: [
                  { rotate: starSpinStr },
                  { scale: starBreath },
                ],
              }}
            >
              <Icon name="decor-star" size={29} color="#FB64B6" />
            </Animated.View>
          </Animated.View>
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

  // Background glow (animated wrapper)
  glowWrap: {
    position: "absolute",
    top: 0,
    right: 0,
    width: SW * 0.7,
    height: SW * 0.7,
    overflow: "hidden",
    zIndex: 0,
  },
  glow: {
    width: "100%",
    height: "100%",
    borderBottomLeftRadius: SW * 0.35,
  },

  // Close button
  closeBtnWrap: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 36,
    left: 20,
    zIndex: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  // Decorative icons
  decorSparkle: {
    position: "absolute",
    top: "25%",
    right: SW * 0.1,
    zIndex: 5,
  },
  decorLightning: {
    position: "absolute",
    top: "42%",
    left: SW * 0.06,
    zIndex: 5,
  },
  decorStar: {
    alignSelf: "flex-start",
    marginLeft: 50,
    marginTop: 8,
  },

  // Center content
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    zIndex: 2,
  },

  // Text
  textSection: {
    alignItems: "center",
    paddingHorizontal: 40,
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

  // CTA area
  ctaArea: {
    width: "100%",
    alignItems: "center",
  },
  ctaWrap: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#F6339A",
    shadowOpacity: 0.4,
    paddingHorizontal: 60,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
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
