import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@theme/colors";
import { Fonts } from "@theme/typography";

const QUESTIONS = [
  "Comment photographier un coucher de soleil ?",
  "Quel appareil photo pour débuter ?",
  "Quels spots photo visiter à Paris ?",
  "Comment éviter les photos floues ?",
  "Quel objectif pour des portraits ?",
  "Conseils pour la photo de rue",
];

export function SuggestionChips({
  selectedQuestion,
  onQuestionPress,
}: {
  selectedQuestion: number | null;
  onQuestionPress: (index: number, question: string) => void;
}) {
  return (
    <View style={s.section}>
      <Text style={s.label}>QUESTIONS FRÉQUENTES</Text>

      <View style={s.list}>
        {QUESTIONS.map((q, i) => {
          const isSelected = selectedQuestion === i;
          return (
            <TouchableOpacity
              key={i}
              style={s.cardWrap}
              onPress={() => onQuestionPress(i, q)}
              activeOpacity={0.8}
            >
              {isSelected ? (
                <LinearGradient
                  colors={["#5B2FBE", "#2B7FFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.cardGradient}
                >
                  <Text style={s.text}>{q}</Text>
                </LinearGradient>
              ) : (
                <View style={s.card}>
                  <Text style={s.text}>{q}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 14,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.accentPurple,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  list: {
    gap: 8,
  },
  cardWrap: {
    borderRadius: 14,
    overflow: "hidden",
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardGradient: {
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  text: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
});
