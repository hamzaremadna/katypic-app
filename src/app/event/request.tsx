import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { navigateReplace } from "@/utils/navigation";
import { Colors, Gradients } from "../../theme/colors";
import { Icon } from "../../components/ui/Icon";
import { useRequestJoin } from "@/hooks/useEvents";

const LEVEL_OPTIONS = [
  { id: "beginner", label: "Débutant" },
  { id: "intermediate", label: "Intermédiaire" },
  { id: "expert", label: "Expert" },
] as const;

type LevelId = (typeof LEVEL_OPTIONS)[number]["id"];

// ─── Form screen ─────────────────────────────────────────
function RequestForm({
  eventTitle,
  onSubmit,
  isSubmitting,
  onCancel,
}: {
  eventTitle: string;
  onSubmit: (message: string, portfolioUrl?: string) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}) {
  const [message, setMessage] = useState("");
  const [level, setLevel] = useState<LevelId>("beginner");
  const [portfolio, setPortfolio] = useState("");

  const canSubmit = message.trim().length > 0 && !isSubmitting;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onCancel} disabled={isSubmitting}>
          <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Demande de participation</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        {/* Event info card */}
        <View style={s.eventCard}>
          <LinearGradient
            colors={["rgba(93,36,167,0.2)", "rgba(30,20,60,0.6)"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={s.eventCardLeft}>
            <View style={s.eventIconBox}>
              <Icon name="calendar" size={20} color={Colors.accentPurple} />
            </View>
            <View style={s.eventCardText}>
              <Text style={s.eventCardLabel}>Présentez-vous à l'organisateur</Text>
              <Text style={s.eventCardTitle} numberOfLines={1}>{eventTitle}</Text>
            </View>
          </View>
        </View>

        {/* Message de motivation */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Message de motivation *</Text>
          <View style={s.textAreaWrapper}>
            <TextInput
              style={s.textArea}
              value={message}
              onChangeText={(t) => t.length <= 500 && setMessage(t)}
              placeholder="Parlez de votre passion pour la photographie, pourquoi cet événement vous intéresse..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
            <Text style={s.charCounter}>{message.length}/500</Text>
          </View>
        </View>

        {/* Niveau d'expérience */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Niveau d'expérience</Text>
          <View style={s.levelRow}>
            {LEVEL_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[s.levelPill, level === opt.id && s.levelPillActive]}
                onPress={() => setLevel(opt.id)}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                {level === opt.id && (
                  <LinearGradient
                    colors={Gradients.brand}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                )}
                <Text
                  style={[
                    s.levelPillText,
                    level === opt.id && s.levelPillTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Portfolio */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            Lien portfolio / Instagram{" "}
            <Text style={s.optionalLabel}>(facultatif)</Text>
          </Text>
          <View style={s.inputRow}>
            <Icon name="globe" size={16} color={Colors.textMuted} />
            <TextInput
              style={s.input}
              value={portfolio}
              onChangeText={setPortfolio}
              placeholder="https://instagram.com/votre_compte"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="url"
              editable={!isSubmitting}
            />
          </View>
        </View>

        {/* Info tip */}
        <View style={s.infoCard}>
          <LinearGradient
            colors={["rgba(93,36,167,0.12)", "rgba(20,20,40,0.8)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={s.infoCardRow}>
            <Icon name="eye" size={16} color={Colors.accentPurple} />
            <Text style={s.infoCardText}>
              Votre profil et vos photos seront partagés avec l'organisateur
              pour évaluer votre demande.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity
            style={s.cancelBtn}
            onPress={onCancel}
            disabled={isSubmitting}
          >
            <Text style={s.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.submitBtn, !canSubmit && s.submitBtnDisabled]}
            onPress={canSubmit ? () => onSubmit(message, portfolio || undefined) : undefined}
            activeOpacity={canSubmit ? 0.85 : 1}
          >
            <LinearGradient
              colors={canSubmit ? (["#E91E8C", "#7B2FBE"] as [string, string]) : (["#333", "#333"] as [string, string])}
              style={s.submitBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="send" size={16} color="#fff" />
              )}
              <Text style={s.submitBtnText}>
                {isSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Success screen ──────────────────────────────────────
function SuccessScreen({
  eventTitle,
  onGoHome,
  onGoEvents,
}: {
  eventTitle: string;
  onGoHome: () => void;
  onGoEvents: () => void;
}) {
  return (
    <View style={s.successContainer}>
      {/* Checkmark */}
      <View style={s.checkCircleWrapper}>
        <LinearGradient
          colors={["#7B2FBE", "#5F2097"] as [string, string]}
          style={s.checkCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name="check" size={40} color="#fff" />
        </LinearGradient>
        {/* Glow */}
        <View style={s.checkGlow} />
      </View>

      <Text style={s.successTitle}>Demande envoyée !</Text>
      <Text style={s.successSubtitle}>
        Votre demande a été transmise à l'organisateur. Il examinera votre profil
        et vos photos avant de vous répondre.
      </Text>

      {/* Info cards */}
      <View style={s.successCards}>
        <View style={s.successInfoCard}>
          <LinearGradient
            colors={["rgba(255,140,0,0.12)", "rgba(30,20,10,0.8)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <Icon name="clock" size={18} color="#FF8C00" />
          <View style={{ flex: 1 }}>
            <Text style={s.successInfoTitle}>En attente de réponse</Text>
            <Text style={s.successInfoSub}>
              L'organisateur vous répondra dans les 48h
            </Text>
          </View>
        </View>

        <View style={s.successInfoCard}>
          <LinearGradient
            colors={["rgba(93,36,167,0.15)", "rgba(20,10,40,0.8)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <Icon name="heart" size={18} color={Colors.accentPurple} />
          <View style={{ flex: 1 }}>
            <Text style={s.successInfoTitle}>Événement sauvegardé</Text>
            <Text style={s.successInfoSub}>
              Retrouvez-le dans Mes activités → En attente
            </Text>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View style={s.successActions}>
        <TouchableOpacity style={s.homeBtn} onPress={onGoHome} activeOpacity={0.85}>
          <Icon name="home" size={16} color={Colors.textPrimary} />
          <Text style={s.homeBtnText}>Retour à l'accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.eventsBtn} onPress={onGoEvents} activeOpacity={0.85}>
          <LinearGradient
            colors={Gradients.brand}
            style={s.eventsBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="calendar" size={16} color="#fff" />
            <Text style={s.eventsBtnText}>Voir mes événements</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main ────────────────────────────────────────────────
export default function EventRequestScreen() {
  const router = useRouter();
  const { eventId, title } = useLocalSearchParams<{
    eventId: string;
    title: string;
  }>();
  const [submitted, setSubmitted] = useState(false);
  const requestJoin = useRequestJoin();

  const eventTitle = title ?? "Événement";

  const handleSubmit = async (message: string, portfolioUrl?: string) => {
    if (!eventId) return;
    try {
      await requestJoin.mutateAsync({ eventId, message, portfolioUrl });
      setSubmitted(true);
    } catch {
      Alert.alert(
        "Erreur",
        "Impossible d'envoyer la demande. Veuillez réessayer."
      );
    }
  };

  if (submitted) {
    return (
      <View style={s.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={["#0E0A24", "#080814"]}
          style={StyleSheet.absoluteFillObject}
        />
        <SuccessScreen
          eventTitle={eventTitle}
          onGoHome={() => navigateReplace("/(tabs)/home")}
          onGoEvents={() => navigateReplace("/activites")}
        />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />
      <RequestForm
        eventTitle={eventTitle}
        onSubmit={handleSubmit}
        isSubmitting={requestJoin.isPending}
        onCancel={() => router.back()}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  // Event card
  eventCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(93,36,167,0.3)",
    overflow: "hidden",
  },
  eventCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eventIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(93,36,167,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(93,36,167,0.35)",
  },
  eventCardText: { flex: 1, gap: 3 },
  eventCardLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  // Section
  section: {
    marginTop: 22,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  optionalLabel: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.textMuted,
  },

  // Textarea
  textAreaWrapper: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    gap: 8,
  },
  textArea: {
    fontSize: 15,
    color: Colors.textPrimary,
    minHeight: 110,
    textAlignVertical: "top",
  },
  charCounter: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "right",
  },

  // Level pills
  levelRow: {
    flexDirection: "row",
    gap: 10,
  },
  levelPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  levelPillActive: {
    borderColor: "rgba(93,36,167,0.5)",
  },
  levelPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
    position: "relative",
  },
  levelPillTextActive: {
    color: "#fff",
  },

  // Input row
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },

  // Info card
  infoCard: {
    marginTop: 20,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(93,36,167,0.25)",
    overflow: "hidden",
  },
  infoCardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Actions
  actions: {
    marginTop: 24,
    gap: 12,
  },
  cancelBtn: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  submitBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },

  // ── Success screen ───────────────────────────────
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 0,
  },
  checkCircleWrapper: {
    marginBottom: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  checkGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(123,47,190,0.2)",
    zIndex: -1,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  successCards: {
    width: "100%",
    gap: 12,
    marginBottom: 36,
  },
  successInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  successInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  successInfoSub: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  successActions: {
    width: "100%",
    gap: 12,
  },
  homeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  homeBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  eventsBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  eventsBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  eventsBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
