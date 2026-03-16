/**
 * TourOverlay — in-app guided tour with curvy SVG arrows.
 *
 * Each TourStep defines:
 *  - text         : tooltip message
 *  - arrowTipX/Y  : where the arrow tip points (0–1 of screen)
 *  - tooltipY     : vertical center of tooltip card (0–1 of screen)
 *  - arrowSide    : which edge of the tooltip card the arrow departs from
 */
import React, { useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradients } from "../../theme/colors";

const { width: W, height: H } = Dimensions.get("window");

export interface TourStep {
  /** Tooltip text shown in the card */
  text: string;
  /** 0–1: where arrow tip points horizontally */
  arrowTipX: number;
  /** 0–1: where arrow tip points vertically */
  arrowTipY: number;
  /** 0–1: center Y of the tooltip card */
  tooltipY: number;
  /** Which side of the card the arrow departs from */
  arrowSide: "top" | "bottom" | "left" | "right";
}

interface Props {
  steps: TourStep[];
  tourTitle: string;
  visible: boolean;
  onFinish: () => void;
}

const CARD_W = W - 48;
const CARD_H = 100; // approximate

const ARROW_IMG = require("../../assets/images/arrow.png");
const ARROW_W = 72;
const ARROW_H = 108;

// ─── Main component ───────────────────────────────────────
export function TourOverlay({ steps, tourTitle, visible, onFinish }: Props) {
  const [stepIndex, setStepIndex] = React.useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(20)).current;

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  // Fade in on mount / step change
  useEffect(() => {
    fadeAnim.setValue(0);
    cardSlide.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(cardSlide, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, [stepIndex, visible]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onFinish();
      setStepIndex(0);
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [isLast, onFinish]);

  const handleSkip = useCallback(() => {
    onFinish();
    setStepIndex(0);
  }, [onFinish]);

  const clampedCardTop = useMemo(() => {
    const cardTop = step.tooltipY * H - CARD_H / 2;
    return Math.max(
      Platform.OS === "ios" ? 60 : 40,
      Math.min(H - CARD_H - 100, cardTop),
    );
  }, [step]);

  // Compute PNG arrow position & rotation based on arrowSide
  const arrowImageStyle = useMemo(() => {
    const tipX = step.arrowTipX * W;
    let top: number;
    let left: number;
    let rotation: string;
    let scaleX = 1;

    switch (step.arrowSide) {
      case "bottom":
        rotation = "0deg";
        top = clampedCardTop + CARD_H + 6;
        left = Math.max(8, Math.min(W - ARROW_W - 8, tipX - ARROW_W * 0.45));
        break;
      case "top":
        rotation = "180deg";
        top = clampedCardTop - ARROW_H - 6;
        left = Math.max(8, Math.min(W - ARROW_W - 8, tipX - ARROW_W * 0.45));
        break;
      case "left":
        rotation = "90deg";
        scaleX = -1;
        top = clampedCardTop + CARD_H / 2 - ARROW_W / 2;
        left = 24 - ARROW_H * 0.5;
        break;
      case "right":
      default:
        rotation = "-90deg";
        top = clampedCardTop + CARD_H / 2 - ARROW_W / 2;
        left = W - 24 - ARROW_H * 0.5;
        break;
    }
    return { top, left, rotation, scaleX };
  }, [step, clampedCardTop]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[s.container, { opacity: fadeAnim }]}
      pointerEvents="box-none"
    >
      {/* ── Dark backdrop ── */}
      <View style={s.backdrop} pointerEvents="none" />

      {/* ── Handwritten Arrow ── */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: ARROW_W,
          height: ARROW_H,
          top: arrowImageStyle.top,
          left: arrowImageStyle.left,
        }}
      >
        <Image
          source={ARROW_IMG}
          style={{
            width: ARROW_W,
            height: ARROW_H,
            opacity: 0.9,
            transform: [
              { rotate: arrowImageStyle.rotation },
              { scaleX: arrowImageStyle.scaleX },
            ],
          }}
          resizeMode="contain"
        />
      </View>

      {/* ── Tooltip card ── */}
      <Animated.View
        style={[
          s.card,
          {
            top: clampedCardTop,
            transform: [{ translateY: cardSlide }],
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(30,15,60,0.97)", "rgba(15,10,35,0.99)"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Purple top accent line */}
        <View style={s.cardAccent} />

        {/* Header: tour title + step counter */}
        <View style={s.cardHeader}>
          <View style={s.tourTitlePill}>
            <Text style={s.tourTitleText}>{tourTitle}</Text>
          </View>
          <Text style={s.stepCounter}>
            {stepIndex + 1}/{steps.length}
          </Text>
        </View>

        {/* Message */}
        <Text style={s.cardText}>{step.text}</Text>
      </Animated.View>

      {/* ── Bottom actions ── */}
      <View style={s.actions}>
        <TouchableOpacity style={s.skipBtn} onPress={handleSkip}>
          <Text style={s.skipBtnText}>Passez</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={isLast ? (["#E91E8C", "#7B2FBE"] as [string, string]) : Gradients.brand}
            style={s.nextBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={s.nextBtnText}>
              {isLast ? "Terminer" : "Suivant"}
            </Text>
            {!isLast && (
              <Text style={s.nextBtnArrow}>→</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Step dots ── */}
      <View style={s.dots}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={[s.dot, i === stepIndex && s.dotActive]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    pointerEvents: "box-none" as any,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4,4,14,0.82)",
  },

  // Tooltip card
  card: {
    position: "absolute",
    left: 24,
    right: 24,
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(123,47,190,0.4)",
    shadowColor: "#7B2FBE",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 2,
    backgroundColor: Colors.accentPurple,
    borderRadius: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  tourTitlePill: {
    backgroundColor: "rgba(123,47,190,0.25)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(123,47,190,0.4)",
  },
  tourTitleText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.accentPurple,
    letterSpacing: 0.3,
  },
  stepCounter: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    lineHeight: 24,
  },

  // Actions bar
  actions: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 42 : 28,
    left: 24,
    right: 24,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  skipBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  nextBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: "hidden",
  },
  nextBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 6,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  nextBtnArrow: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },

  // Step dots
  dots: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 110 : 96,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.accentPurple,
  },
});
