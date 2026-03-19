import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Colors, Gradients } from "../theme/colors";
import { Fonts } from "../theme/typography";
import { KaytiHeader } from "../components/ui";
import { profileApi } from "../services/api/profile.api";

const { width } = Dimensions.get("window");
const COLUMNS = 6;
const GAP = 5;
const CELL_SIZE = (width - 40 - GAP * (COLUMNS - 1)) / COLUMNS;

// ─── Emoji grid ──────────────────────────────────────────
const EMOJIS = [
  // People
  "👱",
  "🦁",
  "🤠",
  "👼",
  "👸",
  "😊",
  "👩",
  "🤓",
  "👮",
  "🧑‍🎨",
  "👨‍✈️",
  "👷",
  // More people
  "🧒",
  "🧓",
  "💇",
  "🦸",
  "🧑‍🎤",
  "👩‍🎤",
  "😎",
  "🧙",
  "🤡",
  "😺",
  "🐭",
  "🐹",
  // Animals
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐨",
  "🐯",
  "🐷",
  "🐮",
  "🐸",
  "🐶",
  "🐵",
  "💩",
  // More animals
  "🐔",
  "🐝",
  "🐛",
  "🦋",
  "🐌",
  "🐞",
  // Fantasy
  "🦄",
  "🐲",
  "🦅",
  "🦉",
  "🐧",
  "🐳",
];

// ─── Main Screen ─────────────────────────────────────────
export default function AvatarPickerScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>("👱");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await profileApi.updateProfile({ coachAvatar: selected });
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      router.back();
    } catch {
      setSaving(false);
    }
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      <KaytiHeader showBack title="Choix avatar" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Instruction */}
        <Text style={s.instruction}>Choisis ton avatar</Text>

        {/* Divider */}
        <View style={s.divider} />

        {/* Preview */}
        <View style={s.previewWrap}>
          <View style={s.previewBox}>
            <Text style={s.previewEmoji}>{selected ?? "❓"}</Text>
          </View>
          <Text style={s.previewLabel}>Aperçu de ton avatar</Text>
        </View>

        {/* Emoji selection */}
        <Text style={s.selectTitle}>Sélectionne un emoji</Text>

        <View style={s.emojiGrid}>
          {EMOJIS.map((emoji, idx) => (
            <TouchableOpacity
              key={`${emoji}-${idx}`}
              style={[s.emojiCell, selected === emoji && s.emojiCellSelected]}
              onPress={() => setSelected(emoji)}
              activeOpacity={0.7}
            >
              <Text style={s.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={s.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={Gradients.brand as [string, string]}
            style={s.saveBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={s.saveBtnText}>Enregistrer</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 110 }} />
      </ScrollView>

    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20 },

  instruction: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 20,
    marginVertical: 16,
  },

  previewWrap: { alignItems: "center", gap: 10, marginBottom: 24 },
  previewBox: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    borderWidth: 2,
    borderColor: "#9B59B6",
    alignItems: "center",
    justifyContent: "center",
  },
  previewEmoji: { fontSize: 60 },
  previewLabel: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },

  selectTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 14,
  },

  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: GAP,
  },
  emojiCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emojiCellSelected: {
    borderColor: "#9B59B6",
    borderWidth: 2,
    backgroundColor: "rgba(155,89,182,0.15)",
  },
  emojiText: { fontSize: 24 },

  saveBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  saveBtnGrad: {
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 16, fontFamily: Fonts.bold, color: "#fff" },
});
