import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Colors, Gradients } from "../../../theme/colors";
import { GradientButton } from "../../../components/ui";
import { Icon } from "../../../components/ui/Icon";

const { width, height } = Dimensions.get("window");

// Animated counter for score
function AnimatedScore({ targetScore }: { targetScore: number }) {
  const [displayScore, setDisplayScore] = useState(0);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(animValue, {
        toValue: targetScore,
        duration: 1200,
        useNativeDriver: false,
      }).start();

      animValue.addListener(({ value }) => {
        setDisplayScore(Math.round(value));
      });
    }, 600);

    return () => {
      clearTimeout(timeout);
      animValue.removeAllListeners();
    };
  }, [targetScore]);

  return <Text style={styles.scoreNumber}>{displayScore}</Text>;
}

// Stat card component
interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  delay: number;
}

function StatCard({ icon, value, label, delay }: StatCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[styles.statCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <LinearGradient
        colors={["rgba(26,26,50,0.9)", "rgba(15,15,30,0.95)"]}
        style={styles.statCardGradient}
      >
        <View style={styles.statIconRow}>
          <Text style={styles.statIcon}>{icon}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

export default function AnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ answers: string }>();
  const answers = params.answers ? JSON.parse(params.answers) : {};

  const headerFade = useRef(new Animated.Value(0)).current;
  const photoPulse = useRef(new Animated.Value(1)).current;
  const badgeFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(badgeFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(photoPulse, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(photoPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handleNext = () => {
    router.push({
      pathname: "/(auth)/onboarding/questionnaire",
      params: { step: "1", answers: JSON.stringify(answers) },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={["#0F0A1E", "#1A1035", "#0A0A14"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <Text style={styles.title}>Analyser une photo</Text>
          <Text style={styles.subtitle}>Importez une photo pour l'analyser ...</Text>
        </Animated.View>

        {/* Photo comparison card */}
        <Animated.View style={[styles.photoCard, { transform: [{ scale: photoPulse }] }]}>
          <LinearGradient
            colors={["rgba(26,26,50,0.95)", "rgba(15,15,30,0.98)"]}
            style={styles.photoCardInner}
          >
            {/* Glowing border */}
            <View style={styles.photoCardBorder} />

            {/* Main photo area (AFTER) */}
            <View style={styles.photoAfterArea}>
              <Image
                source={require("../../../assets/images/analyser.jpg")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              {/* OPTIMISÉ badge */}
              <Animated.View style={[styles.optimisedBadge, { opacity: badgeFade }]}>
                <LinearGradient
                  colors={Gradients.brandReverse}
                  style={styles.optimisedBadgeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Icon name="zap" size={12} color="#fff" />
                  <Text style={styles.optimisedText}>OPTIMISÉ</Text>
                </LinearGradient>
              </Animated.View>
            </View>

            {/* AVANT thumbnail */}
            <View style={styles.beforeThumb}>
              <Image
                source={require("../../../assets/images/analyser.jpg")}
                style={{ width: "100%", height: "100%", opacity: 0.6 }}
                resizeMode="cover"
              />
              <Text style={styles.beforeLabel}>AVANT</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stat cards grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="↗" value="+20%" label="Exposition" delay={200} />
          <StatCard icon="↗" value="+15%" label="Contraste" delay={300} />
          <StatCard icon="↗" value="+12%" label="Netteté" delay={400} />
          <StatCard icon="↗" value="+18%" label="Couleurs" delay={500} />
        </View>

        {/* Quality score */}
        <Animated.View style={[styles.scoreCard, { opacity: headerFade }]}>
          <LinearGradient
            colors={["rgba(26,26,50,0.95)", "rgba(15,15,30,0.98)"]}
            style={styles.scoreCardInner}
          >
            {/* Glowing border */}
            <View style={styles.scoreBorderGlow} />
            <View style={styles.scoreContent}>
              <View style={styles.scoreLeft}>
                <Text style={styles.scoreCaption}>SCORE DE QUALITÉ</Text>
                <Text style={styles.scoreQuality}>Excellente</Text>
              </View>
              <View style={styles.scoreRight}>
                <LinearGradient
                  colors={["rgba(26,26,50,0.9)", "rgba(20,20,40,0.95)"]}
                  style={styles.scoreCircle}
                >
                  <AnimatedScore targetScore={98} />
                </LinearGradient>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Button pinned at bottom */}
      <View style={styles.ctaContainer}>
        <GradientButton label="Suivant" onPress={handleNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  ctaContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 12,
  },

  // Header
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },

  // Photo card
  photoCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: Colors.gradientPink,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  photoCardInner: {
    borderRadius: 20,
    height: 260,
    position: "relative",
    overflow: "hidden",
  },
  photoCardBorder: {
    position: "absolute",
    inset: 0,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.selectedBorder,
    zIndex: 2,
  },
  photoAfterArea: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  optimisedBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    borderRadius: 20,
    overflow: "hidden",
    zIndex: 5,
  },
  optimisedBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  optimisedIcon: {
    fontSize: 12,
  },
  optimisedText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  beforeThumb: {
    position: "absolute",
    bottom: 14,
    left: 14,
    width: 90,
    height: 70,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    zIndex: 5,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 6,
  },
  beforeLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: (width - 50) / 2,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: Colors.gradientPurple,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
  },
  statIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  statIcon: {
    fontSize: 16,
    color: Colors.accentPurple,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  // Score card
  scoreCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.gradientPink,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  scoreCardInner: {
    borderRadius: 16,
    position: "relative",
    overflow: "hidden",
  },
  scoreBorderGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.selectedBorder,
    zIndex: 2,
  },
  scoreContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  scoreLeft: {
    flex: 1,
  },
  scoreRight: {},
  scoreCaption: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  scoreQuality: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.scoreExcellent,
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.textPrimary,
  },

  cta: { marginTop: 8 },
});
