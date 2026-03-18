import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Colors, Gradients } from "../../../theme/colors";
import { Fonts } from "../../../theme/typography";
import { Icon } from "../../../components/ui/Icon";
import { useOnboardingStore } from "../../../stores/onboardingStore";

const { width, height } = Dimensions.get("window");

function FeatureIcon({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={s.featureIcon}>
      <View style={s.featureIconCircle}>
        <Icon name={icon as any} size={22} color={Colors.textPrimary} />
      </View>
      <Text style={s.featureIconLabel}>{label}</Text>
    </View>
  );
}

export default function CongratsScreen() {
  const router = useRouter();
  const markDone = useOnboardingStore((s) => s.markDone);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    markDone();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 55,
        friction: 10,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* Hero photo */}
      <View style={s.heroPhoto}>
        <Image
          source={require("../../../assets/images/felicitation.png")}
          style={s.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", Colors.bgDeep]}
          locations={[0.5, 1]}
          style={s.heroFade}
        />
      </View>

      {/* Bottom content */}
      <Animated.View
        style={[
          s.bottomContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={s.title}>Félicitations !</Text>
        <Text style={s.subtitle}>
          Vous avez terminé le parcours de découverte
        </Text>

        <Text style={s.body}>
          Créez maintenant votre compte pour{"\n"}accéder à toutes les
          fonctionnalités et{"\n"}commencer votre aventure photo.
        </Text>

        {/* Register CTA */}
        <TouchableOpacity
          style={s.registerBtn}
          onPress={() => router.replace("/(auth)/onboarding/trial")}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={Gradients.purpleBlue}
            style={s.registerBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={s.registerBtnText}>Créer mon compte</Text>
            <Icon name="arrow-right" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Login link */}
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/login")}
          style={s.loginLink}
        >
          <Text style={s.loginText}>
            Déjà membre ? <Text style={s.loginBold}>Se connecter</Text>
          </Text>
        </TouchableOpacity>

        {/* Feature icons */}
        <View style={s.featuresRow}>
          <FeatureIcon icon="sparkles" label="Coaching IA" />
          <FeatureIcon icon="marker-pin" label="Spots photo" />
          <FeatureIcon icon="target" label="Progression" />
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },

  heroPhoto: {
    height: height * 0.42,
    overflow: "hidden",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },

  bottomContent: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: -20,
  },

  title: {
    fontFamily: Fonts.black,
    fontSize: 38,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 4,
  },

  registerBtn: {
    width: "100%",
    borderRadius: 50,
    overflow: "hidden",
    shadowColor: Colors.gradientPurple,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    marginTop: 10,
  },
  registerBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    gap: 10,
  },
  registerBtnText: {
    fontFamily: Fonts.bold,
    color: "#fff",
    fontSize: 16,
  },

  loginLink: { paddingVertical: 4 },
  loginText: {
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    fontSize: 15,
  },
  loginBold: {
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
  },

  featuresRow: {
    flexDirection: "row",
    gap: 28,
    marginTop: 12,
  },
  featureIcon: { alignItems: "center", gap: 8 },
  featureIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  featureIconLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
