import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { navigateReplace } from "@/utils/navigation";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { Icon, IconName } from "../../components/ui/Icon";
import { Mascot } from "../../components/ui/Mascot";

const PW_START = { x: 0.2, y: 0.1 };
const PW_END = { x: 0.8, y: 0.9 };

// ─── Plan details ────────────────────────────────────────────────────────────

const PLAN_CONFIG = {
  premium: {
    name: "Premium",
    icon: "sparkles" as IconName,
    monthlyPrice: 8.33,
    yearlyTotal: 99.99,
    monthlyOnly: 9.99,
    features: [
      "Questions illimitées",
      "Reconnaissance vocale avancée",
      "Analyses détaillées",
      "Conseils personnalisés",
      "Sans publicité",
      "Export haute qualité",
    ],
  },
  pro: {
    name: "Pro",
    icon: "award" as IconName,
    monthlyPrice: 20.83,
    yearlyTotal: 249.99,
    monthlyOnly: 24.99,
    features: [
      "Tout Premium inclus",
      "IA experte illimitée",
      "Coaching personnalisé 1-to-1",
      "Priorité support",
      "Sans publicité",
      "Export haute qualité",
    ],
  },
};

// ─── Gradient check circle for features ──────────────────────────────────────

function GradientCheck() {
  return (
    <LinearGradient
      colors={Gradients.paywall}
      start={PW_START}
      end={PW_END}
      style={cs.checkCircle}
    >
      <Icon name="check" size={12} color="#fff" />
    </LinearGradient>
  );
}

const cs = StyleSheet.create({
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ConfirmationScreen() {
  const router = useRouter();
  const { plan, billing } = useLocalSearchParams<{
    plan: string;
    billing: string;
  }>();
  const [isLoading, setIsLoading] = useState(false);

  const planKey = (plan === "pro" ? "pro" : "premium") as keyof typeof PLAN_CONFIG;
  const config = PLAN_CONFIG[planKey];
  const isYearly = billing === "yearly";

  const displayPrice = isYearly ? config.monthlyPrice : config.monthlyOnly;
  const totalToday = isYearly ? config.yearlyTotal : config.monthlyOnly;

  const handleConfirm = async () => {
    setIsLoading(true);
    // TODO: integrate with payment provider (RevenueCat / Stripe)
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        "Abonnement activé !",
        `Bienvenue dans le plan ${config.name} ! Profitez de toutes les fonctionnalités.`,
        [
          {
            text: "C'est parti !",
            onPress: () => navigateReplace("/(tabs)/home"),
          },
        ]
      );
    }, 1500);
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── Gradient header with mascot ── */}
        <View style={s.headerWrap}>
          <LinearGradient
            colors={Gradients.paywall}
            style={s.headerGradient}
            start={PW_START}
            end={PW_END}
          >
            {/* Close button overlapping top-left */}
            <TouchableOpacity
              style={s.closeBtn}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <Icon name="x" size={22} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>

            {/* Mascot in the gradient header */}
            <View style={s.mascotWrap}>
              <Mascot size={100} />
            </View>

            <Text style={s.headerTitle}>Abonnement {config.name}</Text>
            <Text style={s.headerSubtitle}>Confirmez votre souscription</Text>
          </LinearGradient>
        </View>

        {/* ── Recap card ── */}
        <View style={s.recapCard}>
          <Text style={s.recapTitle}>
            Récapitulatif de votre abonnement
          </Text>
          <Text style={s.recapDesc}>
            Vous avez sélectionné le plan{" "}
            <Text style={s.recapBold}>{config.name}</Text>
          </Text>

          {/* Plan badge – centered vertical layout */}
          <View style={s.planBadge}>
            <LinearGradient
              colors={Gradients.paywall}
              style={StyleSheet.absoluteFillObject}
              start={PW_START}
              end={PW_END}
            />
            {/* Top: icon + name */}
            <View style={s.planBadgeTop}>
              <Icon name={config.icon} size={18} color="#FFD700" />
              <Text style={s.planBadgeName}>{config.name}</Text>
            </View>
            {/* Center: big price */}
            <Text style={s.planBadgePrice}>
              {displayPrice.toFixed(2).replace(".", ",")}€
            </Text>
            <Text style={s.planBadgePeriod}>par mois</Text>

            {/* Saving strip */}
            {isYearly && (
              <View style={s.savingStrip}>
                <Text style={s.savingText}>
                  Facturé {totalToday.toFixed(2).replace(".", ",")}€ annuellement
                </Text>
                <Text style={s.savingTextBold}>Économisez 17%</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Features with gradient checkmarks ── */}
        <View style={s.featuresSection}>
          <Text style={s.featuresTitle}>Ce qui est inclus :</Text>
          <View style={s.featuresList}>
            {config.features.map((f) => (
              <View key={f} style={s.featureRow}>
                <GradientCheck />
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Security card with gradient icon ── */}
        <View style={s.securityCard}>
          <LinearGradient
            colors={Gradients.paywall}
            start={PW_START}
            end={PW_END}
            style={s.securityIconWrap}
          >
            <Icon name="check" size={16} color="#fff" />
          </LinearGradient>
          <View style={s.securityContent}>
            <Text style={s.securityTitle}>Paiement sécurisé</Text>
            <Text style={s.securityDesc}>
              Votre abonnement sera actif immédiatement après le paiement. Vous
              serez facturé {totalToday.toFixed(2).replace(".", ",")}€ aujourd'hui, puis chaque{" "}
              {isYearly ? "année" : "mois"}.
            </Text>
          </View>
        </View>

        {/* ── Total ── */}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>À payer aujourd'hui</Text>
          <Text style={s.totalAmount}>
            {totalToday.toFixed(2).replace(".", ",")}€
          </Text>
        </View>
        <Text style={s.renewalNote}>
          Renouvellement automatique • Annulable à tout moment
        </Text>

        {/* ── CTA ── */}
        <TouchableOpacity
          style={s.ctaWrap}
          onPress={handleConfirm}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={Gradients.paywall}
            style={s.ctaGradient}
            start={PW_START}
            end={PW_END}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.ctaText}>CONFIRMER L'ABONNEMENT</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Annuler</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20 },

  // ── Header with mascot ──
  headerWrap: {
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 48 : 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 52 : 36,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  mascotWrap: {
    marginTop: 24,
    marginBottom: 12,
  },
  headerTitle: {
    fontFamily: Fonts.extrabold,
    fontSize: 24,
    color: "#fff",
  },
  headerSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },

  // ── Recap card ──
  recapCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  recapTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.textPrimary,
  },
  recapDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  recapBold: {
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
  },

  // ── Plan badge (centered vertical) ──
  planBadge: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 4,
    alignItems: "center",
    paddingTop: 18,
  },
  planBadgeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  planBadgeName: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: "#fff",
  },
  planBadgePrice: {
    fontFamily: Fonts.black,
    fontSize: 40,
    color: "#fff",
    marginTop: 4,
  },
  planBadgePeriod: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: -2,
  },
  savingStrip: {
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    width: "100%",
    marginTop: 14,
  },
  savingText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  savingTextBold: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },

  // ── Features with gradient checkmarks ──
  featuresSection: {
    marginHorizontal: 20,
    marginTop: 24,
    gap: 14,
  },
  featuresTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  featuresList: { gap: 14 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },

  // ── Security card ──
  securityCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: "rgba(43,127,255,0.08)",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(43,127,255,0.15)",
  },
  securityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  securityContent: { flex: 1, gap: 4 },
  securityTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  securityDesc: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },

  // ── Total ──
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  totalLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  totalAmount: {
    fontFamily: Fonts.black,
    fontSize: 26,
    color: Colors.textPrimary,
  },
  renewalNote: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 8,
  },

  // ── CTA ──
  ctaWrap: {
    marginHorizontal: 20,
    marginTop: 24,
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
    fontSize: 15,
    color: "#fff",
    letterSpacing: 0.5,
  },

  // Cancel
  cancelBtn: {
    alignSelf: "center",
    marginTop: 14,
    paddingVertical: 8,
  },
  cancelText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textMuted,
  },
});
