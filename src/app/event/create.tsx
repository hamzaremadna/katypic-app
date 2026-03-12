import React, { useState } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { navigateReplace } from "@/utils/navigation";
import { Colors, Gradients } from "../../theme/colors";
import { KaytiHeader, BottomTabBar } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";
import { eventApi } from "../../services/api/event.api";

const { width } = Dimensions.get("window");

// ─── Photo Type Options ─────────────────────────────────
const PHOTO_TYPES = [
  { id: "portrait", label: "Portrait", icon: "user" },
  { id: "paysage", label: "Paysage", icon: "compass" },
  { id: "autre", label: "Autre", icon: "camera" },
];

// ─── Model Options ──────────────────────────────────────
const MODEL_OPTIONS = [
  { id: "with", label: "Avec modèle" },
  { id: "without", label: "Sans modèle" },
];

// ─── Level Options ──────────────────────────────────────
const LEVEL_OPTIONS = [
  { id: "beginner", label: "Débutant" },
  { id: "all", label: "Tous niveaux" },
  { id: "intermediate", label: "Intermédiaire" },
  { id: "advanced", label: "Avancé" },
];

// ─── Form Input Component ───────────────────────────────
function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  maxLength,
  multiline,
  numberOfLines,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: string;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <View style={s.formGroup}>
      <Text style={s.formLabel}>{label}</Text>
      <View style={[s.inputContainer, multiline && s.inputContainerMultiline]}>
        {icon && <Icon name={icon as any} size={16} color={Colors.textSecondary} />}
        <TextInput
          style={[
            s.textInput,
            multiline && s.textInputMultiline,
            !icon && { paddingLeft: 0 },
          ]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? "top" : "center"}
        />
        {maxLength && (
          <Text style={s.charCounter}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────
export default function CreateEventScreen() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [photoType, setPhotoType] = useState("portrait");
  const [modelOption, setModelOption] = useState("without");
  const [level, setLevel] = useState("all");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Champ requis", "Veuillez entrer un titre pour l'événement.");
      return;
    }
    if (!date.trim() || !time.trim()) {
      Alert.alert("Champ requis", "Veuillez entrer une date et une heure.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Champ requis", "Veuillez entrer une description.");
      return;
    }

    // Parse date (DD/MM/YYYY) and time (HH:MM) into ISO string
    const [day, month, year] = date.split("/");
    const [hours, minutes] = time.split(":");
    const startsAt = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours ?? 0),
      Number(minutes ?? 0)
    );
    if (isNaN(startsAt.getTime())) {
      Alert.alert("Format invalide", "Utilisez le format JJ/MM/AAAA pour la date et HH:MM pour l'heure.");
      return;
    }
    const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000); // +2h

    setIsSubmitting(true);
    try {
      await eventApi.create({
        title: title.trim(),
        description: description.trim(),
        latitude: 48.8566, // Paris (default — no geolocation in MVP)
        longitude: 2.3522,
        address: location.trim() || undefined,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
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
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <KaytiHeader showBack title="Créer un événement" />

          <View style={s.form}>
            {/* Titre */}
            <FormInput
              label="Titre de l'événement *"
              placeholder="Ex: Golden hour au parc"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />

            {/* Date & Heure */}
            <View style={s.rowFields}>
              <View style={[s.formGroup, { flex: 1 }]}>
                <Text style={s.formLabel}>Date *</Text>
                <View style={s.inputContainer}>
                  <Icon name="calendar" size={16} color={Colors.textSecondary} />
                  <TextInput
                    style={s.textInput}
                    placeholder="JJ/MM/AAAA"
                    placeholderTextColor={Colors.textMuted}
                    value={date}
                    onChangeText={setDate}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              </View>
              <View style={[s.formGroup, { flex: 1 }]}>
                <Text style={s.formLabel}>Heure *</Text>
                <View style={s.inputContainer}>
                  <Icon name="clock" size={16} color={Colors.textSecondary} />
                  <TextInput
                    style={s.textInput}
                    placeholder="HH:MM"
                    placeholderTextColor={Colors.textMuted}
                    value={time}
                    onChangeText={setTime}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>
            </View>

            {/* Lieu */}
            <FormInput
              label="Lieu de rendez-vous *"
              placeholder="Rechercher un lieu"
              value={location}
              onChangeText={setLocation}
              icon="marker-pin"
            />

            {/* Mini map */}
            <View style={s.formGroup}>
              <Text style={s.formLabel}>Position sur la carte</Text>
              <View style={s.miniMap}>
                <LinearGradient
                  colors={["#1A2040", "#0F1530"]}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={s.mapPin}>
                  <Icon name="marker-pin" size={28} color={Colors.accentPink} />
                </View>
                <Text style={s.mapPlaceholder}>
                  Carte interactive
                </Text>
              </View>
            </View>

            {/* Type de photo */}
            <View style={s.formGroup}>
              <Text style={s.formLabel}>Type de photo *</Text>
              <View style={s.photoTypeRow}>
                {PHOTO_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      s.photoTypeCard,
                      photoType === type.id && s.photoTypeCardSelected,
                    ]}
                    onPress={() => setPhotoType(type.id)}
                  >
                    {photoType === type.id && (
                      <LinearGradient
                        colors={Gradients.brand}
                        style={s.photoTypeCardBg}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                    )}
                    <Icon name={type.icon as any} size={28} color={photoType === type.id ? Colors.textPrimary : Colors.textMuted} />
                    <Text
                      style={[
                        s.photoTypeLabel,
                        photoType === type.id && s.photoTypeLabelSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Modele disponible */}
            <View style={s.formGroup}>
              <Text style={s.formLabel}>Modèle disponible ? *</Text>
              <View style={s.modelRow}>
                {MODEL_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      s.modelOption,
                      modelOption === option.id && s.modelOptionSelected,
                    ]}
                    onPress={() => setModelOption(option.id)}
                  >
                    {modelOption === option.id && (
                      <LinearGradient
                        colors={Gradients.brand}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    )}
                    <Text
                      style={[
                        s.modelOptionText,
                        modelOption === option.id &&
                          s.modelOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Niveau requis */}
            <View style={s.formGroup}>
              <Text style={s.formLabel}>Niveau requis</Text>
              <View style={s.levelRow}>
                {LEVEL_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      s.levelPill,
                      level === opt.id && s.levelPillSelected,
                    ]}
                    onPress={() => setLevel(opt.id)}
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
                        level === opt.id && s.levelPillTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Max participants */}
            <FormInput
              label="Nombre maximum de participants"
              placeholder="10"
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              icon="users"
            />

            {/* Description */}
            <FormInput
              label="Description *"
              placeholder="Décrivez votre événement, le thème, ce que les participants doivent apporter..."
              value={description}
              onChangeText={setDescription}
              maxLength={300}
              multiline
              numberOfLines={5}
            />

            {/* Tip card */}
            <View style={s.tipCard}>
              <LinearGradient
                colors={["rgba(123,47,190,0.15)", "rgba(26,26,46,0.9)"]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={s.tipRow}>
                <Icon name="lightbulb" size={18} color={Colors.accentPurple} />
                <Text style={s.tipText}>
                  Conseil : Soyez précis sur le lieu de rendez-vous et
                  n'hésitez pas à ajouter des détails sur le matériel
                  recommandé.
                </Text>
              </View>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              style={[s.submitBtn, isSubmitting && { opacity: 0.6 }]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={["#E91E8C", "#FF3B30"]}
                style={s.submitBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.submitBtnText}>ENREGISTRER</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Bottom spacer for tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomTabBar activeRoute="/(tabs)/discover" />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20 },

  form: {
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 20,
  },

  // Form group
  formGroup: { gap: 8 },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  // Input
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  inputContainerMultiline: {
    alignItems: "flex-start",
    minHeight: 120,
  },
  inputIcon: { fontSize: 16 },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  textInputMultiline: {
    minHeight: 90,
    paddingTop: 2,
  },
  charCounter: {
    fontSize: 12,
    color: Colors.textMuted,
    alignSelf: "flex-end",
  },

  // Row fields
  rowFields: {
    flexDirection: "row",
    gap: 12,
  },

  // Mini map
  miniMap: {
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  mapPin: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  mapPinIcon: { fontSize: 28 },
  mapPlaceholder: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },

  // Photo type cards
  photoTypeRow: {
    flexDirection: "row",
    gap: 12,
  },
  photoTypeCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 8,
    overflow: "hidden",
  },
  photoTypeCardSelected: {
    borderColor: Colors.accentPink,
  },
  photoTypeCardBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  photoTypeIcon: { fontSize: 28 },
  photoTypeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  photoTypeLabelSelected: {
    color: Colors.textPrimary,
  },

  // Model options
  modelRow: {
    flexDirection: "row",
    gap: 12,
  },
  modelOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  modelOptionSelected: {
    borderColor: Colors.accentPink,
  },
  modelOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textMuted,
    position: "relative",
  },
  modelOptionTextSelected: {
    color: Colors.textPrimary,
  },

  // Level pills
  levelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  levelPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  levelPillSelected: {
    borderColor: Colors.accentPink,
  },
  levelPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
    position: "relative",
  },
  levelPillTextSelected: {
    color: Colors.textPrimary,
  },

  // Tip card
  tipCard: {
    borderRadius: 16,
    overflow: "hidden",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(123,47,190,0.3)",
  },
  tipRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  tipIcon: { fontSize: 18, marginTop: 1 },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Submit button
  submitBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 4,
    shadowColor: "#E91E8C",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  submitBtnGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
});
