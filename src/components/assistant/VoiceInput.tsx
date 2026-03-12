import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "@components/ui/Icon";
import { Colors, Gradients } from "@theme/colors";
import { Fonts } from "@theme/typography";
import { requireOptionalNativeModule, EventEmitter } from "expo-modules-core";

// ─── Safe speech recognition access ──────────────────────
const SpeechNativeModule = requireOptionalNativeModule("ExpoSpeechRecognition");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const speechEmitter = SpeechNativeModule
  ? (new EventEmitter(SpeechNativeModule as never) as never)
  : null;

const SpeechRecognition = SpeechNativeModule
  ? {
      isAvailable: true as const,
      requestPermissionsAsync: SpeechNativeModule.requestPermissionsAsync as () => Promise<{
        granted: boolean;
      }>,
      start: SpeechNativeModule.start as (opts: {
        lang: string;
        interimResults: boolean;
        continuous: boolean;
      }) => void,
      stop: () => (SpeechNativeModule.stop as () => void)(),
      abort: () => (SpeechNativeModule.abort as () => void)(),
    }
  : { isAvailable: false as const };

const { width: SW } = Dimensions.get("window");

// ─── Voice Recording Inner (mounted only when visible) ───
function VoiceRecordingInner({
  onClose,
  onTranscript,
}: {
  onClose: () => void;
  onTranscript: (text: string) => void;
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [moduleAvailable, setModuleAvailable] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!SpeechRecognition.isAvailable || !speechEmitter) {
      setModuleAvailable(false);
      setErrorMsg(
        "Reconnaissance vocale indisponible. Recompilez l'app (npx expo run:ios).",
      );
      return;
    }

    // EventEmitter type is incomplete for optional native modules — cast to expected interface
    const emitter = speechEmitter as { addListener: (event: string, cb: (...args: never[]) => void) => { remove: () => void } };
    const startSub = emitter.addListener("start", () => {
      setIsListening(true);
      setErrorMsg(null);
    });
    const endSub = emitter.addListener("end", () => {
      setIsListening(false);
    });
    const resultSub = emitter.addListener(
      "result",
      (event: { results: Array<{ transcript: string }> }) => {
        const text = event.results?.[0]?.transcript ?? "";
        setTranscript(text);
      },
    );
    const errorSub = emitter.addListener("error", (event: { error: string }) => {
      setIsListening(false);
      const code = event.error;
      if (code === "no-speech") {
        setErrorMsg("Aucune voix détectée. Réessayez.");
      } else if (code === "not-allowed" || code === "service-not-allowed") {
        setErrorMsg("Permission micro ou reconnaissance vocale refusée.");
      } else if (code === "network") {
        setErrorMsg("Erreur réseau. Vérifiez votre connexion.");
      } else {
        setErrorMsg("Erreur de reconnaissance vocale.");
      }
    });

    return () => {
      startSub.remove();
      endSub.remove();
      resultSub.remove();
      errorSub.remove();
      try {
        SpeechRecognition.abort();
      } catch {
        // ignore cleanup errors
      }
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();

      const dotLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(dotOpacity, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      dotLoop.start();

      return () => {
        loop.stop();
        dotLoop.stop();
        pulseAnim.setValue(1);
        dotOpacity.setValue(1);
      };
    }
  }, [isListening, pulseAnim, dotOpacity]);

  const startListening = useCallback(async () => {
    if (!SpeechRecognition.isAvailable) {
      setErrorMsg("Reconnaissance vocale indisponible. Recompilez l'app.");
      return;
    }
    try {
      const perms = await SpeechRecognition.requestPermissionsAsync();
      if (!perms.granted) {
        setErrorMsg("Permission micro ou reconnaissance vocale refusée.");
        return;
      }
      setTranscript("");
      setErrorMsg(null);
      SpeechRecognition.start({
        lang: "fr-FR",
        interimResults: true,
        continuous: false,
      });
    } catch (err) {
      console.warn("[SpeechRecognition] start error:", err);
      setErrorMsg("Impossible de démarrer la reconnaissance vocale.");
    }
  }, []);

  useEffect(() => {
    if (moduleAvailable) {
      const t = setTimeout(() => startListening(), 300);
      return () => clearTimeout(t);
    }
  }, [moduleAvailable, startListening]);

  const handleStop = () => {
    if (isListening && SpeechRecognition.isAvailable) {
      SpeechRecognition.stop();
    }
  };

  const handleSend = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      setTranscript("");
      onClose();
    }
  };

  const handleCancel = () => {
    if (SpeechRecognition.isAvailable) {
      try {
        SpeechRecognition.abort();
      } catch {
        // ignore
      }
    }
    setTranscript("");
    onClose();
  };

  return (
    <View style={vm.overlay}>
      <TouchableOpacity style={vm.overlayTouch} activeOpacity={1} onPress={handleCancel} />

      <View style={vm.cardOuter}>
        <LinearGradient
          colors={["rgba(123,47,190,0.3)", "rgba(43,127,255,0.15)", "rgba(123,47,190,0.1)"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={vm.card}>
          <TouchableOpacity onPress={isListening ? handleStop : startListening} activeOpacity={0.85}>
            <Animated.View style={[vm.micSection, { transform: [{ scale: pulseAnim }] }]}>
              <View style={[vm.micRingOuter, isListening && vm.micRingOuterActive]} />
              <View style={vm.micRingMiddle} />
              <LinearGradient
                colors={
                  isListening
                    ? ["#E91E8C", "#9B59B6", "#5B3FDE"]
                    : ["#9B59B6", "#7B2FBE", "#5B3FDE"]
                }
                style={vm.micCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="mic" size={36} color="#fff" />
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          <Text style={vm.listenTitle}>
            {isListening ? "Je vous écoute..." : transcript ? "Votre message" : "Appuyez pour parler"}
          </Text>
          <Text style={vm.listenSub}>
            {isListening
              ? "Parlez maintenant"
              : transcript
                ? ""
                : "Touchez le micro pour commencer"}
          </Text>

          <View style={vm.playbackArea}>
            {errorMsg ? (
              <Text style={vm.errorText}>{errorMsg}</Text>
            ) : transcript ? (
              <Text style={vm.transcriptText}>{transcript}</Text>
            ) : (
              <>
                <Icon name="volume" size={22} color={Colors.textMuted} />
                <Text style={vm.playbackText}>En attente...</Text>
              </>
            )}
          </View>

          {isListening ? (
            <View style={vm.recordingRow}>
              <Animated.View style={[vm.recordingDot, { opacity: dotOpacity }]} />
              <Text style={vm.recordingText}>Enregistrement</Text>
            </View>
          ) : (
            <View style={vm.actionRow}>
              <TouchableOpacity style={vm.actionBtn} onPress={startListening}>
                <Icon name="refresh" size={18} color={Colors.textPrimary} />
                <Text style={vm.actionBtnText}>Réessayer</Text>
              </TouchableOpacity>
              {transcript.trim() ? (
                <TouchableOpacity style={vm.sendBtn} onPress={handleSend} activeOpacity={0.85}>
                  <LinearGradient
                    colors={Gradients.brand}
                    style={vm.sendBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Icon name="send" size={16} color="#fff" />
                    <Text style={vm.sendBtnText}>Envoyer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={vm.overlayTouchBottom} activeOpacity={1} onPress={handleCancel} />
    </View>
  );
}

export function VoiceRecordingModal({
  visible,
  onClose,
  onTranscript,
}: {
  visible: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {visible && <VoiceRecordingInner onClose={onClose} onTranscript={onTranscript} />}
    </Modal>
  );
}

const vm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayTouch: { flex: 1, width: "100%" },
  overlayTouchBottom: { flex: 1, width: "100%" },
  cardOuter: {
    width: SW - 48,
    borderRadius: 26,
    padding: 1.5,
    overflow: "hidden",
  },
  card: {
    backgroundColor: "#141428",
    borderRadius: 24,
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 28,
    paddingHorizontal: 24,
    gap: 14,
  },
  micSection: {
    alignItems: "center",
    justifyContent: "center",
    width: 140,
    height: 140,
    marginBottom: 4,
  },
  micRingOuter: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(123,47,190,0.08)",
  },
  micRingOuterActive: {
    backgroundColor: "rgba(233,30,140,0.12)",
  },
  micRingMiddle: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(123,47,190,0.15)",
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#9B59B6",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  listenTitle: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Colors.textPrimary,
    marginTop: 4,
    textAlign: "center",
  },
  listenSub: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: -4,
    textAlign: "center",
    minHeight: 18,
  },
  playbackArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginTop: 4,
    minHeight: 80,
  },
  playbackText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
  },
  transcriptText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 24,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: "#FF6B6B",
    textAlign: "center",
  },
  recordingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  recordingText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: "#FF6B6B",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  actionBtnText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  sendBtn: {
    borderRadius: 20,
    overflow: "hidden",
  },
  sendBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: "#fff",
  },
});
