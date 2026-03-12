import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "@components/ui/Icon";
import { Colors } from "@theme/colors";
import { Fonts } from "@theme/typography";
import { BottomTabBar } from "@components/ui";
import { useChatWithCoach, useChatSession } from "@hooks/useChatWithCoach";
import type { ChatMessage } from "@services/api/ai.api";
import { ChatBubbleList } from "@components/assistant/ChatBubble";
import { SuggestionChips } from "@components/assistant/SuggestionChips";
import { VoiceRecordingModal } from "@components/assistant/VoiceInput";

export default function AssistantScreen() {
  const [sessionId, setSessionId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [showVoice, setShowVoice] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [sessionError, setSessionError] = useState<string | null>(null);

  const {
    sendMessage: sendMutation,
    isSending,
    error: chatError,
    clearError,
    createSession,
  } = useChatWithCoach(sessionId);
  const sessionQuery = useChatSession(sessionId);
  const messages: ChatMessage[] = sessionQuery.data?.messages ?? [];
  const isLoading = isSending || sessionQuery.isFetching;
  const hasMessages = messages.length > 0;

  const displayError = sessionError || chatError;

  const initSession = useCallback(async () => {
    try {
      setSessionError(null);
      const session = await createSession();
      setSessionId(session.id);
    } catch {
      setSessionError(
        "Impossible de démarrer la session. Vérifiez votre connexion et réessayez.",
      );
    }
  }, [createSession]);

  useEffect(() => {
    if (!sessionId) {
      initSession();
    }
  }, []);

  const handleRetry = useCallback(() => {
    clearError();
    setSessionError(null);
    if (!sessionId) {
      initSession();
    }
  }, [sessionId, clearError, initSession]);

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim() || !sessionId) return;
      setInputText("");
      setSelectedQuestion(null);
      sendMutation.mutate({ content: text.trim() });
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [sessionId, sendMutation],
  );

  const handleQuestionPress = useCallback(
    (index: number, question: string) => {
      setSelectedQuestion(index);
      handleSend(question);
    },
    [handleSend],
  );

  const handleOpenVoice = useCallback(() => setShowVoice(true), []);
  const handleCloseVoice = useCallback(() => setShowVoice(false), []);

  const handleContentSizeChange = useCallback(() => {
    if (hasMessages) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [hasMessages]);

  const handleSubmitInput = useCallback(() => {
    handleSend(inputText);
  }, [handleSend, inputText]);

  return (
    <View style={s.container}>
      <LinearGradient colors={["#0E0A24", "#080814"]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        style={s.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={s.scrollView}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={handleContentSizeChange}
        >
          {/* Greeting */}
          <View style={s.greetingSection}>
            <Text style={s.greetingTitle}>Bonjour !</Text>
            <Text style={s.greetingSub}>Je suis votre coach photo.</Text>
          </View>

          {/* Error Banner */}
          {displayError && (
            <View style={s.errorBanner}>
              <Text style={s.errorText}>{displayError}</Text>
              <TouchableOpacity onPress={handleRetry} style={s.retryButton}>
                <Text style={s.retryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Suggestion Chips */}
          {!hasMessages && (
            <SuggestionChips
              selectedQuestion={selectedQuestion}
              onQuestionPress={handleQuestionPress}
            />
          )}

          {/* Chat Messages */}
          <ChatBubbleList messages={messages} isLoading={isLoading} />
        </ScrollView>

        {/* Bottom Input Bar */}
        <View style={s.inputBar}>
          <View style={s.inputPill}>
            <LinearGradient
              colors={["#5B2FBE", "#3D2E9E", "#2B5FDF"]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            />
            <TextInput
              style={s.textInput}
              placeholder="Posez votre question..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSubmitInput}
              returnKeyType="send"
              multiline={false}
            />

            <View style={s.inputActions}>
              <TouchableOpacity style={s.inputIconBtn}>
                <View style={s.inputIconCircle}>
                  <Icon name="sparkles" size={16} color="#fff" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={s.inputIconBtn} onPress={handleOpenVoice}>
                <View style={s.inputIconCircle}>
                  <Icon name="mic" size={16} color="#fff" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.inputIconBtn}
                onPress={handleSubmitInput}
                disabled={!inputText.trim() || isLoading}
              >
                <View
                  style={[s.inputIconCircle, !inputText.trim() && s.inputIconCircleDisabled]}
                >
                  <Icon
                    name="send"
                    size={16}
                    color={inputText.trim() ? "#fff" : "rgba(255,255,255,0.4)"}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <BottomTabBar activeRoute="/(tabs)/assistant" />

      <VoiceRecordingModal
        visible={showVoice}
        onClose={handleCloseVoice}
        onTranscript={handleSend}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // Error Banner
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: "rgba(255,59,48,0.15)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.3)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    gap: 10,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: "#FF6B6B",
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.textPrimary,
  },

  // Greeting
  greetingSection: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 70 : 50,
    paddingBottom: 8,
  },
  greetingTitle: {
    fontFamily: Fonts.black,
    fontSize: 32,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  greetingSub: {
    fontFamily: Fonts.regular,
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },

  // Input Bar
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 120 : 76,
    backgroundColor: "rgba(10,10,20,0.95)",
  },
  inputPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    overflow: "hidden",
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: "#fff",
    height: 36,
  },
  inputActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inputIconBtn: {
    borderRadius: 18,
    overflow: "hidden",
  },
  inputIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  inputIconCircleDisabled: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});
