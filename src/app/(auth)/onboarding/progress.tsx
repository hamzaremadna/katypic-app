import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Colors, Gradients } from "../../../theme/colors";
import { Icon } from "../../../components/ui/Icon";
import {
  KaytiHeader,
  GradientButton,
  FeatureList,
} from "../../../components/ui";

const { width } = Dimensions.get("window");

function AnimatedNumber({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
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

function LevelCard() {
  const barAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(barAnim, {
        toValue: 0.75,
        duration: 1200,
        delay: 500,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[lc.container, { opacity: fadeAnim }]}>
      <LinearGradient colors={Gradients.purpleBlue} style={lc.gradient}>
        <Text style={lc.levelLabel}>Niveau actuel</Text>
        <Text style={lc.levelName}>Pro +</Text>
        <View style={lc.barTrack}>
          <Animated.View
            style={[
              lc.barFill,
              {
                width: barAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0.3)"]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
        <Text style={lc.barHint}>75% vers "Confirmé"</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const lc = StyleSheet.create({
  container: { borderRadius: 16, overflow: "hidden", marginHorizontal: 20 },
  gradient: { padding: 20, gap: 8 },
  levelLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  levelName: { fontSize: 32, fontWeight: "900", color: "#fff" },
  barTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 4,
  },
  barFill: { height: "100%", borderRadius: 3, overflow: "hidden" },
  barHint: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
});

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
      style={[
        stat.card,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
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
  card: { flex: 1, borderRadius: 14, overflow: "hidden" },
  cardGradient: {
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
  },
  label: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  valueRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  value: { fontSize: 30, fontWeight: "900", color: Colors.textPrimary },
  outOf: { fontSize: 14, color: Colors.textSecondary, marginLeft: 2 },
  deltaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  deltaIcon: { fontSize: 12 },
  deltaText: { fontSize: 12, color: Colors.accentBlue, fontWeight: "600" },
});

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
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Blurred bg photo suggestion */}
      <LinearGradient
        colors={["rgba(45,30,100,0.4)", "transparent"]}
        style={s.bgGlow}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        <KaytiHeader />

        <Animated.View style={[s.hero, { opacity: headerFade }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name="trophy" size={24} color={Colors.textPrimary} />
            <Text style={s.heroTitle}>Suivez votre évolution</Text>
          </View>
          <Text style={s.heroSub}>
            Votre progression personnalisée{"\n"}avec l'IA
          </Text>
        </Animated.View>

        {/* Level card */}
        <LevelCard />

        {/* Stats row */}
        <View style={s.statsRow}>
          <StatCard
            label="Score moyen"
            mainValue={78}
            delta="+8 points"
            delay={300}
          />
          <StatCard
            label="Photos prises"
            mainValue={247}
            suffix=""
            delta="+15 cette semaine"
            delay={450}
          />
        </View>

        <FeatureList
          items={[
            "Progression suivie par l'IA",
            "Défis personnalisés",
            "Badges & récompenses",
          ]}
        />

        <GradientButton
          label="Suivant"
          onPress={() =>
            router.push({ pathname: "/(auth)/onboarding/congrats", params })
          }
          style={s.cta}
        />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 50, gap: 20 },
  bgGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 300 },
  hero: { paddingHorizontal: 20 },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  heroSub: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  statsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20 },
  cta: { marginHorizontal: 20 },
});
