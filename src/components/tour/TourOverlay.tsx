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
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
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

// ─── Compute SVG cubic bezier path ───────────────────────
function arrowPath(step: TourStep): string {
  const tipX = step.arrowTipX * W;
  const tipY = step.arrowTipY * H;

  // Card center
  const cardCX = W / 2;
  const cardCY = step.tooltipY * H;

  // Arrow origin on card edge
  let ox = cardCX;
  let oy = cardCY;
  switch (step.arrowSide) {
    case "top":
      oy = cardCY - CARD_H / 2 - 6;
      ox = cardCX + (tipX - cardCX) * 0.3;
      break;
    case "bottom":
      oy = cardCY + CARD_H / 2 + 6;
      ox = cardCX + (tipX - cardCX) * 0.3;
      break;
    case "left":
      ox = cardCX - CARD_W / 2 - 6;
      oy = cardCY + (tipY - cardCY) * 0.3;
      break;
    case "right":
      ox = cardCX + CARD_W / 2 + 6;
      oy = cardCY + (tipY - cardCY) * 0.3;
      break;
  }

  // Control points — push them outward for a nice curve
  const dx = tipX - ox;
  const dy = tipY - oy;
  const cp1x = ox + dx * 0.15 + dy * 0.35;
  const cp1y = oy + dy * 0.15 - dx * 0.35;
  const cp2x = tipX - dx * 0.15 + dy * 0.2;
  const cp2y = tipY - dy * 0.15 - dx * 0.2;

  return `M ${ox} ${oy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tipX} ${tipY}`;
}

// ─── Arrowhead polygon points ─────────────────────────────
function arrowHead(step: TourStep): string {
  const tipX = step.arrowTipX * W;
  const tipY = step.arrowTipY * H;
  const cardCX = W / 2;
  const cardCY = step.tooltipY * H;

  // Approximate tangent at the tip
  const dx = tipX - cardCX;
  const dy = tipY - cardCY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  const size = 10;
  // Two base points perpendicular to the direction
  const bx1 = tipX - ux * size + uy * size * 0.5;
  const by1 = tipY - uy * size - ux * size * 0.5;
  const bx2 = tipX - ux * size - uy * size * 0.5;
  const by2 = tipY - uy * size + ux * size * 0.5;

  return `M ${tipX} ${tipY} L ${bx1} ${by1} L ${bx2} ${by2} Z`;
}

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

  // Memoize expensive SVG path calculations
  const { path, head, clampedCardTop } = useMemo(() => {
    const cardTop = step.tooltipY * H - CARD_H / 2;
    return {
      path: arrowPath(step),
      head: arrowHead(step),
      clampedCardTop: Math.max(
        Platform.OS === "ios" ? 60 : 40,
        Math.min(H - CARD_H - 100, cardTop),
      ),
    };
  }, [step]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[s.container, { opacity: fadeAnim }]}
      pointerEvents="box-none"
    >
      {/* ── Dark backdrop ── */}
      <View style={s.backdrop} pointerEvents="none" />

      {/* ── SVG Arrow ── */}
      <Svg
        width={W}
        height={H}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      >
        {/* Arrow curve */}
        <Path
          d={path}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={2.5}
          fill="none"
          strokeDasharray="0"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrowhead */}
        <Path
          d={head}
          fill="rgba(255,255,255,0.9)"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={1}
        />
        {/* Small dot at arrow origin */}
        <Circle
          cx={
            step.arrowSide === "left"
              ? W / 2 - CARD_W / 2 - 6
              : step.arrowSide === "right"
              ? W / 2 + CARD_W / 2 + 6
              : W / 2 + (step.arrowTipX * W - W / 2) * 0.3
          }
          cy={
            step.arrowSide === "top"
              ? clampedCardTop - 6
              : step.arrowSide === "bottom"
              ? clampedCardTop + CARD_H + 6
              : clampedCardTop + CARD_H / 2 + (step.arrowTipY * H - clampedCardTop - CARD_H / 2) * 0.3
          }
          r={3}
          fill="rgba(255,255,255,0.7)"
        />
      </Svg>

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
