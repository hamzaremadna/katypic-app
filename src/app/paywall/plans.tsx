import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { navigate } from "@/utils/navigation";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { Icon, IconName } from "../../components/ui/Icon";
import { Mascot } from "../../components/ui/Mascot";
import { hapticLight, hapticHeavy } from "../../utils/haptics";
import MaskedView from "@react-native-masked-view/masked-view";

// ─── Paywall gradient ────────────────────────────────────────────────────────
const PW_START = { x: 0.2, y: 0.1 };
const PW_END = { x: 0.8, y: 0.9 };

// ─── Plan data ───────────────────────────────────────────────────────────────

type PlanId = "free" | "premium" | "pro";

interface Plan {
  id: PlanId;
  name: string;
  icon: IconName;
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  features: string[];
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Gratuit",
    icon: "camera",
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    features: [
      "5 questions par jour",
      "Reconnaissance vocale de base",
      "Analyses photo limitées",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    icon: "sparkles",
    monthlyPrice: 9.99,
    yearlyMonthlyPrice: 8.33,
    highlighted: true,
    features: [
      "Questions illimitées",
      "Reconnaissance vocale avancée",
      "Analyses détaillées",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: "award",
    monthlyPrice: 24.99,
    yearlyMonthlyPrice: 20.83,
    features: [
      "Tout Premium inclus",
      "IA experte illimitée",
      "Coaching personnalisé 1-to-1",
    ],
  },
];

// ─── Gradient Text ───────────────────────────────────────────────────────────

function GradientText({ text, style }: { text: string; style: any }) {
  return (
    <MaskedView
      maskElement={
        <Text style={[style, { backgroundColor: "transparent" }]}>{text}</Text>
      }
    >
      <LinearGradient colors={Gradients.paywall} start={PW_START} end={PW_END}>
        <Text style={[style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

// ─── Plan Card ───────────────────────────────────────────────────────────────

/** Compact card for the free plan – no features list */
function FreePlanCard({ onSelect }: { onSelect: () => void }) {
  return (
    <View style={s.freeCard}>
      <View style={s.freeLeft}>
        <View style={s.planIconWrap}>
          <Icon name="camera" size={18} color={Colors.textSecondary} />
        </View>
        <View>
          <Text style={s.freeName}>Gratuit</Text>
          <Text style={s.freePrice}>0,00€/mois</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onSelect} activeOpacity={0.7}>
        <View style={s.freeBtnOutline}>
          <Text style={s.freeBtnText}>Continuer</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

/** Full plan card for Premium / Pro */
function PlanCard({
  plan,
  isYearly,
  onSelect,
}: {
  plan: Plan;
  isYearly: boolean;
  onSelect: () => void;
}) {
  const price = isYearly ? plan.yearlyMonthlyPrice : plan.monthlyPrice;
  const showSaving = isYearly && plan.monthlyPrice > 0;
  const h = plan.highlighted;

  return (
    <View style={[s.planCard, h && s.planCardHighlighted]}>
      {/* Gradient bg for premium */}
      {h && (
        <LinearGradient
          colors={Gradients.paywall}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
          start={PW_START}
          end={PW_END}
        />
      )}

      {/* Header row: icon + name */}
      <View style={s.planHeader}>
        <View style={[s.planIconWrap, h && s.planIconWrapHighlighted]}>
          <Icon
            name={plan.icon}
            size={20}
            color={h ? "#F6339A" : Colors.textSecondary}
          />
        </View>
        <View style={{ flex: 1 }} />
        <Text style={[s.planName, h && s.textWhite]}>{plan.name}</Text>
      </View>

      {/* Price */}
      <View style={s.priceRow}>
        <Text style={[s.priceAmount, h && s.textWhite]}>
          {price.toFixed(2).replace(".", ",")}€
        </Text>
        <Text style={[s.pricePeriod, h && s.textWhite70]}>/mois</Text>
      </View>

      {showSaving && (
        <Text style={[s.savingText, h && { color: "#FFD700" }]}>
          Économisez 17%
        </Text>
      )}

      {/* Features */}
      <View style={s.featuresList}>
        {plan.features.map((f) => (
          <View key={f} style={s.featureRow}>
            <Icon
              name="check"
              size={14}
              color={h ? "#fff" : Colors.accentGreen}
            />
            <Text style={[s.featureText, h && s.textWhite85]}>{f}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={s.planBtnWrap}
        onPress={onSelect}
        activeOpacity={0.85}
      >
        {h ? (
          /* Premium: white button with gradient text */
          <View style={s.planBtnWhite}>
            <GradientText
              text={`Choisir ${plan.name}`}
              style={s.planBtnTextGrad}
            />
          </View>
        ) : (
          /* Pro: dark outlined button */
          <View style={s.planBtnOutline}>
            <Text style={s.planBtnTextOutline}>Choisir {plan.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function PlansScreen() {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(true);

  const handleSelect = (planId: PlanId) => {
    if (planId === "free") {
      hapticLight();
      router.back();
      return;
    }
    hapticHeavy(); // high-intent plan selection
    if (planId === "premium") {
      navigate(
        `/paywall/upsell?plan=premium&billing=${
          isYearly ? "yearly" : "monthly"
        }`
      );
    } else {
      navigate(
        `/paywall/confirmation?plan=pro&billing=${
          isYearly ? "yearly" : "monthly"
        }`
      );
    }
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Close */}
        <TouchableOpacity
          style={s.closeBtn}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Icon name="x" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Mascot */}
        <View style={s.mascotWrap}>
          <Mascot size={80} />
        </View>

        {/* Title – gradient colored */}
        <View style={s.titleWrap}>
          <GradientText text="Choisissez votre plan" style={s.title} />
        </View>
        <Text style={s.subtitle}>Accédez aux fonctionnalités premium</Text>

        {/* Toggle with -17% badge */}
        <View style={s.toggleOuter}>
          <View style={s.toggleWrap}>
            <TouchableOpacity
              style={[s.toggleBtn, isYearly && s.toggleBtnActive]}
              onPress={() => { hapticLight(); setIsYearly(true); }}
            >
              {isYearly && (
                <LinearGradient
                  colors={Gradients.paywall}
                  style={StyleSheet.absoluteFillObject}
                  start={PW_START}
                  end={PW_END}
                />
              )}
              <Text style={[s.toggleText, isYearly && s.toggleTextActive]}>
                Annuel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, !isYearly && s.toggleBtnActive]}
              onPress={() => { hapticLight(); setIsYearly(false); }}
            >
              {!isYearly && (
                <LinearGradient
                  colors={Gradients.paywall}
                  style={StyleSheet.absoluteFillObject}
                  start={PW_START}
                  end={PW_END}
                />
              )}
              <Text style={[s.toggleText, !isYearly && s.toggleTextActive]}>
                Mensuel
              </Text>
            </TouchableOpacity>
          </View>
          {/* -17% badge floating above Annuel */}
          {isYearly && (
            <View style={s.discountBadge}>
              <Text style={s.discountText}>-17%</Text>
            </View>
          )}
        </View>

        {/* Free plan – compact row */}
        <FreePlanCard onSelect={() => handleSelect("free")} />

        {/* POPULAIRE badge + Premium card */}
        <View style={s.populaireBadge}>
          <Icon name="sparkles" size={12} color="#fff" />
          <Text style={s.populaireText}>POPULAIRE</Text>
        </View>
        <PlanCard
          plan={PLANS[1]}
          isYearly={isYearly}
          onSelect={() => handleSelect("premium")}
        />

        {/* Pro card */}
        <PlanCard
          plan={PLANS[2]}
          isYearly={isYearly}
          onSelect={() => handleSelect("pro")}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20 },
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
  mascotWrap: { alignItems: "center", marginTop: 5 },

  // Title (gradient)
  titleWrap: { alignItems: "center", marginTop: 12 },
  title: {
    fontFamily: Fonts.extrabold,
    fontSize: 24,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
  },

  // Toggle
  toggleOuter: {
    alignItems: "center",
    marginTop: 20,
    position: "relative",
  },
  toggleWrap: {
    flexDirection: "row",
    borderRadius: 14,
    backgroundColor: Colors.bgCard,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    width: "90%",
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 11,
    overflow: "hidden",
  },
  toggleBtnActive: {},
  toggleText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Colors.textMuted,
  },
  toggleTextActive: { color: "#fff" },

  // -17% badge
  discountBadge: {
    position: "absolute",
    top: -10,
    left: "40%",
    backgroundColor: "#F6339A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 5,
  },
  discountText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: "#fff",
  },

  // POPULAIRE standalone badge
  populaireBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    marginTop: 20,
    marginBottom: -8,
    backgroundColor: "rgba(152,16,250,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(152,16,250,0.5)",
    zIndex: 5,
  },
  populaireText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: "#fff",
    letterSpacing: 0.8,
  },

  // Free plan – compact row
  freeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  freeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  freeName: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  freePrice: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  freeBtnOutline: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: "rgba(255,255,255)",
  },
  freeBtnText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.textMuted,
  },

  // Plan card (Premium / Pro)
  planCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  planCardHighlighted: {
    borderWidth: 0,
  },

  // Plan header
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  planIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  planIconWrapHighlighted: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  planName: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textPrimary,
  },

  // Reusable text overrides for highlighted card
  textWhite: { color: "#fff" },
  textWhite70: { color: "rgba(255,255,255,0.7)" },
  textWhite85: { color: "rgba(255,255,255,0.85)" },

  // Price
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 14,
    gap: 2,
  },
  priceAmount: {
    fontFamily: Fonts.black,
    fontSize: 28,
    color: Colors.textPrimary,
  },
  pricePeriod: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textMuted,
  },
  savingText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Colors.accentGreen,
    marginTop: 4,
  },

  // Features
  featuresList: { marginTop: 16, gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Plan button
  planBtnWrap: {
    marginTop: 18,
    borderRadius: 14,
    overflow: "hidden",
  },
  planBtnWhite: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#fff",
  },
  planBtnTextGrad: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: "#F6339A",
  },
  planBtnOutline: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: "rgba(255,255,255)",
  },
  planBtnTextOutline: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.textMuted,
  },
});
