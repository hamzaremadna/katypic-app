import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";

export type AssistantMode = "text" | "oral" | "both";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (mode: AssistantMode, intensity: number) => void;
}

const MODES: { key: AssistantMode; label: string }[] = [
  { key: "text", label: "Assistant à l'écrit" },
  { key: "oral", label: "Assistant à l'oral" },
  { key: "both", label: "Les deux" },
];

const INTENSITIES: { label: string; value: number; hint: string }[] = [
  { label: "Faible", value: 25, hint: "~30 sec" },
  { label: "Moyen", value: 60, hint: "~15 sec" },
  { label: "Élevé", value: 90, hint: "~8 sec" },
];

export function AssistantModeModal({ visible, onClose, onConfirm }: Props) {
  const [selectedMode, setSelectedMode] = useState<AssistantMode>("text");
  const [selectedIntensity, setSelectedIntensity] = useState(1); // index into INTENSITIES

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        <View style={s.sheet}>
          {/* Close */}
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeText}>✕</Text>
          </TouchableOpacity>

          <Text style={s.title}>Choisissez le type d'assistance</Text>

          {/* Mode options */}
          {MODES.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[s.modeBtn, selectedMode === key && s.modeBtnActive]}
              activeOpacity={0.8}
              onPress={() => setSelectedMode(key)}
            >
              {selectedMode === key ? (
                <LinearGradient
                  colors={[Colors.gradientPink, Colors.gradientPurple]}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              ) : null}
              <Text style={[s.modeBtnText, selectedMode === key && s.modeBtnTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Intensity selector */}
          <Text style={s.intensityLabel}>Fréquence des conseils</Text>
          <View style={s.intensityRow}>
            {INTENSITIES.map(({ label, value, hint }, idx) => (
              <TouchableOpacity
                key={value}
                style={[s.intensityBtn, selectedIntensity === idx && s.intensityBtnActive]}
                activeOpacity={0.8}
                onPress={() => setSelectedIntensity(idx)}
              >
                {selectedIntensity === idx && (
                  <LinearGradient
                    colors={[Colors.gradientPink, Colors.gradientPurple]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                )}
                <Text style={[s.intensityBtnText, selectedIntensity === idx && s.intensityBtnTextActive]}>
                  {label}
                </Text>
                <Text style={[s.intensityHint, selectedIntensity === idx && s.intensityHintActive]}>
                  {hint}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Confirm */}
          <TouchableOpacity
            style={s.confirmBtn}
            activeOpacity={0.85}
            onPress={() => onConfirm(selectedMode, INTENSITIES[selectedIntensity].value)}
          >
            <LinearGradient
              colors={Gradients.brand as [string, string]}
              style={s.confirmGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={s.confirmText}>Activer l'assistant</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(4,4,14,0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    width: "100%",
    backgroundColor: "#0F0A24",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(123,47,190,0.3)",
    gap: 12,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { fontSize: 16, color: Colors.textSecondary },
  title: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 4,
    marginTop: 4,
  },
  modeBtn: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 14,
    alignItems: "center",
  },
  modeBtnActive: { borderColor: "transparent" },
  modeBtnText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  modeBtnTextActive: { color: "#fff", fontFamily: Fonts.bold },

  intensityLabel: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  intensityRow: {
    flexDirection: "row",
    gap: 8,
  },
  intensityBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  intensityBtnActive: { borderColor: "transparent" },
  intensityBtnText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textSecondary,
  },
  intensityBtnTextActive: { color: "#fff" },
  intensityHint: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: "rgba(255,255,255,0.3)",
  },
  intensityHintActive: { color: "rgba(255,255,255,0.7)" },

  confirmBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  confirmGrad: {
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 14,
  },
  confirmText: { fontSize: 16, fontFamily: Fonts.bold, color: "#fff" },
});
