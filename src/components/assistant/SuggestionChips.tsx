import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@theme/colors";
import { Fonts } from "@theme/typography";

const QUESTIONS = [
  "Comment photographier un coucher de soleil ?",
  "Quel appareil photo acheter pour débuter ?",
  "Quels spots photo visiter à Paris ?",
  "Comment éviter les photos floues ?",
  "Quel objectif pour des portraits ?",
  "Conseils pour photo de rue",
];

export function SuggestionChips({
  selectedQuestion,
  onQuestionPress,
}: {
  selectedQuestion: number | null;
  onQuestionPress: (index: number, question: string) => void;
}) {
  return (
    <View style={s.questionsSection}>
      <Text style={s.questionsLabel}>QUESTIONS FRÉQUENTES</Text>

      <View style={s.questionsList}>
        {QUESTIONS.map((q, i) => {
          const isSelected = selectedQuestion === i;
          return (
            <TouchableOpacity
              key={i}
              style={s.questionCardWrap}
              onPress={() => onQuestionPress(i, q)}
              activeOpacity={0.8}
            >
              {isSelected ? (
                <LinearGradient
                  colors={["#5B2FBE", "#2B7FFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.questionCardGradient}
                >
                  <Text style={s.questionText}>{q}</Text>
                </LinearGradient>
              ) : (
                <View style={s.questionCard}>
                  <Text style={s.questionText}>{q}</Text>
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
  questionsSection: {
    paddingHorizontal: 28,
    paddingTop: 28,
    gap: 16,
  },
  questionsLabel: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.accentPurple,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  questionsList: {
    gap: 10,
  },
  questionCardWrap: {
    borderRadius: 14,
    overflow: "hidden",
  },
  questionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  questionCardGradient: {
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  questionText: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.textPrimary,
  },
});
