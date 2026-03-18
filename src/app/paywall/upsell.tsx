import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { navigate } from "@/utils/navigation";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { Icon, IconName } from "../../components/ui/Icon";
import { Mascot } from "../../components/ui/Mascot";
import { hapticLight, hapticHeavy } from "../../utils/haptics";

const PW_START = { x: 0.2, y: 0.1 };
const PW_END = { x: 0.8, y: 0.9 };

// ─── Upsell features ────────────────────────────────────────────────────────

interface UpsellFeature {
  icon: IconName;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}

const FEATURES: UpsellFeature[] = [
  {
    icon: "zap",
    iconBg: "rgba(152,16,250,0.25)",
    iconColor: "#C77DFF",
    title: "Accès instantané",
    description: "Débloquez toutes les fonctionnalités immédiatement",
  },
  {
    icon: "star",
    iconBg: "rgba(43,127,255,0.25)",
    iconColor: "#5BA3FF",
    title: "Meilleur rapport qualité-prix",
    description: "Économisez plus avec le plan Pro",
  },
  {
    icon: "sparkles",
    iconBg: "rgba(246,51,154,0.25)",
    iconColor: "#FF6BB3",
    title: "Offre limitée",
    description: "Cette promotion expire dans 24 heures",
  },
];

// ─── Feature Row ─────────────────────────────────────────────────────────────

function FeatureRow({ feature }: { feature: UpsellFeature }) {
  return (
    <View style={s.featureRow}>
      <View style={[s.featureIcon, { backgroundColor: feature.iconBg }]}>
        <Icon name={feature.icon} size={18} color={feature.iconColor} />
      </View>
      <View style={s.featureContent}>
        <Text style={s.featureTitle}>{feature.title}</Text>
        <Text style={s.featureDesc}>{feature.description}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function UpsellScreen() {
  const router = useRouter();
  const { billing } = useLocalSearchParams<{ plan: string; billing: string }>();

  const handleUpgrade = () => {
    hapticHeavy(); // strongest CTA in the app
    navigate(
      `/paywall/confirmation?plan=pro&billing=${billing ?? "yearly"}`
    );
  };

  const handleSkip = () => {
    hapticLight();
    navigate(
      `/paywall/confirmation?plan=premium&billing=${billing ?? "yearly"}`
    );
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Top area (close + mascot + title) ── */}
      <TouchableOpacity
        style={s.closeBtn}
        onPress={() => router.back()}
        hitSlop={12}
      >
        <Icon name="x" size={22} color={Colors.textSecondary} />
      </TouchableOpacity>

      <View style={s.mascotWrap}>
        <Mascot size={100} />
      </View>

      <Text style={s.title}>Offre exclusive !</Text>
      <Text style={s.subtitle}>Passez au plan Pro maintenant</Text>

      {/* ── Big unified card (flex: 1, centered) ── */}
      <View style={s.bigCard}>
        {/* Price comparison */}
        <View style={s.priceSection}>
          <View style={s.priceCompare}>
            <Text style={s.priceOld}>24,99€</Text>
            <Text style={s.priceArrow}>→</Text>
            <Text style={s.priceDiff}>+12,50€</Text>
          </View>
          <Text style={s.priceNote}>
            Seulement 12,50€ de plus par mois
          </Text>
        </View>

        {/* Features inside the card */}
        <View style={s.featuresSection}>
          {FEATURES.map((f) => (
            <FeatureRow key={f.title} feature={f} />
          ))}
        </View>

        {/* Limited badge inside the card */}
        <View style={s.limitedBadge}>
          <View style={s.redDot} />
          <Text style={s.limitedText}>Offre valable 24h seulement</Text>
        </View>
      </View>

      {/* ── Bottom: CTA + skip pinned ── */}
      <View style={s.bottomArea}>
        <TouchableOpacity
          style={s.ctaWrap}
          onPress={handleUpgrade}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={Gradients.paywall}
            style={s.ctaGradient}
            start={PW_START}
            end={PW_END}
          >
            <Text style={s.ctaText}>Oui, passer au Pro !</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={s.skipBtn} onPress={handleSkip}>
          <Text style={s.skipText}>Non merci, continuer avec Premium</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  closeBtn: {
    marginTop: Platform.OS === "ios" ? 56 : 36,
    marginLeft: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignSelf: "flex-start",
  },

  // Mascot
  mascotWrap: { alignItems: "center", marginTop: 8 },

  // Title
  title: {
    fontFamily: Fonts.extrabold,
    fontSize: 26,
    color: Colors.accentGreen,
    textAlign: "center",
    marginTop: 10,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },

  // ── Big unified card ──
  bigCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  // Price section (top of card)
  priceSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    alignItems: "center",
    gap: 8,
  },
  priceCompare: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceOld: {
    fontFamily: Fonts.semibold,
    fontSize: 18,
    color: "#F6339A",
    textDecorationLine: "line-through",
  },
  priceArrow: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.textMuted,
  },
  priceDiff: {
    fontFamily: Fonts.black,
    fontSize: 26,
    color: Colors.accentGreen,
  },
  priceNote: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Features inside card
  featuresSection: {
    paddingHorizontal: 12,
    gap: 6,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureContent: { flex: 1, gap: 2 },
  featureTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  featureDesc: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Limited badge (inside card, at bottom)
  limitedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 8,
    marginTop: 16,
    marginBottom: 18,
    backgroundColor: "rgba(246,51,154,0.08)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(246,51,154,0.2)",
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F6339A",
  },
  limitedText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: "#F6339A",
  },

  // Bottom pinned area
  bottomArea: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },

  // CTA
  ctaWrap: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#F6339A",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  ctaText: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: "#fff",
  },

  // Skip
  skipBtn: {
    alignSelf: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textMuted,
  },
});
