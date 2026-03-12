import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { Icon } from "./Icon";

const LABELS = ["", "Mauvais", "Moyen", "Bien", "Très bien", "Excellent"];

interface ReviewModalProps {
  visible: boolean;
  spotName: string;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

export function ReviewModal({
  visible,
  spotName,
  onClose,
  onSubmit,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(rating, comment);
    setRating(0);
    setComment("");
  };

  const handleClose = () => {
    setRating(0);
    setComment("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={s.card}>
          <LinearGradient
            colors={["#1E1E3A", "#141428"]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Close button */}
          <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
            <Icon name="x" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={s.title}>Donner votre avis</Text>
          <Text style={s.subtitle}>
            Qu'avez-vous pensé de{" "}
            <Text style={s.spotName}>{spotName}</Text> ?
          </Text>

          {/* Stars */}
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
              >
                <Icon
                  name="star"
                  size={36}
                  color={star <= rating ? "#FFB800" : Colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Rating label */}
          {rating > 0 && (
            <View style={s.ratingLabelRow}>
              <Icon name="star" size={14} color="#FFB800" />
              <Text style={s.ratingLabel}>{LABELS[rating]}</Text>
            </View>
          )}

          {/* Comment */}
          <View style={s.textAreaWrap}>
            <TextInput
              style={s.textArea}
              value={comment}
              onChangeText={setComment}
              placeholder="Partagez votre expérience (optionnel)..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Buttons */}
          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={handleClose}>
              <Text style={s.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.submitBtn, rating === 0 && s.submitBtnDisabled]}
              onPress={rating > 0 ? handleSubmit : undefined}
              activeOpacity={rating > 0 ? 0.85 : 1}
            >
              <LinearGradient
                colors={
                  rating > 0
                    ? (Gradients.brand as [string, string])
                    : (["#333", "#333"] as [string, string])
                }
                style={s.submitBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={s.submitBtnText}>Publier</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    gap: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(123,47,190,0.3)",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  title: {
    fontSize: 20,
    fontFamily: Fonts.extrabold,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  spotName: { fontFamily: Fonts.bold, color: Colors.textPrimary },

  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  ratingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  ratingLabel: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: "#FFB800",
  },

  textAreaWrap: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    marginTop: 4,
  },
  textArea: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
  },

  actions: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textSecondary,
  },
  submitBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnGrad: { paddingVertical: 14, alignItems: "center" },
  submitBtnText: { fontSize: 15, fontFamily: Fonts.bold, color: "#fff" },
});
