import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Colors } from "../../../theme/colors";
import { Fonts } from "../../../theme/typography";
import { Icon } from "../../../components/ui/Icon";

const HERO_IMG = require("../../../assets/images/home.png");

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const imgScale = useRef(new Animated.Value(1.05)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(imgScale, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStart = () => {
    router.push("/(auth)/onboarding/questionnaire?step=0");
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* Black background */}
      <View style={StyleSheet.absoluteFillObject}>
        <View style={s.bgBlack} />
      </View>

      {/* ── Top: Logo + Tagline ── */}
      <Animated.View
        style={[
          s.topSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={s.logoRow}>
          <Text style={s.logoKayti}>Kayti</Text>
          <Text style={s.logoPic}>Pic</Text>
        </View>
        <Text style={s.tagline}>La photo autrement ....</Text>
      </Animated.View>

      {/* ── Center: Hero Image ── */}
      <Animated.View
        style={[
          s.heroContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: imgScale }],
          },
        ]}
      >
        <Image source={HERO_IMG} style={s.heroImage} resizeMode="cover" />

        {/* <LinearGradient
          colors={["#000000", "rgba(0,0,0,0.6)", "transparent"]}
          style={s.heroFadeTop}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Bottom fade from image into black */}
        {/* <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)", "#000000"]}
          style={s.heroFadeBottom}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        /> */}
      </Animated.View>

      {/* ── Bottom: CTA + Login ── */}
      <Animated.View
        style={[
          s.bottomSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Start button — dark glass style matching Frame 15 */}
        <TouchableOpacity
          style={s.startButton}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <View style={s.startButtonInner}>
            <Text style={s.startButtonText}>Start</Text>
            <Icon name="chevron-right" size={18} color="#D00A45" />
          </View>
        </TouchableOpacity>

        {/* Login link */}
        {/* <TouchableOpacity
          style={s.loginLink}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={s.loginText}>
            Déjà un compte ?{" "}
            <Text style={s.loginTextBold}>Se connecter</Text>
          </Text>
        </TouchableOpacity> */}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  bgBlack: {
    flex: 1,
    backgroundColor: "#000",
  },

  // ── Top ──
  topSection: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 80,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  logoKayti: {
    fontSize: 45,
    fontFamily: Fonts.light,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  logoPic: {
    fontSize: 45,
    fontFamily: Fonts.black,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 18,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
    marginTop: 2,
    letterSpacing: 0.3,
  },

  // ── Hero Image ──
  heroContainer: {
    position: "absolute",
    top: height * 0.12,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroFadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  heroFadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },

  // ── Bottom ──
  bottomSection: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
    gap: 16,
  },

  // Start button — dark glass with subtle border (like Frame 15)
  startButton: {
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  startButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 40,
    gap: 6,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: Fonts.semibold,
    letterSpacing: 0.3,
  },

  // Login
  loginLink: {
    paddingVertical: 4,
  },
  loginText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  loginTextBold: {
    color: "#fff",
    fontFamily: Fonts.bold,
  },
});
