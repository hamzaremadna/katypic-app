import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { navigate } from "@/utils/navigation";
import { Colors } from "../../../theme/colors";
import { Fonts } from "../../../theme/typography";
import { Icon, IconName } from "../../../components/ui/Icon";
import { useSyncQuestProgress, useCompleteQuest } from "../../../hooks/useQuestPaths";
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from "../../../utils/haptics";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 52) / 2;

// ─── Main Screen ──────────────────────────────────────────
export default function ChallengeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    challengeId: string;
    title: string;
    category: string;
    subtitle: string;
    xp: string;
    color: string;
    icon: string;
    requiredPhotos: string;
    photosTaken: string;
    tips: string;
  }>();

  const challengeId    = params.challengeId ?? "";
  const title          = params.title ?? "Défi";
  const category       = params.category ?? "PHOTO";
  const subtitle       = params.subtitle ?? "Complète ce défi";
  const xp             = params.xp ?? "30";
  const color          = params.color ?? "#E91E8C";
  const iconName       = (params.icon ?? "camera") as IconName;
  const requiredPhotos = Number(params.requiredPhotos ?? "1");

  // Parse tips array from JSON param
  let parsedTips: string[] = [];
  try {
    parsedTips = JSON.parse(params.tips ?? "[]");
  } catch {
    parsedTips = [];
  }

  // Local state: initialized from params, refreshed on every focus
  const [photosTaken, setPhotosTaken] = useState(
    Number(params.photosTaken ?? "0")
  );
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const syncMutation     = useSyncQuestProgress();
  const completeMutation = useCompleteQuest();

  // ── Sync on every screen focus (return from camera) ──────
  useFocusEffect(
    useCallback(() => {
      if (!challengeId) return;
      syncMutation.mutate(challengeId, {
        onSuccess: (data) => {
          setPhotosTaken(data.photosTaken);
          setPhotoUrls(data.photoUrls ?? []);
        },
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [challengeId])
  );

  const percent      = requiredPhotos > 0 ? Math.round((photosTaken / requiredPhotos) * 100) : 0;
  const canValidate  = photosTaken >= requiredPhotos && !completeMutation.isPending;

  const tipText =
    parsedTips.length > 0
      ? parsedTips.map((t) => `• ${t}`).join("\n")
      : "Prenez votre temps, expérimentez différentes approches et n'hésitez pas à sortir de votre zone de confort !";

  const handleAddPhoto = () => {
    hapticLight();
    navigate("/(tabs)/camera");
  };

  const handleValidate = () => {
    if (!canValidate) return;
    hapticMedium();
    completeMutation.mutate(challengeId, {
      onSuccess: (data) => {
        if (data.alreadyCompleted) {
          router.back();
        } else {
          hapticSuccess(); // triple beat — quest complete!
          Alert.alert(
            "🏆 Défi complété !",
            `Félicitations ! Vous gagnez +${data.xpEarned} XP`,
            [{ text: "Super !", onPress: () => router.back() }]
          );
        }
      },
      onError: () => {
        hapticError();
        Alert.alert("Erreur", "Impossible de valider le défi pour l'instant.");
      },
    });
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* Background gradient */}
      <LinearGradient
        colors={[`${color}25`, `${color}08`, "#080814"]}
        style={s.bgGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Back button */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Hero section */}
        <View style={s.heroSection}>
          <View style={[s.enCoursBadge, { backgroundColor: color }]}>
            <Text style={s.enCoursText}>EN COURS</Text>
          </View>
          <View style={[s.heroIconCircle, { backgroundColor: `${color}20` }]}>
            <Icon name={iconName} size={36} color={color} />
          </View>
          <Text style={[s.heroCategory, { color }]}>{category}</Text>
          <Text style={s.heroTitle}>{title}</Text>
          <Text style={s.heroSubtitle}>{subtitle}</Text>
        </View>

        {/* Progress card */}
        <View style={s.progressCard}>
          <View style={s.progressHeader}>
            <Text style={s.progressLabel}>Progression</Text>
            <Text style={[s.progressCount, { color }]}>
              {photosTaken}/{requiredPhotos}
            </Text>
          </View>
          <View style={s.progressBarTrack}>
            <View
              style={[
                s.progressBarFill,
                { width: `${Math.min(percent, 100)}%`, backgroundColor: color },
              ]}
            />
          </View>
        </View>

        {/* Conseils card */}
        <View style={[s.tipCard, { borderColor: `${color}30` }]}>
          <LinearGradient
            colors={[`${color}10`, "rgba(26,26,46,0.8)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={s.tipHeader}>
            <Icon name="message-circle" size={16} color={color} />
            <Text style={[s.tipTitle, { color }]}>Conseils</Text>
          </View>
          <Text style={s.tipText}>{tipText}</Text>
        </View>

        {/* Photos section */}
        <View style={s.photosSection}>
          <Text style={s.photosSectionTitle}>Vos photos</Text>
          <View style={s.photosGrid}>
            {/* Filled slots (photos already taken) */}
            {Array.from({ length: photosTaken }).map((_, i) => (
              <View
                key={`filled-${i}`}
                style={[s.photoSlot, { borderColor: `${color}60` }]}
              >
                {photoUrls[i] ? (
                  <Image
                    source={{ uri: photoUrls[i] }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={[`${color}20`, `${color}08`]}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <View style={s.photoCheck}>
                  <Icon name="check" size={14} color="#fff" />
                </View>
              </View>
            ))}

            {/* Empty slots (tap to open camera) */}
            {Array.from({ length: Math.max(0, requiredPhotos - photosTaken) }).map(
              (_, i) => (
                <TouchableOpacity
                  key={`empty-${i}`}
                  style={[s.photoSlot, s.photoSlotEmpty, { borderColor: `${color}40` }]}
                  activeOpacity={0.7}
                  onPress={handleAddPhoto}
                >
                  <Icon name="camera" size={28} color={color} />
                  <Text style={[s.addText, { color }]}>Ajouter</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={s.actions}>
          <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
            <Text style={[s.cancelBtnText, { color }]}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.validateBtn, !canValidate && s.validateBtnDisabled]}
            onPress={handleValidate}
            activeOpacity={canValidate ? 0.85 : 1}
          >
            <LinearGradient
              colors={
                canValidate
                  ? ([color, "#1A1A2E"] as [string, string])
                  : (["#333", "#333"] as [string, string])
              }
              style={s.validateBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={s.validateBtnText}>
                {completeMutation.isPending
                  ? "Validation…"
                  : `Valider (${photosTaken}/${requiredPhotos})`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  bgGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 400 },
  scroll: { paddingBottom: 20 },

  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },

  // Hero
  heroSection: { alignItems: "center", paddingHorizontal: 20, gap: 8, marginTop: 8 },
  enCoursBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  enCoursText: { fontSize: 10, fontFamily: Fonts.bold, color: "#fff", letterSpacing: 0.8 },
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  heroCategory: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    letterSpacing: 1.5,
    marginTop: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: Fonts.extrabold,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  // Progress
  progressCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: { fontSize: 15, fontFamily: Fonts.bold, color: Colors.textPrimary },
  progressCount: { fontSize: 16, fontFamily: Fonts.bold },
  progressBarTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 4 },

  // Tips
  tipCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  tipTitle: { fontSize: 14, fontFamily: Fonts.bold },
  tipText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Photos
  photosSection: { paddingHorizontal: 20, marginTop: 24, gap: 14 },
  photosSectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
  },
  photosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  photoSlot: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    backgroundColor: Colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  photoSlotEmpty: {
    borderStyle: "dashed",
    gap: 8,
  },
  addText: { fontSize: 13, fontFamily: Fonts.semibold },
  photoCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accentGreen,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  // Actions
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 28,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontFamily: Fonts.bold },
  validateBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  validateBtnDisabled: { opacity: 0.4 },
  validateBtnGrad: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  validateBtnText: { fontSize: 15, fontFamily: Fonts.bold, color: "#fff" },
});
