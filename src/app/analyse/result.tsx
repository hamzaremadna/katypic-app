import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Gradients } from "../../theme/colors";
import { KaytiHeader, GradientButton } from "../../components/ui";
import { Icon, IconName } from "../../components/ui/Icon";
import {
  usePhotoAnalysis,
  useAnalyzePhoto,
} from "../../hooks/usePhotoAnalysis";
import { hapticMedium, hapticSuccess, hapticError } from "../../utils/haptics";
import { useUploadPhoto } from "../../hooks/useUploadPhoto";

const { width } = Dimensions.get("window");

// ─────────────────────────────────────────────
// Pipeline steps
// ─────────────────────────────────────────────
type PipelineStep = "uploading" | "analyzing" | "done" | "error";

const STEP_LABELS: Record<PipelineStep, string> = {
  uploading: "Upload de la photo…",
  analyzing: "Analyse IA en cours…",
  done: "",
  error: "Une erreur est survenue",
};

// ─────────────────────────────────────────────
// Circular Score Indicator
// ─────────────────────────────────────────────
interface CircularScoreProps {
  score: number;
  size?: number;
}

function CircularScore({ score, size = 140 }: CircularScoreProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [score]);

  const getScoreColor = (s: number): string => {
    if (s >= 80) return Colors.accentGreen;
    if (s >= 60) return Colors.accentBlue;
    if (s >= 40) return "#FFA500";
    return Colors.accentRed;
  };

  const getScoreLabel = (s: number): string => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Bon";
    if (s >= 40) return "Moyen";
    return "A améliorer";
  };

  const scoreColor = getScoreColor(score);

  return (
    <View style={[circScore.container, { width: size, height: size }]}>
      <View
        style={[
          circScore.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 6,
            borderColor: "rgba(255,255,255,0.06)",
          },
        ]}
      />
      <View
        style={[
          circScore.progressRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 6,
            borderColor: scoreColor,
            borderRightColor: "transparent",
            borderBottomColor: score > 50 ? scoreColor : "transparent",
            borderLeftColor: score > 75 ? scoreColor : "transparent",
            transform: [{ rotate: "-45deg" }],
          },
        ]}
      />
      <View style={circScore.textContainer}>
        <Text style={[circScore.scoreValue, { color: scoreColor }]}>
          {displayScore}
        </Text>
        <Text style={circScore.scoreMax}>/100</Text>
        <Text style={[circScore.scoreLabel, { color: scoreColor }]}>
          {getScoreLabel(score)}
        </Text>
      </View>
    </View>
  );
}

const circScore = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  ring: { position: "absolute" },
  progressRing: { position: "absolute" },
  textContainer: { alignItems: "center", gap: 2 },
  scoreValue: { fontSize: 42, fontWeight: "900", letterSpacing: -1 },
  scoreMax: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: "600",
    marginTop: -4,
  },
  scoreLabel: { fontSize: 13, fontWeight: "700", marginTop: 4 },
});

// ─────────────────────────────────────────────
// Score Bar
// ─────────────────────────────────────────────
interface ScoreBarProps {
  label: string;
  icon: IconName;
  score: number;
  delay: number;
}

function ScoreBar({ label, icon, score, delay }: ScoreBarProps) {
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: score,
      duration: 800,
      delay,
      useNativeDriver: false,
    }).start();
  }, [score, delay]);

  const animatedWidth = barWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={bar.container}>
      <View style={bar.labelRow}>
        <Icon name={icon} size={16} color={Colors.textPrimary} />
        <Text style={bar.label}>{label}</Text>
        <Text style={bar.value}>{score}/100</Text>
      </View>
      <View style={bar.track}>
        <Animated.View style={[bar.fillWrapper, { width: animatedWidth }]}>
          <LinearGradient
            colors={Gradients.brand}
            style={bar.fill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const bar = StyleSheet.create({
  container: { gap: 8 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary, flex: 1 },
  value: { fontSize: 13, fontWeight: "700", color: Colors.textSecondary },
  track: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 4,
    overflow: "hidden",
  },
  fillWrapper: { height: "100%", borderRadius: 4, overflow: "hidden" },
  fill: { flex: 1, borderRadius: 4 },
});

// ─────────────────────────────────────────────
// Feedback Card
// ─────────────────────────────────────────────
interface FeedbackCardProps {
  type: "positive" | "suggestion";
  text: string;
  delay: number;
}

function FeedbackCard({ type, text, delay }: FeedbackCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
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
  }, [delay]);

  const isPositive = type === "positive";

  return (
    <Animated.View
      style={[
        fb.card,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View
        style={[
          fb.iconBg,
          {
            backgroundColor: isPositive
              ? "rgba(0,200,81,0.15)"
              : "rgba(233,30,140,0.15)",
          },
        ]}
      >
        <Icon
          name={isPositive ? "check" : "lightbulb"}
          size={16}
          color={Colors.textPrimary}
        />
      </View>
      <Text style={fb.text}>{text}</Text>
    </Animated.View>
  );
}

const fb = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: "500",
  },
});

// ─────────────────────────────────────────────
// Main Result Screen
// ─────────────────────────────────────────────
export default function AnalyseResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    photoUri?: string;
    photoId?: string;
  }>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── Pipeline state ──
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>(
    params.photoId ? "done" : "uploading",
  );
  const [resolvedPhotoId, setResolvedPhotoId] = useState(
    params.photoId ?? "",
  );
  const [resolvedPhotoUrl, setResolvedPhotoUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ── Mutations ──
  const uploadPhoto = useUploadPhoto();
  const analyzePhoto = useAnalyzePhoto();

  // ── Fetch existing analysis (when photoId is known) ──
  const {
    data: analyses,
    isLoading,
    isError,
  } = usePhotoAnalysis(resolvedPhotoId);
  const analysis = analyses?.[0];

  // ── Auto-trigger upload → analyze when we have a local photoUri ──
  const pipelineRan = useRef(false);

  useEffect(() => {
    if (pipelineRan.current || !params.photoUri || params.photoId) return;
    pipelineRan.current = true;

    (async () => {
      try {
        // Step 1: Upload
        setPipelineStep("uploading");
        const photo = await uploadPhoto.mutateAsync({
          photoUri: params.photoUri!,
        });

        setResolvedPhotoId(photo.id);
        setResolvedPhotoUrl(photo.url);

        // Step 2: Analyze
        setPipelineStep("analyzing");
        await analyzePhoto.mutateAsync({
          photoId: photo.id,
          imageUrl: photo.url,
        });

        setPipelineStep("done");
        hapticSuccess(); // analysis complete — triple beat
      } catch (err) {
        console.warn("Pipeline error:", err);
        const msg =
          err instanceof Error ? err.message : "Erreur inconnue";
        setErrorMessage(msg);
        setPipelineStep("error");
        hapticError();
      }
    })();
  }, []);

  // Build UI data from real API
  const scores = {
    overall: analysis?.overallScore ?? 0,
    breakdown: [
      {
        label: "Composition",
        icon: "grid" as const,
        score: analysis?.compositionScore ?? 0,
      },
      {
        label: "Lumière",
        icon: "sun" as const,
        score: analysis?.lightingScore ?? 0,
      },
      {
        label: "Couleur",
        icon: "sliders" as const,
        score: analysis?.colorScore ?? 0,
      },
      {
        label: "Technique",
        icon: "settings" as const,
        score: analysis?.technicalScore ?? 0,
      },
    ],
    positives: analysis
      ? [
          analysis.compositionFeedback,
          analysis.lightingFeedback,
          analysis.colorFeedback,
        ].filter(Boolean)
      : [],
    suggestions: analysis?.suggestions ?? [],
  };

  useEffect(() => {
    if (pipelineStep === "done" && !isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [pipelineStep, isLoading]);

  // ── Loading / Pipeline in progress ──
  if (
    pipelineStep === "uploading" ||
    pipelineStep === "analyzing" ||
    (isLoading && resolvedPhotoId)
  ) {
    return (
      <View
        style={[
          s.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <LinearGradient
          colors={["#0E0A24", "#080814"]}
          style={StyleSheet.absoluteFillObject}
        />
        <KaytiHeader showBack title="Analyse IA" />

        {params.photoUri && (
          <Image
            source={{ uri: params.photoUri }}
            style={s.loadingPhoto}
            resizeMode="cover"
          />
        )}

        <ActivityIndicator size="large" color={Colors.gradientPink} />
        <Text style={s.loadingText}>
          {STEP_LABELS[pipelineStep] || "Analyse en cours…"}
        </Text>

        <View style={s.stepsRow}>
          <View
            style={[
              s.stepDot,
              pipelineStep === "uploading" && s.stepDotActive,
              pipelineStep !== "uploading" && s.stepDotDone,
            ]}
          />
          <View
            style={[
              s.stepLine,
              pipelineStep !== "uploading" && s.stepLineActive,
            ]}
          />
          <View
            style={[
              s.stepDot,
              pipelineStep === "analyzing" && s.stepDotActive,
            ]}
          />
          <View
            style={[
              s.stepLine,
              pipelineStep === "done" && s.stepLineActive,
            ]}
          />
          <View
            style={[s.stepDot, pipelineStep === "done" && s.stepDotActive]}
          />
        </View>
        <View style={s.stepsLabelRow}>
          <Text style={s.stepLabel}>Upload</Text>
          <Text style={s.stepLabel}>Analyse</Text>
          <Text style={s.stepLabel}>Résultat</Text>
        </View>
      </View>
    );
  }

  // ── Error state ──
  if (pipelineStep === "error") {
    return (
      <View
        style={[
          s.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <LinearGradient
          colors={["#0E0A24", "#080814"]}
          style={StyleSheet.absoluteFillObject}
        />
        <KaytiHeader showBack title="Analyse IA" />
        <Icon name="x" size={48} color={Colors.accentRed} />
        <Text
          style={[
            s.loadingText,
            { color: Colors.accentRed, marginTop: 16 },
          ]}
        >
          {errorMessage || "Une erreur est survenue"}
        </Text>
        <TouchableOpacity
          style={s.retryBtn}
          onPress={() => {
            pipelineRan.current = false;
            setPipelineStep("uploading");
            setErrorMessage("");
          }}
        >
          <LinearGradient
            colors={Gradients.brand}
            style={s.retryBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="refresh" size={16} color="#fff" />
            <Text style={s.retryBtnText}>Réessayer</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Results ──
  const displayUri = params.photoUri || resolvedPhotoUrl;

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      <KaytiHeader showBack title="Analyse IA" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Photo Preview */}
        <Animated.View style={[s.photoContainer, { opacity: fadeAnim }]}>
          {displayUri ? (
            <Image
              source={{ uri: displayUri }}
              style={s.photo}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient colors={["#2D1060", "#1A0840"]} style={s.photo}>
              <Icon name="image" size={48} color={Colors.textMuted} />
              <Text style={s.photoPlaceholderText}>Photo analysée</Text>
            </LinearGradient>
          )}
        </Animated.View>

        {isError && (
          <View style={{ alignItems: "center", paddingVertical: 16 }}>
            <Text style={{ color: Colors.accentPink, fontSize: 14 }}>
              Impossible de charger l&apos;analyse. Réessayez.
            </Text>
          </View>
        )}

        {/* Overall Score */}
        <View style={s.scoreSection}>
          <Text style={s.sectionTitle}>Score global</Text>
          <CircularScore score={scores.overall} />
        </View>

        {/* Score Breakdown */}
        <View style={s.breakdownSection}>
          <Text style={s.sectionTitle}>Détail des scores</Text>
          <View style={s.breakdownCard}>
            {scores.breakdown.map((item, i) => (
              <ScoreBar
                key={item.label}
                label={item.label}
                icon={item.icon}
                score={item.score}
                delay={300 + i * 150}
              />
            ))}
          </View>
        </View>

        {scores.positives.length > 0 && (
          <View style={s.feedbackSection}>
            <View style={s.feedbackHeader}>
              <View
                style={[
                  s.feedbackDot,
                  { backgroundColor: Colors.accentGreen },
                ]}
              />
              <Text style={s.sectionTitle}>Ce qui fonctionne bien</Text>
            </View>
            <View style={s.feedbackList}>
              {scores.positives.map((text, i) => (
                <FeedbackCard
                  key={`pos-${i}`}
                  type="positive"
                  text={text}
                  delay={600 + i * 100}
                />
              ))}
            </View>
          </View>
        )}

        {scores.suggestions.length > 0 && (
          <View style={s.feedbackSection}>
            <View style={s.feedbackHeader}>
              <View
                style={[
                  s.feedbackDot,
                  { backgroundColor: Colors.accentPink },
                ]}
              />
              <Text style={s.sectionTitle}>
                Suggestions d&apos;amélioration
              </Text>
            </View>
            <View style={s.feedbackList}>
              {scores.suggestions.map((text, i) => (
                <FeedbackCard
                  key={`sug-${i}`}
                  type="suggestion"
                  text={text}
                  delay={900 + i * 100}
                />
              ))}
            </View>
          </View>
        )}

        {/* CTA Button */}
        <View style={s.ctaContainer}>
          <GradientButton
            label="Retoucher la photo"
            onPress={() => {
              router.push({
                pathname: "/edit/[photoId]",
                params: {
                  photoId: resolvedPhotoId || "current",
                  photoUri: displayUri || "",
                },
              });
            }}
          />
        </View>

        {/* Share / Save row */}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={s.actionBtn}
            activeOpacity={0.7}
            onPress={() =>
              Share.share({
                message: `Mon analyse photo KaytiPic — Score global : ${scores.overall}/100`,
              })
            }
          >
            <View style={s.actionBtnBg}>
              <Icon name="share" size={20} color={Colors.textPrimary} />
            </View>
            <Text style={s.actionBtnLabel}>Partager</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionBtn}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                "Bientôt disponible",
                "La sauvegarde des analyses sera disponible prochainement.",
              )
            }
          >
            <View style={s.actionBtnBg}>
              <Icon name="download" size={20} color={Colors.textPrimary} />
            </View>
            <Text style={s.actionBtnLabel}>Sauvegarder</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionBtn}
            activeOpacity={0.7}
            onPress={() => router.push("/analyse/import")}
          >
            <View style={s.actionBtnBg}>
              <Icon name="refresh" size={20} color={Colors.textPrimary} />
            </View>
            <Text style={s.actionBtnLabel}>Ré-analyser</Text>
          </TouchableOpacity>
        </View>

        <View style={s.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 24 },

  // Loading
  loadingPhoto: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: 16,
    marginBottom: 24,
    opacity: 0.6,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 16,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 32,
    paddingHorizontal: 48,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  stepDotActive: {
    backgroundColor: Colors.accentPink,
    shadowColor: Colors.accentPink,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  stepDotDone: {
    backgroundColor: Colors.accentGreen,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 8,
  },
  stepLineActive: { backgroundColor: Colors.accentPink },
  stepsLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    marginTop: 8,
  },
  stepLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: "600" },
  retryBtn: { borderRadius: 50, overflow: "hidden", marginTop: 24 },
  retryBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 32,
    gap: 8,
  },
  retryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Photo
  photoContainer: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.gradientPurple,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  photo: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: "600",
  },

  scoreSection: { alignItems: "center", gap: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: Colors.textPrimary },

  breakdownSection: { gap: 14 },
  breakdownCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 20,
    gap: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  feedbackSection: { gap: 14 },
  feedbackHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  feedbackDot: { width: 8, height: 8, borderRadius: 4 },
  feedbackList: { gap: 10 },

  ctaContainer: { marginTop: 4 },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    marginTop: 4,
  },
  actionBtn: { alignItems: "center", gap: 8 },
  actionBtnBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  actionBtnLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },

  bottomSpacer: { height: 20 },
});
