import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Colors, Gradients } from "../../../theme/colors";
import { Icon } from "../../../components/ui/Icon";
import { profileApi } from "../../../services/api/profile.api";

const { width, height } = Dimensions.get("window");

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Débutant complet",
  basics: "Bases solides",
  amateur: "Amateur confirmé",
  advanced: "Passionné avancé",
};

const SUBJECT_LABELS: Record<string, string> = {
  travel: "Voyages & Paysages",
  portrait: "Portraits",
  street: "Street & Urbain",
  nature: "Nature & Macro",
};

const PROFILE_TITLES: Record<string, string> = {
  beginner: "Le Découvreur",
  basics: "L'Explorateur",
  amateur: "Le Créatif",
  advanced: "L'Artiste",
};

interface TagBadgeProps {
  label: string;
  delay: number;
  color: string;
}

function TagBadge({ label, delay, color }: TagBadgeProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
    >
      <View style={[styles.tagBadge, { borderColor: color }]}>
        <Text style={[styles.tagBadgeText, { color }]}>{label}</Text>
      </View>
    </Animated.View>
  );
}

export default function ProfileResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ answers: string }>();
  const answers = params.answers ? JSON.parse(params.answers) : {};

  const [isSaving, setIsSaving] = useState(false);

  const level = answers.level || "basics";
  const subjects: string[] = Array.isArray(answers.subjects)
    ? answers.subjects
    : [answers.subjects || "travel"];

  const headerFade = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const glowPulse = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 60,
        friction: 10,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.7,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await profileApi.saveCreativeProfile({
        visualPreferences: subjects,
        artistPreferences: [level],
        filmPreferences: answers.style ? [answers.style] : [],
        musicPreferences: answers.ambition ? [answers.ambition] : [],
      });
    } catch {
      // Non-blocking — proceed even if save fails
    } finally {
      setIsSaving(false);
      router.replace("/(tabs)/home");
    }
  };

  const profileTitle = PROFILE_TITLES[level] || "L'Explorateur";
  const levelLabel = LEVEL_LABELS[level] || "Passionné";

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Ambient glow background */}
      <LinearGradient
        colors={["#0A0A14", "#1A0835", "#0A0A14"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Radial glow */}
      <Animated.View style={[styles.glowCircle, { opacity: glowPulse }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View style={styles.logoBar}>
            <Text style={styles.logoKayti}>Kayti</Text>
            <Text style={styles.logoPic}>Pic</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Votre profil créatif est prêt !
          </Text>
        </Animated.View>

        {/* Profile card */}
        <Animated.View
          style={[styles.profileCard, { transform: [{ scale: cardScale }] }]}
        >
          <LinearGradient
            colors={["rgba(30,20,60,0.98)", "rgba(15,10,35,0.99)"]}
            style={styles.profileCardInner}
          >
            {/* Glow border */}
            <LinearGradient
              colors={Gradients.brand}
              style={styles.profileCardBorderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.profileCardBorderInner}>
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={Gradients.brand}
                    style={styles.avatarRing}
                  >
                    <LinearGradient
                      colors={["#1A1040", "#2D1A60"]}
                      style={styles.avatarInner}
                    >
                      <Icon name="camera" size={36} color="#fff" />
                    </LinearGradient>
                  </LinearGradient>
                </View>

                {/* Profile title */}
                <Text style={styles.profileTitle}>{profileTitle}</Text>
                <Text style={styles.profileLevel}>{levelLabel}</Text>

                {/* Style tags */}
                <View style={styles.tagsRow}>
                  <TagBadge
                    label="Créatif"
                    delay={600}
                    color={Colors.accentPurple}
                  />
                  <TagBadge
                    label={SUBJECT_LABELS[subjects[0]] || "Voyageur"}
                    delay={750}
                    color={Colors.accentPink}
                  />
                  {subjects[1] && (
                    <TagBadge
                      label={SUBJECT_LABELS[subjects[1]]}
                      delay={900}
                      color="#5B8FDE"
                    />
                  )}
                </View>

                {/* Stats row */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>0</Text>
                    <Text style={styles.statLabel}>Photos</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>0</Text>
                    <Text style={styles.statLabel}>Analyses</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>0</Text>
                    <Text style={styles.statLabel}>Spots</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* AI description */}
            <View style={styles.aiDescription}>
              <View style={styles.aiDescriptionIcon}>
                <LinearGradient
                  colors={Gradients.brand}
                  style={styles.aiIconGradient}
                >
                  <Icon name="sparkles" size={14} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.aiDescriptionText}>
                Votre style tend vers{" "}
                {subjects.map((s) => SUBJECT_LABELS[s]).join(" & ")}.{"\n"}
                KaytiPic vous guidera pour progresser.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* What's next */}
        <Animated.View style={[styles.nextSteps, { opacity: headerFade }]}>
          <Text style={styles.nextStepsTitle}>Ce qui vous attend</Text>
          {[
            { icon: "camera" as const, text: "Analysez vos photos avec l'IA" },
            {
              icon: "marker-pin" as const,
              text: "Découvrez des spots près de vous",
            },
            {
              icon: "target" as const,
              text: "Progressez avec des conseils personnalisés",
            },
          ].map((item, i) => (
            <View key={i} style={styles.nextStepRow}>
              <View style={styles.nextStepIconWrapper}>
                <Icon name={item.icon} size={18} color="#fff" />
              </View>
              <Text style={styles.nextStepText}>{item.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleFinish}
          activeOpacity={0.85}
          disabled={isSaving}
        >
          <LinearGradient
            colors={Gradients.brand}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.ctaText}>Commencer à photographier</Text>
                <Icon name="arrow-right" size={20} color={Colors.textPrimary} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },

  // Glow
  glowCircle: {
    position: "absolute",
    top: height * 0.1,
    left: "50%",
    marginLeft: -200,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(123, 47, 190, 0.15)",
    // React Native doesn't support blur natively without expo-blur
  },

  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 60,
    gap: 20,
  },

  // Logo
  logoBar: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  logoKayti: { fontSize: 20, fontWeight: "300", color: Colors.textPrimary },
  logoPic: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },

  // Header
  header: {},
  headerSubtitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textPrimary,
    lineHeight: 32,
  },

  // Profile card
  profileCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: Colors.gradientPink,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  profileCardInner: {
    borderRadius: 24,
    padding: 3,
  },
  profileCardBorderGradient: {
    borderRadius: 22,
    padding: 1.5,
  },
  profileCardBorderInner: {
    backgroundColor: "#12082A",
    borderRadius: 21,
    padding: 24,
    alignItems: "center",
  },

  // Avatar
  avatarContainer: {
    marginBottom: 16,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 36,
  },

  profileTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileLevel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },

  // Tags
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginBottom: 20,
  },
  tagBadge: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tagBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  // AI description
  aiDescription: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  aiDescriptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  aiIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  aiIconText: {
    fontSize: 14,
  },
  aiDescriptionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Next steps
  nextSteps: {
    backgroundColor: "rgba(20,20,36,0.8)",
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  nextStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  nextStepIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(123,47,190,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  nextStepIcon: {
    fontSize: 18,
  },
  nextStepText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  decorativeArrow: {
    width: 55,
    height: 170,
    alignSelf: "flex-end",
    marginRight: 10,
    marginBottom: -8,
    opacity: 0.5,
  },

  // CTA
  ctaButton: {
    borderRadius: 50,
    overflow: "hidden",
    shadowColor: Colors.gradientPink,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  ctaText: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  ctaArrow: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "400",
  },
});
