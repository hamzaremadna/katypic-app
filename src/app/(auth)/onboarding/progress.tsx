import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Svg, { Path, Line, Text as SvgText } from "react-native-svg";
import { Colors, Gradients } from "../../../theme/colors";
import { Icon, IconName } from "../../../components/ui/Icon";
import { KaytiHeader, GradientButton } from "../../../components/ui";

const { width } = Dimensions.get("window");
const CHART_W = width - 110;
const CHART_H = 100;

// ─── Animated Counter ────────────────────────────────────
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(anim, {
        toValue: target,
        duration: 1400,
        delay: 400,
        useNativeDriver: false,
      }).start();
      anim.addListener(({ value }) => setVal(Math.round(value)));
    }, 300);
    return () => {
      clearTimeout(t);
      anim.removeAllListeners();
    };
  }, []);

  return (
    <Text style={stat.value}>
      {val}
      {suffix}
    </Text>
  );
}

// ─── Evolution Chart Card ────────────────────────────────
function ChartCard() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  // Simulated curve data points (exponential growth)
  const points = [
    { x: 0, y: 200 },
    { x: 0.15, y: 400 },
    { x: 0.3, y: 700 },
    { x: 0.45, y: 1100 },
    { x: 0.6, y: 1600 },
    { x: 0.75, y: 2200 },
    { x: 0.9, y: 2800 },
    { x: 1, y: 3200 },
  ];

  const toX = (pct: number) => pct * CHART_W;
  const toY = (val: number) => CHART_H - (val / 3500) * CHART_H;

  // Build smooth curve path
  let curvePath = `M ${toX(points[0].x)} ${toY(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = toX((prev.x + curr.x) / 2);
    curvePath += ` C ${cpx} ${toY(prev.y)}, ${cpx} ${toY(curr.y)}, ${toX(curr.x)} ${toY(curr.y)}`;
  }

  // Fill area path
  const fillPath = `${curvePath} L ${toX(1)} ${CHART_H} L ${toX(0)} ${CHART_H} Z`;

  const yLabels = [1000, 2000, 3000];
  const xLabels = ["Jour 5", "Jour 15", "Jour 20", "Jour 25"];

  return (
    <Animated.View style={[ch.container, { opacity: fadeAnim }]}>
      <LinearGradient colors={["rgba(20,18,40,0.95)", "rgba(12,12,28,0.98)"]} style={ch.inner}>
        <Text style={ch.title}>Évolution (30 jours)</Text>

        <Svg width={CHART_W} height={CHART_H + 22} style={{ marginTop: 4 }}>
          {/* Y-axis grid lines */}
          {yLabels.map((v) => (
            <React.Fragment key={v}>
              <Line
                x1={0}
                y1={toY(v)}
                x2={CHART_W}
                y2={toY(v)}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <SvgText x={0} y={toY(v) - 4} fill="rgba(255,255,255,0.3)" fontSize={10}>
                {v}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Fill area */}
          <Path d={fillPath} fill="url(#grad)" opacity={0.3} />
          <LinearGradient colors={["rgba(123,47,190,0.5)", "rgba(123,47,190,0)"]} id="grad" />

          {/* Curve line */}
          <Path
            d={curvePath}
            stroke="#9B3BBE"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />

          {/* X labels */}
          {xLabels.map((label, i) => (
            <SvgText
              key={label}
              x={CHART_W * ((i + 1) / (xLabels.length + 1))}
              y={CHART_H + 14}
              fill="rgba(255,255,255,0.35)"
              fontSize={10}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          ))}
        </Svg>
      </LinearGradient>
    </Animated.View>
  );
}

const ch = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  inner: { padding: 14, borderRadius: 12 },
  title: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
});

// ─── Stat Card ───────────────────────────────────────────
function StatCard({
  label,
  mainValue,
  suffix,
  delta,
  delay,
}: {
  label: string;
  mainValue: number;
  suffix?: string;
  delta: string;
  delay: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

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

  return (
    <Animated.View
      style={[stat.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <LinearGradient colors={Gradients.card} style={stat.cardGradient}>
        <Text style={stat.label}>{label}</Text>
        <View style={stat.valueRow}>
          <AnimatedNumber target={mainValue} suffix={suffix} />
          {!suffix && <Text style={stat.outOf}>/100</Text>}
        </View>
        <View style={stat.deltaRow}>
          <Icon name="trophy" size={12} color={Colors.accentBlue} />
          <Text style={stat.deltaText}>{delta}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const stat = StyleSheet.create({
  card: { width: (width - 140) / 2, borderRadius: 10, overflow: "hidden" },
  cardGradient: {
    padding: 10,
    gap: 3,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 10,
  },
  label: { fontSize: 9, color: Colors.textSecondary, fontWeight: "600" },
  valueRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  value: { fontSize: 18, fontWeight: "900", color: Colors.textPrimary },
  outOf: { fontSize: 10, color: Colors.textSecondary, marginLeft: 2 },
  deltaRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  deltaText: { fontSize: 9, color: Colors.accentBlue, fontWeight: "600" },
});

// ─── Quest Path Card ─────────────────────────────────────
interface QuestPath {
  tag: string;
  tagColor: string;
  borderColor: string;
  bgColors: readonly [string, string];
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  icon: IconName;
  iconColor: string;
}

const QUEST_PATHS: QuestPath[] = [
  {
    tag: "LES BASES",
    tagColor: "#4A90E2",
    borderColor: "#4A90E2",
    bgColors: ["rgba(74,144,226,0.15)", "rgba(26,26,46,0.95)"],
    title: "Débutant",
    subtitle: "Apprends les fondamentaux de la photo",
    completedCount: 2,
    totalCount: 6,
    icon: "target",
    iconColor: "#4A90E2",
  },
  {
    tag: "MODE ARTISTIQUE",
    tagColor: "#9B59B6",
    borderColor: "#9B59B6",
    bgColors: ["rgba(155,89,182,0.15)", "rgba(26,26,46,0.95)"],
    title: "Créatif",
    subtitle: "Développe ton style unique et ta vision",
    completedCount: 1,
    totalCount: 6,
    icon: "sparkles",
    iconColor: "#9B59B6",
  },
  {
    tag: "MONDE OUVERT",
    tagColor: "#E91E8C",
    borderColor: "#E91E8C",
    bgColors: ["rgba(233,30,140,0.15)", "rgba(26,26,46,0.95)"],
    title: "Explorateur",
    subtitle: "Découvre les meilleurs spots urbains",
    completedCount: 1,
    totalCount: 6,
    icon: "map",
    iconColor: "#E91E8C",
  },
];

function QuestPathCard({ path, delay }: { path: QuestPath; delay: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const progress = path.completedCount / path.totalCount;
  const percentage = Math.round(progress * 100);

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

  return (
    <Animated.View
      style={[
        qc.card,
        {
          borderColor: path.borderColor,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={path.bgColors as [string, string]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={qc.topRow}>
        <View style={[qc.tag, { backgroundColor: path.tagColor }]}>
          <Text style={qc.tagText}>{path.tag}</Text>
        </View>
        <Text style={qc.count}>
          {path.completedCount}/{path.totalCount}
        </Text>
      </View>

      <View style={qc.titleRow}>
        <Text style={qc.title}>{path.title}</Text>
        <View style={[qc.iconCircle, { borderColor: `${path.iconColor}40` }]}>
          <Icon name={path.icon} size={15} color={path.iconColor} />
        </View>
      </View>

      <View style={qc.progressSection}>
        <Text style={qc.progressLabel}>Progression</Text>
        <Text style={[qc.progressPercent, { color: path.tagColor }]}>{percentage}%</Text>
      </View>
      <View style={qc.barTrack}>
        <View style={[qc.barFill, { width: `${percentage}%`, backgroundColor: path.tagColor }]} />
      </View>
    </Animated.View>
  );
}

const qc = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    padding: 8,
    gap: 3,
    marginHorizontal: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  tagText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  count: { fontSize: 10, fontWeight: "600", color: Colors.textSecondary },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 14, fontWeight: "800", color: Colors.textPrimary },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  progressSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: { fontSize: 9, fontWeight: "600", color: Colors.textMuted },
  progressPercent: { fontSize: 10, fontWeight: "700" },
  barTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 2 },
});

// ─── Main Screen ─────────────────────────────────────────
export default function ProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ answers: string }>();
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0E0A24", "#080814"]} style={StyleSheet.absoluteFillObject} />

      <LinearGradient colors={["rgba(45,30,100,0.4)", "transparent"]} style={s.bgGlow} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <KaytiHeader />

        {/* Hero */}
        <Animated.View style={[s.hero, { opacity: headerFade }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={s.heroIcon}>↗</Text>
            <Text style={s.heroTitle}>Suivez votre évolution</Text>
          </View>
          <Text style={s.heroSub}>Votre courbe de progression personnalisée avec l'IA</Text>
        </Animated.View>

        {/* Chart */}
        <ChartCard />

        {/* Stats row */}
        <View style={s.statsRow}>
          <StatCard label="Score moyen" mainValue={78} delta="+8 points" delay={300} />
          <StatCard
            label="Photos prises"
            mainValue={247}
            suffix=""
            delta="+15 cette semaine"
            delay={450}
          />
        </View>

        {/* Quests section */}
        <Text style={s.questsTitle}>Explorez des quêtes ...</Text>

        {QUEST_PATHS.map((path, i) => (
          <QuestPathCard key={path.tag} path={path} delay={500 + i * 150} />
        ))}
      </ScrollView>

      {/* Button pinned at bottom */}
      <View style={s.ctaContainer}>
        <GradientButton
          label="Suivant"
          onPress={() => router.push({ pathname: "/(auth)/onboarding/congrats", params })}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 16, gap: 8 },
  ctaContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 12,
  },
  bgGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 250 },
  hero: { paddingHorizontal: 20 },
  heroIcon: { fontSize: 16, color: Colors.textPrimary },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  heroSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 100,
    marginTop: -20,
    zIndex: 2,
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  questsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
    paddingHorizontal: 20,
    textAlign: "center",
  },
});
