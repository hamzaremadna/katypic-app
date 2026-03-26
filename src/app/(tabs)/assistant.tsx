import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "@components/ui/Icon";
import { Colors, Gradients } from "@theme/colors";
import { Fonts } from "@theme/typography";
import { BottomTabBar } from "@components/ui";
import { useChatWithCoach, useChatSession } from "@hooks/useChatWithCoach";
import type { ChatMessage } from "@services/api/ai.api";
import { ChatBubbleList } from "@components/assistant/ChatBubble";
import { SuggestionChips } from "@components/assistant/SuggestionChips";
import { VoiceRecordingModal } from "@components/assistant/VoiceInput";
import { hapticLight, hapticMedium } from "../../utils/haptics";

// Message sent when user taps the sparkles button to request a suggestion
const SUGGEST_PROMPT = "Suggère-moi un exercice photo à pratiquer aujourd'hui.";

export default function AssistantScreen() {
  const [sessionId, setSessionId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [showVoice, setShowVoice] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
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

  const isCreatingSession = useRef(false);

  const initSession = useCallback(async () => {
    if (isCreatingSession.current) return;
    isCreatingSession.current = true;
    try {
      setSessionError(null);
      const session = await createSession();
      setSessionId(session.id);
    } catch {
      setSessionError(
        "Impossible de démarrer la session. Vérifiez votre connexion et réessayez.",
      );
    } finally {
      isCreatingSession.current = false;
    }
  }, [createSession]);

  useEffect(() => {
    if (!sessionId) {
      initSession();
    }
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardWillShow", () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener("keyboardWillHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleRetry = useCallback(() => {
    clearError();
    setSessionError(null);
    if (!sessionId) {
      initSession();
    }
  }, [sessionId, clearError, initSession]);

  const pendingMessage = useRef<string | null>(null);

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim() || !sessionId) return;
      const trimmed = text.trim();
      pendingMessage.current = trimmed;
      setInputText("");
      setSelectedQuestion(null);
      sendMutation.mutate(
        { content: trimmed },
        {
          onSuccess: () => { pendingMessage.current = null; },
          onError: () => {
            // Restore message so user doesn't lose it
            if (pendingMessage.current) setInputText(pendingMessage.current);
            pendingMessage.current = null;
          },
        },
      );
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [sessionId, sendMutation],
  );

  const handleQuestionPress = useCallback(
    (index: number, question: string) => {
      hapticLight();
      setSelectedQuestion(index);
      handleSend(question);
    },
    [handleSend],
  );

  // Ask AI for a photo exercise suggestion
  const handleSuggest = useCallback(() => {
    if (isLoading) return;
    handleSend(SUGGEST_PROMPT);
  }, [handleSend, isLoading]);

  // Start a brand-new conversation
  const handleNewSession = useCallback(() => {
    hapticLight();
    Alert.alert(
      "Nouvelle conversation",
      "Effacer la conversation et en démarrer une nouvelle ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Nouveau",
          style: "destructive",
          onPress: () => {
            setSessionId("");
            setInputText("");
            setSelectedQuestion(null);
            clearError();
            setSessionError(null);
            initSession();
          },
        },
      ],
    );
  }, [initSession, clearError]);

  const handleOpenVoice = useCallback(() => { hapticLight(); setShowVoice(true); }, []);
  const handleCloseVoice = useCallback(() => setShowVoice(false), []);

  const handleContentSizeChange = useCallback(() => {
    if (hasMessages) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [hasMessages]);

  const handleSubmitInput = useCallback(() => {
    hapticMedium();
    handleSend(inputText);
  }, [handleSend, inputText]);

  return (
    <View style={s.container}>
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Top header ── */}
      <View style={s.topHeader}>
        <View style={s.topHeaderLeft} />
        <Text style={s.topHeaderTitle}>Coach Photo</Text>
        <TouchableOpacity
          style={s.newSessionBtn}
          onPress={handleNewSession}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="edit" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

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
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          {/* Greeting — shown only before first message */}
          {!hasMessages && (
            <View style={s.greetingSection}>
              <View style={s.coachAvatar}>
                <LinearGradient
                  colors={Gradients.purpleBlue}
                  style={s.coachAvatarGradient}
                >
                  <Icon name="sparkles" size={26} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={s.greetingTitle}>Bonjour !</Text>
              <Text style={s.greetingSub}>Je suis ton coach photo.</Text>
              <Text style={s.greetingHint}>
                Pose-moi n'importe quelle question sur la photo.
              </Text>
            </View>
          )}

          {/* Error Banner */}
          {displayError && (
            <View style={s.errorBanner}>
              <Text style={s.errorText}>{displayError}</Text>
              <TouchableOpacity onPress={handleRetry} style={s.retryButton}>
                <Text style={s.retryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Suggestion Chips — only before first message */}
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
        <View style={[s.inputBar, keyboardVisible && s.inputBarKeyboardOpen]}>
          <View style={s.inputPill}>
            <LinearGradient
              colors={["#5B2FBE", "#3D2E9E", "#2B5FDF"]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            />
            <TextInput
              style={s.textInput}
              placeholder="Pose ta question..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSubmitInput}
              returnKeyType="send"
              multiline={false}
            />

            <View style={s.inputActions}>
              {/* Sparkles → ask AI for a suggestion */}
              <TouchableOpacity
                style={s.inputIconBtn}
                onPress={handleSuggest}
                disabled={isLoading}
              >
                <View
                  style={[
                    s.inputIconCircle,
                    isLoading && s.inputIconCircleDisabled,
                  ]}
                >
                  <Icon
                    name="sparkles"
                    size={16}
                    color={isLoading ? "rgba(255,255,255,0.3)" : "#fff"}
                  />
                </View>
              </TouchableOpacity>

              {/* Mic → voice input */}
              <TouchableOpacity style={s.inputIconBtn} onPress={handleOpenVoice}>
                <View style={s.inputIconCircle}>
                  <Icon name="mic" size={16} color="#fff" />
                </View>
              </TouchableOpacity>

              {/* Send */}
              <TouchableOpacity
                style={s.inputIconBtn}
                onPress={handleSubmitInput}
                disabled={!inputText.trim() || isLoading}
              >
                <View
                  style={[
                    s.inputIconCircle,
                    !inputText.trim() && s.inputIconCircleDisabled,
                  ]}
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

      {!keyboardVisible && <BottomTabBar activeRoute="/(tabs)/assistant" />}

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

  // ── Top header ──────────────────────────────────────────────────────────────
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: 8,
  },
  topHeaderLeft: { width: 36 }, // placeholder to centre the title
  topHeaderTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  newSessionBtn: {
    width: 36,
    height: 36,
    alignItems: "flex-end",
    justifyContent: "center",
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

  // ── Greeting ────────────────────────────────────────────────────────────────
  greetingSection: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 4,
    gap: 6,
  },
  coachAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: "hidden",
    marginBottom: 4,
  },
  coachAvatarGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingTitle: {
    fontFamily: Fonts.black,
    fontSize: 30,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  greetingSub: {
    fontFamily: Fonts.semibold,
    fontSize: 17,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  greetingHint: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },

  // ── Error Banner ─────────────────────────────────────────────────────────────
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

  // ── Input Bar ────────────────────────────────────────────────────────────────
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 120 : 76,
    backgroundColor: "rgba(10,10,20,0.95)",
  },
  inputBarKeyboardOpen: {
    paddingBottom: 12,
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
