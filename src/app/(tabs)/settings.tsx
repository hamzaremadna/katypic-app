import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { navigate } from "@/utils/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { BottomTabBar } from "../../components/ui";
import { Icon, type IconName } from "../../components/ui/Icon";
import { useAuthStore } from "../../stores/authStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { profileApi } from "../../services/api/profile.api";
import { authApi } from "../../services/api/auth.api";

// ─── Constants ────────────────────────────────────────────
const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

// ─── Row component ────────────────────────────────────────
function SettingRow({
  icon,
  iconBg = "#5B2D9E",
  title,
  subtitle,
  onPress,
  right,
}: {
  icon: IconName;
  iconBg?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  return (
    <TouchableOpacity
      style={s.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && right === undefined}
    >
      <View style={[s.rowIconWrap, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={18} color="#fff" />
      </View>

      <View style={s.rowText}>
        <Text style={s.rowTitle}>{title}</Text>
        {subtitle ? <Text style={s.rowSub}>{subtitle}</Text> : null}
      </View>

      {right !== undefined ? (
        right
      ) : onPress ? (
        <Icon name="chevron-right" size={16} color={Colors.textMuted} />
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Section label ────────────────────────────────────────
function SectionLabel({ title }: { title: string }) {
  return <Text style={s.sectionLabel}>{title}</Text>;
}

// ─── Main screen ──────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // ── Persisted notification/sound preferences ──
  const notifEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const setNotifEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);

  // ── Profile for privacy toggle + location ──
  const { data: profile } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileApi.getMyProfile().then((r) => r.data),
  });

  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (profile) setIsPublic(profile.isPublic ?? true);
  }, [profile]);

  const toggleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTogglePublic = useCallback(
    (val: boolean) => {
      setIsPublic(val);
      if (toggleTimer.current) clearTimeout(toggleTimer.current);
      toggleTimer.current = setTimeout(() => {
        profileApi.updateProfile({ isPublic: val }).then(() => {
          queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
        });
      }, 500);
    },
    [queryClient],
  );

  const locationDisplay = useMemo(
    () =>
      profile?.city && profile?.country
        ? `${profile.city}, ${profile.country}`
        : profile?.city || profile?.country || "Non renseignée",
    [profile?.city, profile?.country],
  );

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Se déconnecter",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  }, [logout, router]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irréversible. Toutes vos données, photos et analyses seront supprimées définitivement.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await authApi.deleteAccount();
              await logout();
              router.replace("/(auth)/login");
            } catch {
              Alert.alert("Erreur", "Impossible de supprimer le compte. Réessayez plus tard.");
            }
          },
        },
      ]
    );
  }, [logout, router]);

  const handleRateApp = useCallback(async () => {
    try {
      const StoreReview = await import("expo-store-review");
      if (await StoreReview.isAvailableAsync()) {
        await StoreReview.requestReview();
      } else {
        // Fallback to store URL
        const url = Platform.OS === "ios"
          ? "https://apps.apple.com/app/kaytipic/id0000000000"
          : "https://play.google.com/store/apps/details?id=com.kaytipic.app";
        Linking.openURL(url);
      }
    } catch {
      Alert.alert("Erreur", "Impossible d'ouvrir le store.");
    }
  }, []);

  const handlePasswordReset = useCallback(() => {
    Alert.alert(
      "Mot de passe",
      "Pour modifier votre mot de passe, un email de réinitialisation vous sera envoyé.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Envoyer l'email",
          onPress: async () => {
            try {
              await profileApi.requestPasswordReset(authUser?.email ?? "");
              Alert.alert(
                "Email envoyé",
                "Si un compte existe avec cette adresse, vous recevrez un email de réinitialisation.",
              );
            } catch {
              Alert.alert(
                "Erreur",
                "Impossible d'envoyer l'email. Réessayez plus tard.",
              );
            }
          },
        },
      ],
    );
  }, [authUser?.email]);

  const handlePersonalData = useCallback(() => {
    Alert.alert(
      "Données personnelles",
      "Vos données sont stockées de façon sécurisée. Pour une demande de suppression ou d'export, contactez-nous à privacy@kaytipic.com.",
      [
        { text: "Fermer", style: "cancel" },
        {
          text: "Nous contacter",
          onPress: () => Linking.openURL("mailto:privacy@kaytipic.com"),
        },
      ],
    );
  }, []);

  const handleOpenCGU = useCallback(() => {
    Linking.openURL("https://kaytipic.com/cgu").catch(() =>
      Alert.alert("Erreur", "Impossible d'ouvrir les conditions d'utilisation.")
    );
  }, []);

  const handleOpenPrivacy = useCallback(() => {
    Linking.openURL("https://kaytipic.com/privacy").catch(() =>
      Alert.alert("Erreur", "Impossible d'ouvrir la politique de confidentialité.")
    );
  }, []);

  const handleOpenHelp = useCallback(() => {
    Linking.openURL("https://kaytipic.com/aide").catch(() =>
      Alert.alert("Erreur", "Impossible d'ouvrir le centre d'aide.")
    );
  }, []);

  const handleContact = useCallback(() => {
    Linking.openURL(
      "mailto:support@kaytipic.com?subject=Support%20KaytiPic"
    ).catch(() =>
      Alert.alert("Erreur", "Impossible d'ouvrir votre application mail.")
    );
  }, []);

  const handleGoToEditProfile = useCallback(() => {
    navigate("/edit-profile");
  }, []);

  const handleGoToPaywall = useCallback(() => {
    navigate("/paywall/intro");
  }, []);

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={s.header}>
        <LinearGradient
          colors={["#3D1880", "#1E3A8A"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Paramètres</Text>
        <View style={s.headerRight}>
          <Icon name="settings" size={20} color="#fff" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── COMPTE ── */}
        <SectionLabel title="COMPTE" />
        <View style={s.card}>
          <SettingRow
            icon="user"
            iconBg="#5B2D9E"
            title="Modifier le profil"
            subtitle="Photo, nom, bio, spécialités"
            onPress={handleGoToEditProfile}
          />
          <View style={s.divider} />
          <SettingRow
            icon="mail"
            iconBg="#3D1880"
            title="Email"
            subtitle={authUser?.email ?? "—"}
          />
          <View style={s.divider} />
          <SettingRow
            icon="lock"
            iconBg="#1E3A8A"
            title="Mot de passe"
            subtitle="Modifier votre mot de passe"
            onPress={handlePasswordReset}
          />
          <View style={s.divider} />
          <SettingRow
            icon="marker-pin"
            iconBg="#5B2D9E"
            title="Localisation"
            subtitle={locationDisplay}
            onPress={handleGoToEditProfile}
          />
        </View>

        {/* ── ABONNEMENT ── */}
        <SectionLabel title="ABONNEMENT" />
        <TouchableOpacity
          style={s.premiumCard}
          onPress={handleGoToPaywall}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={Gradients.paywall}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.8, y: 0.9 }}
          />
          <View style={s.premiumLeft}>
            <Icon name="sparkles" size={20} color="#FFD700" />
            <View style={s.premiumText}>
              <Text style={s.premiumTitle}>Passer à Premium</Text>
              <Text style={s.premiumSub}>
                Débloquez toutes les fonctionnalités
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* ── NOTIFICATIONS ── */}
        <SectionLabel title="NOTIFICATIONS" />
        <View style={s.card}>
          <SettingRow
            icon="bell"
            iconBg="#7B2FBE"
            title="Notifications push"
            subtitle="Événements, rappels et nouveautés"
            right={
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: "#333", true: Colors.accentPurple }}
                thumbColor="#fff"
              />
            }
          />
          <View style={s.divider} />
          <SettingRow
            icon="sliders"
            iconBg="#5B2D9E"
            title="Sons"
            subtitle="Sons de l'application"
            right={
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: "#333", true: Colors.accentPurple }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* ── CONFIDENTIALITÉ ── */}
        <SectionLabel title="CONFIDENTIALITÉ" />
        <View style={s.card}>
          <SettingRow
            icon="globe"
            iconBg="#1E3A8A"
            title="Profil public"
            subtitle={
              isPublic
                ? "Tout le monde peut voir votre profil"
                : "Seuls vos amis peuvent voir votre profil"
            }
            right={
              <Switch
                value={isPublic}
                onValueChange={handleTogglePublic}
                trackColor={{ false: "#333", true: Colors.accentPurple }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* ── LÉGAL ── */}
        <SectionLabel title="LÉGAL" />
        <View style={s.card}>
          <SettingRow
            icon="eye"
            iconBg="#1E3A8A"
            title="Données personnelles"
            subtitle="Gérer vos données"
            onPress={handlePersonalData}
          />
          <View style={s.divider} />
          <SettingRow
            icon="flag"
            iconBg="#3D1880"
            title="Conditions d'utilisation"
            onPress={handleOpenCGU}
          />
          <View style={s.divider} />
          <SettingRow
            icon="lock"
            iconBg="#5B2D9E"
            title="Politique de confidentialité"
            onPress={handleOpenPrivacy}
          />
        </View>

        {/* ── SUPPORT ── */}
        <SectionLabel title="SUPPORT" />
        <View style={s.card}>
          <SettingRow
            icon="lightbulb"
            iconBg="#5B2D9E"
            title="Centre d'aide"
            subtitle="FAQ et tutoriels"
            onPress={handleOpenHelp}
          />
          <View style={s.divider} />
          <SettingRow
            icon="message-chat"
            iconBg="#7B2FBE"
            title="Nous contacter"
            subtitle="Envoyer un message"
            onPress={handleContact}
          />
          <View style={s.divider} />
          <SettingRow
            icon="star"
            iconBg="#1E3A8A"
            title="Évaluer l'application"
            subtitle="Donnez-nous 5 étoiles ⭐"
            onPress={handleRateApp}
          />
        </View>

        {/* ── ZONE DE DANGER ── */}
        <SectionLabel title="ZONE DE DANGER" />
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Icon name="log-out" size={16} color="#FF6B6B" />
          <Text style={s.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteAccount}>
          <Icon name="trash" size={16} color="#FF3B30" />
          <Text style={s.deleteText}>Supprimer mon compte</Text>
        </TouchableOpacity>

        {/* ── App version ── */}
        <Text style={s.versionText}>KaytiPic v{APP_VERSION}</Text>

        <View style={s.bottomSpacer} />
      </ScrollView>

      <BottomTabBar activeRoute="/(tabs)/settings" />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: 16,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: "#fff",
  },
  headerRight: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },

  scroll: { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 20 },

  // Section label
  sectionLabel: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 20,
    paddingLeft: 4,
  },

  // Card
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  rowSub: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Divider inside card
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 16,
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,107,107,0.08)",
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.25)",
  },
  logoutText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: "#FF6B6B",
  },

  // Delete account
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,59,48,0.08)",
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.2)",
    marginTop: 10,
  },
  deleteText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: "#FF3B30",
  },

  // Premium card
  premiumCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    overflow: "hidden",
    shadowColor: "#F6339A",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  premiumLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  premiumText: { flex: 1, gap: 2 },
  premiumTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: "#fff",
  },
  premiumSub: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },

  // Version
  versionText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 24,
    opacity: 0.6,
  },
  bottomSpacer: { height: 110 },
});
