import React, { useEffect, useRef } from "react";
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

// Map camera marker
function CameraMarker({ color = "#7B2FBE", size = 36 }: { color?: string; size?: number }) {
  return (
    <View
      style={[
        styles.mapMarker,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Icon name="camera" size={size * 0.45} color="#fff" />
    </View>
  );
}

interface SpotCardProps {
  name: string;
  distance: string;
  rating: number;
  reviewCount: number;
  bestTime?: string;
  idealFor?: string;
  thumbnailGradient: readonly [string, string];
  thumbnailImage?: ReturnType<typeof require>;
  delay: number;
}

function SpotCard({
  name,
  distance,
  rating,
  reviewCount,
  bestTime,
  idealFor,
  thumbnailGradient,
  thumbnailImage,
  delay,
}: SpotCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

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
        tension: 70,
        friction: 10,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const stars = "★".repeat(Math.floor(rating));

  return (
    <Animated.View
      style={[styles.spotCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      {/* Thumbnail */}
      <View style={styles.spotThumbnail}>
        {thumbnailImage ? (
          <Image
            source={thumbnailImage}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient colors={thumbnailGradient} style={StyleSheet.absoluteFillObject} />
        )}
      </View>

      {/* Info */}
      <View style={styles.spotInfo}>
        <Text style={styles.spotName}>{name}</Text>
        <View style={styles.spotMeta}>
          <Text style={styles.spotDistance}>{distance}</Text>
          <Text style={styles.spotDot}>•</Text>
          <Text style={styles.spotRating}>{rating} </Text>
          <Icon name="star" size={13} color="#FFD700" />
          <Text style={styles.spotReviews}>({reviewCount})</Text>
        </View>
        <Text style={styles.spotDetail}>
          {bestTime ? `Meilleur moment: ${bestTime}` : `Idéal pour: ${idealFor}`}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function SpotsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ answers: string }>();
  const answers = params.answers ? JSON.parse(params.answers) : {};

  const headerFade = useRef(new Animated.Value(0)).current;
  const mapFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(mapFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleNext = () => {
    router.push({
      pathname: "/(auth)/onboarding/questionnaire",
      params: { step: "2", answers: JSON.stringify(answers) },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={["#0A0A14", "#150A2E", "#0A0A14"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          {/* KaytiPic logo top bar */}
          {/* <View style={styles.logoBar}>
            <Text style={styles.logoKayti}>Kayti</Text>
            <Text style={styles.logoPic}>Pic</Text>
          </View> */}
          <Text style={styles.title}>Découvrez les{"\n"}meilleurs spots</Text>
          <Text style={styles.subtitle}>
            Des milliers de spots photo{"\n"}géolocalisés près de chez vous
          </Text>
        </Animated.View>

        {/* Map card */}
        <Animated.View style={[styles.mapCard, { opacity: mapFade }]}>
          <View style={styles.mapInner}>
            <Image
              source={require("../../../assets/images/decouverte.jpg")}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />

            {/* Camera markers */}
            <View style={[styles.markerWrapper, { top: "20%", left: "25%" }]}>
              <CameraMarker color="#7B2FBE" size={38} />
            </View>
            <View style={[styles.markerWrapper, { top: "50%", left: "55%" }]}>
              <CameraMarker color="#9B3BBE" size={32} />
            </View>
            <View style={[styles.markerWrapper, { top: "35%", right: "15%" }]}>
              <CameraMarker color="#6B1FA0" size={28} />
            </View>
          </View>
        </Animated.View>

        {/* Spot list */}
        <SpotCard
          name="Mont Blanc Sunset"
          distance="2.3 km"
          rating={4.8}
          reviewCount={234}
          bestTime="18h-19h"
          thumbnailGradient={["#FF6B35", "#E91E8C"]}
          thumbnailImage={require("../../../assets/images/mont.png")}
          delay={200}
        />
        <SpotCard
          name="Centre-ville Art"
          distance="0.8 km"
          rating={4.6}
          reviewCount={156}
          idealFor="Street photo"
          thumbnailGradient={["#7B2FBE", "#2D1A69"]}
          thumbnailImage={require("../../../assets/images/centre.png")}
          delay={350}
        />

        {/* Features list */}
        <Animated.View style={[styles.featuresList, { opacity: headerFade }]}>
          {["+5000 spots répertoriés", "Notés par la communauté", "Horaires optimaux IA"].map(
            (text, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureCheckCircle}>
                  <LinearGradient colors={Gradients.purpleBlue} style={styles.featureCheckGradient}>
                    <Icon name="check" size={13} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <Text style={styles.featureText}>{text}</Text>
              </View>
            ),
          )}
        </Animated.View>

        {/* Next button */}
        <GradientButton label="Suivant" onPress={handleNext} style={styles.cta} />
      </ScrollView>
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
    paddingBottom: 50,
    gap: 14,
  },

  // Logo bar
  logoBar: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  logoKayti: {
    fontSize: 22,
    fontWeight: "300",
    color: Colors.textPrimary,
  },
  logoPic: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
  },

  // Header
  header: {},
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.textPrimary,
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
  },

  // Map
  mapCard: {
    borderRadius: 20,
    overflow: "hidden",
    height: 200,
    shadowColor: Colors.gradientPurple,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  mapInner: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  mapLine: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  mapLineH: {
    left: 0,
    right: 0,
    height: 1,
  },
  mapLineV: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  markerWrapper: {
    position: "absolute",
    shadowColor: "#7B2FBE",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  mapMarker: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // Spot cards
  spotCard: {
    flexDirection: "row",
    backgroundColor: "rgba(20,20,36,0.9)",
    borderRadius: 16,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  spotThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 12,
    overflow: "hidden",
  },
  spotInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  spotName: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  spotMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  spotDistance: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  spotDot: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  spotRating: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  spotReviews: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  spotDetail: {
    fontSize: 13,
    color: Colors.textMuted,
  },

  // Features
  featuresList: {
    backgroundColor: "rgba(20,20,36,0.7)",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureCheckCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: "hidden",
  },
  featureCheckGradient: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCheckIcon: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  featureText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  cta: { marginTop: 4 },
});
