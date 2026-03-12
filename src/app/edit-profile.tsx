import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { navigate } from "@/utils/navigation";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { uploadAsync } from "expo-file-system";
import type { FileSystemUploadOptions } from "expo-file-system/build/legacy/FileSystem.types";
import * as Location from "expo-location";
import { Colors, Gradients } from "../theme/colors";
import { Icon, type IconName } from "../components/ui/Icon";
import { profileApi } from "../services/api/profile.api";
import { useAuthStore } from "../stores/authStore";

// ─── Helpers ──────────────────────────────────────────────
const LEVEL_OPTIONS = [
  { id: "beginner", label: "Débutant" },
  { id: "intermediate", label: "Intermédiaire" },
  { id: "expert", label: "Expert" },
] as const;

type LevelId = (typeof LEVEL_OPTIONS)[number]["id"];

function normalizeLevel(raw: string | undefined): LevelId {
  if (!raw) return "beginner";
  if (raw === "advanced") return "expert";
  if (raw === "basics" || raw === "amateur") return "intermediate";
  if (raw === "beginner" || raw === "intermediate" || raw === "expert")
    return raw as LevelId;
  return "beginner";
}

const SPECIALTY_SUGGESTIONS = [
  "Portrait",
  "Paysage",
  "Animalier",
  "Mode",
  "Sport",
  "Architecture",
  "Macro",
  "Nuit",
];

// ─── Section header ───────────────────────────────────────
function SectionHeader({ icon, title }: { icon: IconName; title: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionIconWrap}>
        <Icon name={icon} size={16} color={Colors.accentPurple} />
      </View>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────
export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // ── Remote data ────────────────────────────────────────
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileApi.getMyProfile().then((r) => r.data),
  });

  const { data: creative } = useQuery({
    queryKey: ["creative-profile"],
    queryFn: () => profileApi.getCreativeProfile().then((r) => r.data),
  });

  // ── Local state ────────────────────────────────────────
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [level, setLevel] = useState<LevelId>("beginner");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [editingLocation, setEditingLocation] = useState(false);

  // Populate from API
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? authUser?.username ?? "");
      setBio(profile.bio ?? "");
      setIsPublic(profile.isPublic ?? true);
      setCity(profile.city ?? "");
      setCountry(profile.country ?? "");
      if (profile.avatarUrl) setAvatarUri(profile.avatarUrl);
    }
  }, [profile]);

  useEffect(() => {
    if (creative) {
      setLevel(normalizeLevel(creative.artistPreferences?.[0]));
      setSpecialties(creative.visualPreferences ?? []);
    }
  }, [creative]);

  // ── Avatar upload ──────────────────────────────────────
  const handlePickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission requise",
        "Autorisez l'accès à vos photos pour changer votre avatar."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri); // immediate preview
      await uploadAvatar(uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setAvatarUploading(true);
    try {
      // 1. Get presigned upload URL from backend
      const {
        data: { uploadUrl, avatarUrl: finalUrl },
      } = await profileApi.getAvatarUploadUrl();

      // 2. Upload binary directly via expo-file-system (more reliable than fetch+blob on RN)
      await uploadAsync(uploadUrl, uri, {
        httpMethod: "PUT",
        uploadType: 0 /* BINARY_CONTENT */,
        headers: { "Content-Type": "image/jpeg" },
      } as FileSystemUploadOptions);

      // 3. Persist URL in profile
      await profileApi.updateProfile({ avatarUrl: finalUrl });
      setAvatarUri(finalUrl);
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    } catch {
      Alert.alert("Erreur", "Impossible de télécharger la photo. Réessayez.");
      // revert to previous avatar
      setAvatarUri(profile?.avatarUrl ?? null);
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── Profile mutations ──────────────────────────────────
  const updateProfile = useMutation({
    mutationFn: () =>
      profileApi.updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        isPublic,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] }),
  });

  const updateCreative = useMutation({
    mutationFn: () =>
      profileApi.saveCreativeProfile({
        artistPreferences: [level],
        visualPreferences: specialties,
        musicPreferences: creative?.musicPreferences ?? [],
        filmPreferences: creative?.filmPreferences ?? [],
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["creative-profile"] }),
  });

  const isSaving = updateProfile.isPending || updateCreative.isPending;

  const handleSaveAll = async () => {
    try {
      await Promise.all([
        updateProfile.mutateAsync(),
        updateCreative.mutateAsync(),
      ]);
      setTimeout(() => router.back(), 600);
    } catch {
      Alert.alert("Erreur", "Une erreur s'est produite. Réessayez.");
    }
  };

  const handleTogglePublic = (val: boolean) => {
    setIsPublic(val);
    profileApi.updateProfile({ isPublic: val });
  };

  const addTag = (tag: string) => {
    const clean = tag.trim();
    if (!clean || specialties.includes(clean)) return;
    setSpecialties((prev) => [...prev, clean]);
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setSpecialties((prev) => prev.filter((t) => t !== tag));

  // ── Location ──────────────────────────────────────────
  const handleAutoDetectLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "Autorisez l'accès à votre position pour détecter votre localisation.",
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const [result] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (result) {
        setCity(result.city ?? result.subregion ?? "");
        setCountry(result.country ?? "");
      }
    } catch {
      Alert.alert(
        "Erreur",
        "Impossible de détecter votre position. Saisissez manuellement.",
      );
    }
  };

  const handleUpdateLocation = () => {
    Alert.alert("Localisation", "Comment souhaitez-vous définir votre localisation ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Saisir manuellement", onPress: () => setEditingLocation(true) },
      { text: "Détecter", onPress: handleAutoDetectLocation },
    ]);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const initial = (displayName || authUser?.username || "?")[0].toUpperCase();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={["#0E0A24", "#080814"]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Modifier le profil</Text>
          <TouchableOpacity
            style={[s.saveBtn, isSaving && s.saveBtnDisabled]}
            onPress={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>Sauvegarder</Text>
            )}
          </TouchableOpacity>
        </View>

        {profileLoading ? (
          <ActivityIndicator
            color={Colors.accentPurple}
            style={{ marginTop: 80 }}
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Avatar ── */}
            <View style={s.avatarSection}>
              <TouchableOpacity
                style={s.avatarWrap}
                onPress={handlePickAvatar}
                disabled={avatarUploading}
                activeOpacity={0.8}
              >
                {/* Gradient ring */}
                <LinearGradient
                  colors={Gradients.brand as [string, string]}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                {/* Avatar content */}
                <View style={s.avatarInner}>
                  {avatarUri ? (
                    <Image
                      source={{ uri: avatarUri }}
                      style={s.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={["#2D1060", "#4D2090"]}
                      style={s.avatarFallback}
                    >
                      <Text style={s.avatarInitial}>{initial}</Text>
                    </LinearGradient>
                  )}
                </View>

                {/* Camera overlay */}
                <View style={s.avatarOverlay}>
                  {avatarUploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Icon name="camera" size={18} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePickAvatar}
                disabled={avatarUploading}
                style={s.changePhotoBtn}
              >
                <Text style={s.changePhotoText}>
                  {avatarUploading ? "Envoi en cours..." : "Changer la photo"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigate("/avatar-picker")}
                style={s.changePhotoBtn}
              >
                <Text style={s.changePhotoText}>Choisir un emoji avatar</Text>
              </TouchableOpacity>
            </View>

            {/* ── Informations de base ── */}
            <View style={s.section}>
              <SectionHeader icon="user" title="Informations de base" />
              <View style={s.card}>
                {/* Read-only username */}
                <View style={s.fieldWrapper}>
                  <Text style={s.fieldLabel}>Nom d'utilisateur</Text>
                  <View style={[s.fieldInput, s.fieldInputReadonly]}>
                    <TextInput
                      style={[s.input, s.inputReadonly]}
                      value={authUser?.username ?? ""}
                      editable={false}
                    />
                    <Icon name="lock" size={14} color={Colors.textMuted} />
                  </View>
                </View>

                {/* Display name */}
                <View style={s.fieldWrapper}>
                  <Text style={s.fieldLabel}>Nom affiché</Text>
                  <View style={s.fieldInput}>
                    <TextInput
                      style={s.input}
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder="Votre nom public"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="none"
                    />
                  </View>
                  <Text style={s.fieldHint}>
                    Apparaît sur votre profil et dans les recherches
                  </Text>
                </View>

                {/* Bio */}
                <View style={s.fieldWrapper}>
                  <Text style={s.fieldLabel}>Biographie</Text>
                  <View style={[s.fieldInput, s.fieldInputMulti]}>
                    <TextInput
                      style={[s.input, s.inputMulti]}
                      value={bio}
                      onChangeText={(t) => t.length <= 500 && setBio(t)}
                      placeholder="Parlez de vous, de votre style..."
                      placeholderTextColor={Colors.textMuted}
                      multiline
                      numberOfLines={4}
                      autoCapitalize="none"
                    />
                  </View>
                  <Text style={s.fieldHint}>{bio.length}/500</Text>
                </View>
              </View>
            </View>

            {/* ── Localisation ── */}
            <View style={s.section}>
              <SectionHeader icon="marker-pin" title="Localisation" />
              <View style={s.card}>
                {editingLocation ? (
                  <View style={{ gap: 8 }}>
                    <View style={s.fieldInput}>
                      <TextInput
                        style={s.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Ville"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>
                    <View style={s.fieldInput}>
                      <TextInput
                        style={s.input}
                        value={country}
                        onChangeText={setCountry}
                        placeholder="Pays"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>
                    <TouchableOpacity
                      style={s.modifierBtn}
                      onPress={() => setEditingLocation(false)}
                    >
                      <Text style={s.modifierText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={s.locationRow}>
                    <View style={s.locationInfo}>
                      <Text style={s.locationCity}>
                        {city && country
                          ? `${city}, ${country}`
                          : city || country || "Non renseignée"}
                      </Text>
                      <Text style={s.locationSub}>
                        Visible par les autres photographes sur la carte des
                        spots.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={s.modifierBtn}
                      onPress={handleUpdateLocation}
                    >
                      <Text style={s.modifierText}>Modifier</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* ── Confidentialité ── */}
            <View style={s.section}>
              <SectionHeader icon="lock" title="Confidentialité" />
              <View style={s.card}>
                <View style={s.privacyRow}>
                  <View style={s.privacyIcon}>
                    <Icon name="globe" size={18} color={Colors.textSecondary} />
                  </View>
                  <View style={s.privacyText}>
                    <Text style={s.privacyLabel}>Profil public</Text>
                    <Text style={s.privacySub}>
                      {isPublic
                        ? "Tout le monde peut voir votre profil et vos photos"
                        : "Seuls vos amis peuvent voir votre profil"}
                    </Text>
                  </View>
                  <Switch
                    value={isPublic}
                    onValueChange={handleTogglePublic}
                    trackColor={{ false: "#333", true: Colors.accentPurple }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            </View>

            {/* ── Niveau ── */}
            <View style={s.section}>
              <SectionHeader icon="camera" title="Niveau de photographie" />
              <View style={s.card}>
                <Text style={s.cardSubtitle}>Sélectionnez votre niveau</Text>
                {LEVEL_OPTIONS.map((opt, i) => (
                  <React.Fragment key={opt.id}>
                    {i > 0 && <View style={s.rowDivider} />}
                    <TouchableOpacity
                      style={s.levelRow}
                      onPress={() => setLevel(opt.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[s.radio, level === opt.id && s.radioSelected]}
                      >
                        {level === opt.id && <View style={s.radioDot} />}
                      </View>
                      <Text
                        style={[
                          s.levelLabel,
                          level === opt.id && s.levelLabelSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* ── Spécialités ── */}
            <View style={s.section}>
              <SectionHeader icon="sparkles" title="Spécialités" />
              <View style={s.card}>
                <Text style={s.cardSubtitle}>
                  Vos domaines de spécialité en photographie
                </Text>

                {specialties.length > 0 && (
                  <View style={s.tagsRow}>
                    {specialties.map((tag) => (
                      <View key={tag} style={s.tag}>
                        <Text style={s.tagText}>{tag}</Text>
                        <TouchableOpacity
                          onPress={() => removeTag(tag)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={s.tagRemove}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <View style={s.tagInputRow}>
                  <TextInput
                    style={s.tagInput}
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder="Ex: Macro, Nature..."
                    placeholderTextColor={Colors.textMuted}
                    onSubmitEditing={() => addTag(tagInput)}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={s.addTagBtn}
                    onPress={() => addTag(tagInput)}
                  >
                    <LinearGradient
                      colors={Gradients.brand}
                      style={s.addTagBtnGrad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={s.addTagText}>Ajouter</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <View style={s.suggestionsRow}>
                  {SPECIALTY_SUGGESTIONS.filter(
                    (sug) => !specialties.includes(sug)
                  ).map((sug) => (
                    <TouchableOpacity
                      key={sug}
                      style={s.suggestionPill}
                      onPress={() => addTag(sug)}
                    >
                      <Text style={s.suggestionText}>+ {sug}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* ── Informations du compte ── */}
            <View style={s.section}>
              <Text style={s.sectionTitlePlain}>Informations du compte</Text>
              <View style={s.card}>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Pseudo</Text>
                  <Text style={s.infoValue}>{authUser?.username ?? "—"}</Text>
                </View>
                <View style={s.rowDivider} />
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Email</Text>
                  <Text style={s.infoValue}>{authUser?.email ?? "—"}</Text>
                </View>
                <View style={s.rowDivider} />
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Membre depuis</Text>
                  <Text style={s.infoValue}>Janvier 2026</Text>
                </View>
              </View>
            </View>

            {/* ── Zone de danger ── */}
            <View style={s.section}>
              <Text style={s.dangerTitle}>Zone de danger</Text>
              <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
                <Icon name="log-out" size={16} color="#FF6B6B" />
                <Text style={s.logoutText}>Se déconnecter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.deleteBtn}
                onPress={() =>
                  Alert.alert(
                    "Supprimer le compte",
                    "Cette action est irréversible. Toutes vos données seront supprimées définitivement.",
                    [
                      { text: "Annuler", style: "cancel" },
                      {
                        text: "Supprimer",
                        style: "destructive",
                        onPress: handleLogout,
                      },
                    ]
                  )
                }
              >
                <Text style={s.deleteText}>Supprimer mon compte</Text>
              </TouchableOpacity>
              <Text style={s.deleteWarning}>Cette action est irréversible</Text>
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
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
  saveBtn: {
    backgroundColor: Colors.accentPurple,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 100,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  scroll: { paddingTop: 12, paddingBottom: 20 },

  // Avatar
  avatarSection: { alignItems: "center", paddingVertical: 28, gap: 14 },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: "hidden",
    padding: 3,
  },
  avatarInner: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 45,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 34, fontWeight: "800", color: "#fff" },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoBtn: { paddingVertical: 4 },
  changePhotoText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.accentPurple,
  },

  // Section
  section: { paddingHorizontal: 16, marginTop: 20, gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(123,47,190,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  sectionTitlePlain: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    paddingLeft: 2,
  },

  // Card
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cardSubtitle: { fontSize: 13, color: Colors.textMuted, marginBottom: 2 },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: -16,
  },

  // Fields
  fieldWrapper: { gap: 6 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  fieldInputMulti: { alignItems: "flex-start", paddingVertical: 12 },
  fieldInputReadonly: { opacity: 0.5 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },
  inputReadonly: { color: Colors.textMuted },
  fieldHint: { fontSize: 12, color: Colors.textMuted, paddingLeft: 2 },

  // Location
  locationRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  locationInfo: { flex: 1, gap: 4 },
  locationCity: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  locationSub: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  modifierBtn: {
    backgroundColor: "rgba(123,47,190,0.2)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(123,47,190,0.4)",
  },
  modifierText: { fontSize: 13, fontWeight: "600", color: Colors.accentPurple },

  // Privacy
  privacyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  privacyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  privacyText: { flex: 1, gap: 2 },
  privacyLabel: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  privacySub: { fontSize: 12, color: Colors.textMuted, lineHeight: 16 },

  // Level
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 6,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: Colors.accentPurple },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accentPurple,
  },
  levelLabel: { fontSize: 15, color: Colors.textSecondary, fontWeight: "500" },
  levelLabelSelected: { color: Colors.textPrimary, fontWeight: "700" },

  // Specialties
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(123,47,190,0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(123,47,190,0.4)",
    gap: 6,
  },
  tagText: { fontSize: 13, fontWeight: "600", color: Colors.accentPurple },
  tagRemove: {
    fontSize: 16,
    color: Colors.accentPurple,
    lineHeight: 16,
    fontWeight: "700",
  },
  tagInputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  tagInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  addTagBtn: { borderRadius: 10, overflow: "hidden" },
  addTagBtnGrad: { paddingHorizontal: 14, paddingVertical: 11 },
  addTagText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  suggestionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  // Account info
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 14, color: Colors.textMuted, fontWeight: "500" },
  infoValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: "600" },

  // Danger zone
  dangerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF8C00",
    paddingLeft: 2,
  },
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
  logoutText: { fontSize: 15, fontWeight: "700", color: "#FF6B6B" },
  deleteBtn: {
    backgroundColor: "rgba(255,59,48,0.1)",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.3)",
    marginTop: 4,
  },
  deleteText: { fontSize: 15, fontWeight: "700", color: "#FF3B30" },
  deleteWarning: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
});
