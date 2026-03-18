import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
  Pressable,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Colors, Gradients } from "../../../theme/colors";
import { Fonts } from "../../../theme/typography";
import { Icon } from "../../../components/ui/Icon";
import {
  ONBOARDING_QUESTIONS,
  OnboardingOption,
} from "../../../types/onboarding";

const { width, height } = Dimensions.get("window");

// Background photos for each question step (sharp, no blur)
const BG_IMAGES = [
  require("../../../assets/images/question1.png"),
  require("../../../assets/images/question2.png"),
  require("../../../assets/images/question3.png"),
  require("../../../assets/images/question4.png"),
];

// ─── Option Card ─────────────────────────────────────────
interface OptionCardProps {
  option: OnboardingOption;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}

function OptionCard({ option, isSelected, onPress, index }: OptionCardProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 80,
      friction: 8,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.97,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.optionWrapper,
        { transform: [{ scale: scaleAnim }, { scale: pressAnim }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
      >
        {/* Glow fill for selected */}
        {isSelected && (
          <LinearGradient
            colors={["rgba(233,30,140,0.12)", "rgba(123,47,190,0.08)"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}

        <View style={styles.optionContent}>
          <View style={styles.optionTextBlock}>
            <Text style={styles.optionLabel}>{option.label}</Text>
            {option.description && (
              <Text style={styles.optionDescription}>{option.description}</Text>
            )}
          </View>

          {/* Selection indicator */}
          {isSelected ? (
            <View style={styles.selectedIndicator}>
              <LinearGradient
                colors={Gradients.brand}
                style={styles.selectedIndicatorInner}
              >
                <View style={styles.selectedDot} />
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.unselectedIndicator} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Progress Bar ────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: current / total,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [current, total]);

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={Gradients.progress}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────
export default function QuestionnaireScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ step: string }>();
  const stepIndex = Math.min(
    parseInt(params.step || "0", 10),
    ONBOARDING_QUESTIONS.length - 1
  );
  const question = ONBOARDING_QUESTIONS[stepIndex];

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Restore accumulated answers from params (preserved across question↔feature navigation)
  const answersParam = useLocalSearchParams<{ answers: string }>().answers;
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(() => {
    if (!answersParam) return {};
    try { return JSON.parse(answersParam); } catch { return {}; }
  });

  const headerFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    setSelectedIds([]);
    headerFade.setValue(0);
    contentSlide.setValue(30);

    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(contentSlide, {
        toValue: 0,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [stepIndex]);

  // After each question, navigate to the corresponding feature screen:
  // Q1 → analysis, Q2 → spots, Q3 → community, Q4 → progress
  const FEATURE_SCREENS = [
    "/(auth)/onboarding/analysis",
    "/(auth)/onboarding/spots",
    "/(auth)/onboarding/community",
    "/(auth)/onboarding/progress",
  ] as const;

  const navigateNext = useCallback(
    (ids: string[]) => {
      const newAnswers = {
        ...answers,
        [question.id]: question.multiSelect ? ids : ids[0],
      };
      setAnswers(newAnswers);
      router.push({
        pathname: FEATURE_SCREENS[stepIndex],
        params: { answers: JSON.stringify(newAnswers) },
      });
    },
    [answers, question, stepIndex, router]
  );

  const handleSelect = useCallback(
    (optionId: string) => {
      setSelectedIds([optionId]);
      setTimeout(() => navigateNext([optionId]), 300);
    },
    [navigateNext]
  );

  const handleBack = () => {
    if (stepIndex === 0) {
      router.back();
    } else {
      router.push({
        pathname: "/(auth)/onboarding/questionnaire",
        params: { step: String(stepIndex - 1) },
      });
    }
  };

  const bgImage = BG_IMAGES[stepIndex] || BG_IMAGES[0];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Sharp background image (top half visible, fades to dark) ── */}
      <View style={styles.backgroundPhoto}>
        <Image
          source={bgImage}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        {/* Gradient fade: transparent at top → dark at bottom */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(10,10,20,0.15)",
            "rgba(10,10,20,0.6)",
            "rgba(10,10,20,0.92)",
            Colors.bgDeep,
          ]}
          locations={[0, 0.25, 0.45, 0.65, 0.85]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* ── Header: back + progress + step label ── */}
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-left" size={28} color="#fff" />
        </TouchableOpacity>

        <ProgressBar current={question.step} total={question.totalSteps} />

        <Text style={styles.stepLabel}>
          Question {question.step}/{question.totalSteps}
        </Text>
      </Animated.View>

      {/* ── Question title ── */}
      <Animated.View
        style={[
          styles.questionContainer,
          { opacity: headerFade, transform: [{ translateY: contentSlide }] },
        ]}
      >
        <Text style={styles.questionText}>{question.question}</Text>
      </Animated.View>

      {/* Spacer to push options to bottom */}
      <View style={styles.spacer} />

      {/* ── Options list ── */}
      <Animated.View
        style={[
          styles.optionsContainer,
          { transform: [{ translateY: contentSlide }] },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.optionsScroll}
        >
          {question.options.map((option, index) => (
            <OptionCard
              key={option.id}
              option={option}
              isSelected={selectedIds.includes(option.id)}
              onPress={() => handleSelect(option.id)}
              index={index}
            />
          ))}

        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },

  // ── Background ──
  backgroundPhoto: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },

  // ── Header ──
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 24,
    zIndex: 5,
  },
  backButton: {
    marginBottom: 16,
    width: 32,
  },
  stepLabel: {
    fontFamily: Fonts.medium,
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
    letterSpacing: 0.3,
  },

  // ── Progress ──
  progressContainer: {
    width: "100%",
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    overflow: "hidden",
  },

  // ── Question ──
  questionContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    zIndex: 5,
  },
  questionText: {
    fontFamily: Fonts.black,
    fontSize: 30,
    color: "#fff",
    lineHeight: 38,
    letterSpacing: -0.5,
  },

  // ── Spacer ──
  spacer: {
    flex: 1,
  },

  // ── Options ──
  optionsContainer: {
    zIndex: 5,
  },
  optionsScroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 100 : 80,
    gap: 10,
  },
  optionWrapper: {
    width: "100%",
  },
  optionCard: {
    backgroundColor: "rgba(20, 20, 40, 0.75)",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  optionCardSelected: {
    borderColor: "#E91E8C",
    backgroundColor: "transparent",
    shadowColor: "#E91E8C",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  optionTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: "#fff",
    marginBottom: 3,
  },
  optionDescription: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // ── Selection indicators ──
  selectedIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: "hidden",
  },
  selectedIndicatorInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  unselectedIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },

});
