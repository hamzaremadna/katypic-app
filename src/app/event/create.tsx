import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { navigateReplace } from "@/utils/navigation";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { uploadAsync } from "expo-file-system";
import type { FileSystemUploadOptions } from "expo-file-system/build/legacy/FileSystem.types";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { Colors, Gradients } from "../../theme/colors";
import { KaytiHeader } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";
import { eventApi } from "../../services/api/event.api";
import { hapticLight, hapticMedium } from "../../utils/haptics";

const { width } = Dimensions.get("window");

const PHOTO_TYPES = [
  { id: "portrait", label: "Portrait", icon: "user" },
  { id: "paysage", label: "Paysage", icon: "compass" },
  { id: "autre", label: "Autre", icon: "camera" },
] as const;

const MODEL_OPTIONS = [
  { id: "with", label: "Avec modèle" },
  { id: "without", label: "Sans modèle" },
] as const;

const LEVEL_OPTIONS = [
  { id: "all", label: "Tous niveaux" },
  { id: "beginner", label: "Débutant" },
  { id: "intermediate", label: "Intermédiaire" },
  { id: "advanced", label: "Avancé" },
] as const;

function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  maxLength,
  multiline,
  numberOfLines,
  keyboardType,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: string;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={s.formGroup}>
      <Text style={s.formLabel}>{label}</Text>
      <View style={[s.inputContainer, multiline && s.inputContainerMultiline]}>
        {icon && <Icon name={icon as any} size={16} color={Colors.textSecondary} />}
        <TextInput
          style={[s.textInput, multiline && s.textInputMultiline, !icon && { paddingLeft: 0 }]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? "top" : "center"}
          keyboardType={keyboardType ?? "default"}
        />
        {maxLength && (
          <Text style={s.charCounter}>{value.length}/{maxLength}</Text>
        )}
      </View>
    </View>
  );
}

export default function CreateEventScreen() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState(48.8566);
  const [longitude, setLongitude] = useState(2.3522);
  const [photoType, setPhotoType] = useState<"portrait" | "paysage" | "autre">("portrait");
  const [modelOption, setModelOption] = useState<"with" | "without">("without");
  const [level, setLevel] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Auto-detect GPS location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);
      mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
      const [result] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result) {
        setLocation([result.street, result.city].filter(Boolean).join(", "));
      }
    })();
  }, []);

  const handleMapPress = async (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    try {
      const [result] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result) setLocation([result.street, result.city].filter(Boolean).join(", "));
    } catch {}
  };

  const handlePickCoverImage = () => {
    Alert.alert("Photo de couverture", "Choisir depuis :", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Prendre une photo",
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.8 });
          if (!result.canceled && result.assets[0]) uploadCoverImage(result.assets[0].uri);
        },
      },
      {
        text: "Depuis la galerie",
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) { Alert.alert("Permission requise", "Autorisez l'accès à vos photos."); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [16, 9], quality: 0.8 });
          if (!result.canceled && result.assets[0]) uploadCoverImage(result.assets[0].uri);
        },
      },
    ]);
  };

  const uploadCoverImage = async (uri: string) => {
    setCoverImageUri(uri);
    setIsUploadingCover(true);
    try {
      const { data: { uploadUrl, coverUrl } } = await eventApi.getCoverUploadUrl();
      await uploadAsync(uploadUrl, uri, {
        httpMethod: "PUT",
        uploadType: 0,
        headers: { "Content-Type": "image/jpeg" },
      } as FileSystemUploadOptions);
      setCoverImageUrl(coverUrl);
    } catch {
      Alert.alert("Erreur", "Impossible d'uploader l'image de couverture.");
      setCoverImageUri(null);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert("Champ requis", "Veuillez entrer un titre."); return; }
    if (!date.trim() || !time.trim()) { Alert.alert("Champ requis", "Veuillez entrer une date et une heure."); return; }
    if (!description.trim()) { Alert.alert("Champ requis", "Veuillez entrer une description."); return; }

    const [day, month, year] = date.split("/");
    const [hours, minutes] = time.split(":");
    const startsAt = new Date(Number(year), Number(month) - 1, Number(day), Number(hours ?? 0), Number(minutes ?? 0));
    if (isNaN(startsAt.getTime())) {
      Alert.alert("Format invalide", "Utilisez JJ/MM/AAAA pour la date et HH:MM pour l'heure.");
      return;
    }
    const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);

    hapticMedium();
    setIsSubmitting(true);
    try {
      await eventApi.create({
        title: title.trim(),
        description: description.trim(),
        latitude,
        longitude,
        address: location.trim() || undefined,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        level: (level === "all" ? "ALL_LEVELS" : level.toUpperCase()) as "BEGINNER" | "ALL_LEVELS" | "INTERMEDIATE" | "ADVANCED",
        isPublic,
        coverImageUrl: coverImageUrl ?? undefined,
        photoType,
        hasModel: modelOption === "with",
      });
      Alert.alert("Événement créé !", "Votre événement a été publié.", [
        { text: "OK", onPress: () => navigateReplace("/activites") },
      ]);
    } catch {
      Alert.alert("Erreur", "Impossible de créer l'événement. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0E0A24", "#080814"]} style={StyleSheet.absoluteFillObject} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <KaytiHeader showBack title="Créer un événement" />

          <View style={s.form}>

            {/* ── Cover image ── */}
            <TouchableOpacity style={s.coverPicker} onPress={() => { hapticLight(); handlePickCoverImage(); }} activeOpacity={0.85}>
              {coverImageUri ? (
                <Image source={{ uri: coverImageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : (
                <LinearGradient colors={["#1A2040", "#0F1530"]} style={StyleSheet.absoluteFillObject} />
              )}
              <View style={s.coverOverlay}>
                {isUploadingCover ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="camera" size={22} color="rgba(255,255,255,0.8)" />
                    <Text style={s.coverHint}>{coverImageUri ? "Changer la couverture" : "Ajouter une photo de couverture"}</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* ── Titre ── */}
            <FormInput label="Titre de l'événement *" placeholder="Ex: Golden hour au parc" value={title} onChangeText={setTitle} maxLength={50} />

            {/* ── Date & Heure ── */}
            <View style={s.rowFields}>
              <View style={[s.formGroup, { flex: 1 }]}>
                <Text style={s.formLabel}>Date *</Text>
                <View style={s.inputContainer}>
                  <Icon name="calendar" size={16} color={Colors.textSecondary} />
                  <TextInput style={s.textInput} placeholder="JJ/MM/AAAA" placeholderTextColor={Colors.textMuted} value={date} onChangeText={setDate} keyboardType="numeric" maxLength={10} />
                </View>
              </View>
              <View style={[s.formGroup, { flex: 1 }]}>
                <Text style={s.formLabel}>Heure *</Text>
                <View style={s.inputContainer}>
                  <Icon name="clock" size={16} color={Colors.textSecondary} />
                  <TextInput style={s.textInput} placeholder="HH:MM" placeholderTextColor={Colors.textMuted} value={time} onChangeText={setTime} keyboardType="numeric" maxLength={5} />
                </View>
              </View>
            </View>

            {/* ── Lieu ── */}
            <FormInput label="Lieu de rendez-vous" placeholder="Adresse détectée automatiquement" value={location} onChangeText={setLocation} icon="marker-pin" />

            {/* ── Map picker ── */}
            <View style={s.formGroup}>
              <Text style={s.formLabel}>Position sur la carte</Text>
              <View style={s.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={s.map}
                  provider={PROVIDER_DEFAULT}
                  initialRegion={{ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                  onPress={(e) => handleMapPress(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
                >
                  <Marker
                    coordinate={{ latitude, longitude }}
                    draggable
                    onDragEnd={(e) => handleMapPress(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
                  />
                </MapView>
                <TouchableOpacity
                  style={s.locateBtn}
                  onPress={async () => {
                    hapticLight();
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== "granted") return;
                    const loc = await Location.getCurrentPositionAsync({});
                    handleMapPress(loc.coords.latitude, loc.coords.longitude);
                    mapRef.current?.animateToRegion({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
                  }}
                >
                  <Icon name="marker-pin" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Type de photo ── */}
            <View style={s.formGroup}>
              <Text style={s.formLabel}>Type de photo *</Text>
              <View style={s.photoTypeRow}>
                {PHOTO_TYPES.map((type) => (
                  <TouchableOpacity key={type.id} style={[s.photoTypeCard, photoType === type.id && s.photoTypeCardSelected]} onPress={() => { hapticLight(); setPhotoType(type.id); }} activeOpacity={0.8}>
                    {photoType === type.id && <LinearGradient colors={Gradients.brand} style={s.photoTypeCardBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />}
                    <Icon name={type.icon as any} size={28} color={photoType === type.id ? "#fff" : Colors.textMuted} />
                    <Text style={[s.photoTypeLabel, photoType === type.id && s.photoTypeLabelSelected]}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Modèle ── */}
            <View style={s.formGroup}>
              <Text style={s.formLabel}>Modèle disponible ?</Text>
              <View style={s.modelRow}>
                {MODEL_OPTIONS.map((option) => (
                  <TouchableOpacity key={option.id} style={[s.modelOption, modelOption === option.id && s.modelOptionSelected]} onPress={() => { hapticLight(); setModelOption(option.id); }} activeOpacity={0.8}>
                    {modelOption === option.id && <LinearGradient colors={Gradients.brand} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
                    <Text style={[s.modelOptionText, modelOption === option.id && s.modelOptionTextSelected]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Niveau ── */}
            <View style={s.formGroup}>
              <Text style={s.formLabel}>Niveau requis</Text>
              <View style={s.levelRow}>
                {LEVEL_OPTIONS.map((opt) => (
                  <TouchableOpacity key={opt.id} style={[s.levelPill, level === opt.id && s.levelPillSelected]} onPress={() => { hapticLight(); setLevel(opt.id); }} activeOpacity={0.8}>
                    {level === opt.id && <LinearGradient colors={Gradients.brand} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
                    <Text style={[s.levelPillText, level === opt.id && s.levelPillTextSelected]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Max participants ── */}
            <FormInput label="Nombre maximum de participants" placeholder="10" value={maxParticipants} onChangeText={setMaxParticipants} icon="users" keyboardType="numeric" />

            {/* ── Description ── */}
            <FormInput label="Description *" placeholder="Décrivez votre événement..." value={description} onChangeText={setDescription} maxLength={300} multiline numberOfLines={5} />

            {/* ── Visibilité ── */}
            <View style={s.formGroup}>
              <View style={s.toggleRow}>
                <View style={s.toggleLeft}>
                  <Icon name={isPublic ? "globe" : "lock"} size={16} color={Colors.textSecondary} />
                  <View>
                    <Text style={s.formLabel}>{isPublic ? "Événement public" : "Événement privé"}</Text>
                    <Text style={s.toggleSub}>{isPublic ? "Tout le monde peut rejoindre" : "Sur invitation uniquement"}</Text>
                  </View>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={(v) => { hapticLight(); setIsPublic(v); }}
                  trackColor={{ false: Colors.cardBorder, true: Colors.accentPink }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* ── Conseil ── */}
            <View style={s.tipCard}>
              <LinearGradient colors={["rgba(123,47,190,0.15)", "rgba(26,26,46,0.9)"]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={s.tipRow}>
                <Icon name="lightbulb" size={18} color={Colors.accentPurple} />
                <Text style={s.tipText}>Conseil : Soyez précis sur le lieu et n'hésitez pas à ajouter des détails sur le matériel recommandé.</Text>
              </View>
            </View>

            {/* ── Submit ── */}
            <TouchableOpacity style={[s.submitBtn, isSubmitting && { opacity: 0.6 }]} activeOpacity={0.85} onPress={handleSubmit} disabled={isSubmitting}>
              <LinearGradient colors={["#E91E8C", "#FF3B30"]} style={s.submitBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>ENREGISTRER</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20 },
  form: { paddingHorizontal: 20, marginTop: 12, gap: 20 },

  formGroup: { gap: 8 },
  formLabel: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },

  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.bgCard, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: Colors.cardBorder, gap: 10 },
  inputContainerMultiline: { alignItems: "flex-start", minHeight: 120 },
  textInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: "500" },
  textInputMultiline: { minHeight: 90, paddingTop: 2 },
  charCounter: { fontSize: 12, color: Colors.textMuted, alignSelf: "flex-end" },

  rowFields: { flexDirection: "row", gap: 12 },

  // Cover image
  coverPicker: { height: 160, borderRadius: 18, overflow: "hidden", borderWidth: 1.5, borderColor: Colors.cardBorder, borderStyle: "dashed" },
  coverOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(0,0,0,0.35)" },
  coverHint: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "600" },

  // Map
  mapContainer: { height: 180, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder, position: "relative" },
  map: { flex: 1 },
  locateBtn: { position: "absolute", bottom: 10, right: 10, width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },

  // Photo type
  photoTypeRow: { flexDirection: "row", gap: 12 },
  photoTypeCard: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 20, borderRadius: 16, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.cardBorder, gap: 8, overflow: "hidden" },
  photoTypeCardSelected: { borderColor: Colors.accentPink },
  photoTypeCardBg: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
  photoTypeLabel: { fontSize: 13, fontWeight: "600", color: Colors.textMuted },
  photoTypeLabelSelected: { color: Colors.textPrimary },

  // Model
  modelRow: { flexDirection: "row", gap: 12 },
  modelOption: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.cardBorder, overflow: "hidden" },
  modelOptionSelected: { borderColor: Colors.accentPink },
  modelOptionText: { fontSize: 14, fontWeight: "600", color: Colors.textMuted },
  modelOptionTextSelected: { color: Colors.textPrimary },

  // Level
  levelRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  levelPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.cardBorder, overflow: "hidden" },
  levelPillSelected: { borderColor: Colors.accentPink },
  levelPillText: { fontSize: 13, fontWeight: "600", color: Colors.textMuted },
  levelPillTextSelected: { color: Colors.textPrimary },

  // Toggle
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.cardBorder },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  // Tip
  tipCard: { borderRadius: 16, overflow: "hidden", padding: 16, borderWidth: 1, borderColor: "rgba(123,47,190,0.3)" },
  tipRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  tipText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  // Submit
  submitBtn: { borderRadius: 16, overflow: "hidden", marginTop: 4, shadowColor: "#E91E8C", shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
  submitBtnGradient: { paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  submitBtnText: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, letterSpacing: 1.5 },
});
