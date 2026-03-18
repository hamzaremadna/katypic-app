import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Fonts } from "../../../theme/typography";
import { Icon } from "../../../components/ui/Icon";
import { hapticLight, hapticHeavy } from "../../../utils/haptics";

// ─── Timeline step ────────────────────────────────────────────────────────────

function TimelineStep({
  iconName,
  title,
  description,
  isLast,
}: {
  iconName: "lock" | "bell" | "star";
  title: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <View style={t.row}>
      <View style={t.lineCol}>
        <View style={t.circle}>
          <Icon name={iconName} size={18} color="#fff" />
        </View>
        {!isLast && <View style={t.line} />}
      </View>
      <View style={t.textCol}>
        <Text style={t.stepTitle}>{title}</Text>
        <Text style={t.stepDesc}>{description}</Text>
      </View>
    </View>
  );
}

const t = StyleSheet.create({
  row: { flexDirection: "row", gap: 16 },
  lineCol: { alignItems: "center", width: 40 },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7B2FBE",
    alignItems: "center",
    justifyContent: "center",
  },
  line: { flex: 1, width: 2, backgroundColor: "#DDD", marginVertical: 4 },
  textCol: { flex: 1, paddingTop: 8, paddingBottom: 20 },
  stepTitle: { fontFamily: Fonts.bold, fontSize: 15, color: "#111" },
  stepDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    lineHeight: 19,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TrialScreen() {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(true);

  const priceAmount = isYearly ? "99,99€ (8,33€/mois)" : "9,99€/mois";

  const handleStart = () => {
    hapticHeavy();
    router.replace("/(auth)/register");
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* ── Gradient header ── */}
      <View style={s.headerWrap}>
        <LinearGradient
          colors={["#E91E8C", "#9810FA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Decorative blobs */}
        <View style={s.blob1} />
        <View style={s.blob2} />

        <Text style={s.headerTitle}>Essai Premium</Text>
        <Text style={s.headerSubtitle}>7 jours d&apos;accès illimité</Text>
        <View style={s.iconRow}>
          <View style={s.iconCircle}>
            <Icon name="star" size={20} color="#fff" />
          </View>
          <View style={s.iconCircle}>
            <Icon name="lock" size={20} color="#fff" />
          </View>
          <View style={s.iconCircle}>
            <Icon name="bell" size={20} color="#fff" />
          </View>
        </View>
      </View>

      {/* ── White card ── */}
      <ScrollView
        style={s.cardScroll}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <Text style={s.cardTitle}>Commencez votre{"\n"}essai gratuit</Text>

          {/* Price with bold amount */}
          <Text style={s.cardPrice}>
            7 premiers jours gratuits, puis <Text style={s.cardPriceBold}>{priceAmount}</Text>
          </Text>

          {/* Annuel / Mensuel toggle */}
          <View style={s.toggle}>
            <TouchableOpacity
              style={[s.toggleBtn, isYearly && s.toggleBtnActive]}
              onPress={() => {
                hapticLight();
                setIsYearly(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={[s.toggleText, isYearly && s.toggleTextActive]}>Annuel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, !isYearly && s.toggleBtnActive]}
              onPress={() => {
                hapticLight();
                setIsYearly(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={[s.toggleText, !isYearly && s.toggleTextActive]}>Mensuel</Text>
            </TouchableOpacity>
          </View>

          {/* Timeline */}
          <View style={s.timeline}>
            <TimelineStep
              iconName="lock"
              title="Aujourd'hui"
              description="Débloquez toutes les fonctionnalités Premium, analyses illimitées et conseils personnalisés."
            />
            <TimelineStep
              iconName="bell"
              title="Dans 5 jours"
              description="On vous enverra un rappel que votre essai se termine bientôt."
            />
            <TimelineStep
              iconName="star"
              title="Dans 7 jours"
              description="Vous serez facturé, annulez quand vous voulez avant."
              isLast
            />
          </View>

          {/* No payment now — shield icon */}
          <View style={s.noPayRow}>
            <Icon name="shield" size={18} color="#111" />
            <Text style={s.noPayText}>AUCUN PAIEMENT DÛ MAINTENANT</Text>
          </View>

          {/* CTA — dark blue → pink gradient */}
          <TouchableOpacity style={s.ctaWrap} onPress={handleStart} activeOpacity={0.85}>
            <LinearGradient
              colors={["#3B1FA3", "#E91E8C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.ctaGradient}
            >
              <Text style={s.ctaText}>COMMENCER MON ESSAI GRATUIT</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: Platform.OS === "ios" ? 32 : 20 }} />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  headerWrap: {
    paddingTop: Platform.OS === "ios" ? 64 : 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  // Decorative blobs
  blob1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -40,
    right: -30,
  },
  blob2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: 10,
    left: -20,
  },

  headerTitle: {
    fontFamily: Fonts.extrabold,
    fontSize: 26,
    color: "#fff",
    marginTop: 4,
  },
  headerSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    marginTop: 8,
  },
  iconRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 24,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  cardScroll: { flex: 1, marginTop: 12 },
  scroll: { flexGrow: 1 },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    flex: 1,
    minHeight: "100%",
  },

  cardTitle: {
    fontFamily: Fonts.extrabold,
    fontSize: 24,
    color: "#111",
    textAlign: "center",
    lineHeight: 32,
  },
  cardPrice: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: "#333",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  cardPriceBold: {
    fontFamily: Fonts.bold,
    color: "#111",
  },

  toggle: {
    flexDirection: "row",
    borderRadius: 50,
    backgroundColor: "#F0F0F0",
    padding: 4,
    marginTop: 20,
    alignSelf: "center",
    width: "68%",
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 50,
    alignItems: "center",
  },
  toggleBtnActive: { backgroundColor: "#111" },
  toggleText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: "#888",
  },
  toggleTextActive: { color: "#fff" },

  timeline: { marginTop: 28 },

  noPayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  noPayText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: "#555",
    letterSpacing: 0.5,
  },

  ctaWrap: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#3B1FA3",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaGradient: {
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  ctaText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: "#fff",
    letterSpacing: 0.6,
  },
});
