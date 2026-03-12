import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { Icon, IconName } from "./Icon";

const { width } = Dimensions.get("window");

const PW_START = { x: 0.2, y: 0.1 };
const PW_END = { x: 0.8, y: 0.9 };

// ─── Feature items ───────────────────────────────────────────────────────────

interface Feature {
  icon: IconName;
  iconBg: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: "sparkles",
    iconBg: "#9810FA",
    title: "Questions illimitées",
    description: "Posez autant de questions que vous voulez",
  },
  {
    icon: "camera",
    iconBg: "#F6339A",
    title: "Analyses détaillées",
    description: "IA avancée pour vos photos",
  },
  {
    icon: "zap",
    iconBg: "#2B7FFF",
    title: "Sans publicité",
    description: "Expérience premium sans interruption",
  },
];

// ─── Feature Row ─────────────────────────────────────────────────────────────

function FeatureItem({ feature }: { feature: Feature }) {
  return (
    <View style={s.featureRow}>
      <View style={[s.featureIcon, { backgroundColor: feature.iconBg }]}>
        <Icon name={feature.icon} size={16} color="#fff" />
      </View>
      <View style={s.featureContent}>
        <Text style={s.featureTitle}>{feature.title}</Text>
        <Text style={s.featureDesc}>{feature.description}</Text>
      </View>
    </View>
  );
}

// ─── UpgradePopup ────────────────────────────────────────────────────────────

interface UpgradePopupProps {
  visible: boolean;
  onDismiss: () => void;
  onUpgrade: () => void;
}

export function UpgradePopup({ visible, onDismiss, onUpgrade }: UpgradePopupProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={s.overlay}>
        <TouchableOpacity
          style={s.overlayTouch}
          activeOpacity={1}
          onPress={onDismiss}
        />

        {/* Popup card */}
        <View style={s.card}>
          {/* Gradient header */}
          <View style={s.headerWrap}>
            <LinearGradient
              colors={Gradients.paywall}
              style={StyleSheet.absoluteFillObject}
              start={PW_START}
              end={PW_END}
            />
            {/* Crown icon */}
            <View style={s.crownWrap}>
              <Icon name="award" size={32} color="#FFD700" />
            </View>
            <Text style={s.headerTitle}>Passez au niveau supérieur !</Text>
            <Text style={s.headerSub}>
              Vous êtes sur le plan <Text style={s.headerBold}>Gratuit</Text>
            </Text>
          </View>

          {/* Body */}
          <View style={s.body}>
            <Text style={s.bodyIntro}>
              Découvrez tout ce que vous pouvez débloquer avec Premium
            </Text>

            {/* Feature list */}
            <View style={s.featuresList}>
              {FEATURES.map((f) => (
                <FeatureItem key={f.title} feature={f} />
              ))}
            </View>

            {/* Price */}
            <View style={s.priceRow}>
              <Text style={s.priceLabel}>À partir de</Text>
              <Text style={s.priceAmount}>9,99€</Text>
              <Text style={s.pricePeriod}>/mois</Text>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={s.ctaWrap}
              onPress={onUpgrade}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={Gradients.paywall}
                style={s.ctaGrad}
                start={PW_START}
                end={PW_END}
              >
                <Text style={s.ctaText}>Découvrir les offres</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Dismiss */}
            <TouchableOpacity style={s.dismissBtn} onPress={onDismiss}>
              <Text style={s.dismissText}>Peut-être plus tard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  overlayTouch: {
    flex: 1,
  },

  // Card
  card: {
    backgroundColor: Colors.bgDeep,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    maxHeight: "85%",
  },

  // Gradient header
  headerWrap: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    gap: 8,
    overflow: "hidden",
  },
  crownWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: Fonts.extrabold,
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
  },
  headerSub: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  headerBold: {
    fontFamily: Fonts.bold,
    color: "#fff",
  },

  // Body
  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  bodyIntro: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },

  // Features
  featuresList: { gap: 12 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  featureIcon: {
    width: 36,
    height: 36,
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

  // Price
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginTop: 24,
    gap: 4,
  },
  priceLabel: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textMuted,
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

  // CTA
  ctaWrap: {
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#F6339A",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaGrad: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  ctaText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: "#fff",
  },

  // Dismiss
  dismissBtn: {
    alignSelf: "center",
    marginTop: 14,
    paddingVertical: 8,
  },
  dismissText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textMuted,
  },
});
