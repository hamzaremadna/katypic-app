import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Colors, Gradients } from "../../theme/colors";
import { Icon } from "../../components/ui/Icon";

const { width, height } = Dimensions.get("window");

const ADJUSTMENTS = [
  { icon: "sun" as const, label: "Exposition", value: 0 },
  { icon: "sun" as const, label: "Luminosité", value: 0, active: true },
  { icon: "sliders" as const, label: "Contraste", value: 0 },
];

// Assistant magique modal - choice between écrit and oral
function AssistantModal({
  visible,
  onClose,
  onChoose,
}: {
  visible: boolean;
  onClose: () => void;
  onChoose: (mode: "ecrit" | "oral") => void;
}) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[am.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
        />
        <Animated.View
          style={[am.card, { transform: [{ translateY: slideAnim }] }]}
        >
          <LinearGradient
            colors={["rgba(40,20,100,0.97)", "rgba(20,10,60,0.99)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity style={am.closeBtn} onPress={onClose}>
            <Icon name="x" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={am.titleRow}>
            <Icon name="sparkles" size={18} color={Colors.accentPink} />
            <Text style={am.title}>Assistant MAGIQUE</Text>
          </View>
          <Text style={am.subtitle}>
            Choisissez comment vous souhaitez{"\n"}recevoir l'aide de l'IA :
          </Text>

          <TouchableOpacity
            style={am.ecritBtn}
            onPress={() => onChoose("ecrit")}
            activeOpacity={0.85}
          >
            <View style={am.ecritBtnInner}>
              <Text style={am.ecritIcon}>▣</Text>
              <Text style={am.ecritText}>Aide à l'écrit</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={am.oralBtn}
            onPress={() => onChoose("oral")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Gradients.redPink}
              style={am.oralBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="mic" size={16} color="#fff" />
              <Text style={am.oralText}>Aide à l'oral</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const am = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,8,20,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    padding: 24,
    gap: 16,
    shadowColor: Colors.gradientPurple,
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  closeIcon: { color: Colors.textSecondary, fontSize: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  titleIcon: { color: Colors.accentPink, fontSize: 18 },
  title: { fontSize: 18, fontWeight: "900", color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  ecritBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  ecritBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
  },
  ecritIcon: { fontSize: 16, color: Colors.bgDeep },
  ecritText: { color: Colors.bgDeep, fontSize: 15, fontWeight: "700" },
  oralBtn: { borderRadius: 12, overflow: "hidden" },
  oralBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
  },
  oralIcon: { fontSize: 16 },
  oralText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

// AI suggestion overlay (Aide à l'écrit result)
function EcritSuggestion({
  visible,
  onClose,
  onNew,
}: {
  visible: boolean;
  onClose: () => void;
  onNew: () => void;
}) {
  if (!visible) return null;
  return (
    <View style={sug.overlay}>
      <LinearGradient
        colors={["rgba(30,10,80,0.95)", "rgba(15,5,50,0.97)"]}
        style={StyleSheet.absoluteFillObject}
      />
      <TouchableOpacity style={sug.closeBtn} onPress={onClose}>
        <Icon name="x" size={14} color={Colors.textSecondary} />
      </TouchableOpacity>
      <View style={sug.titleRow}>
        <Icon name="sparkles" size={16} color={Colors.accentPink} />
        <Text style={sug.title}>Aide à l'écrit ...</Text>
      </View>
      <View style={sug.suggestionCard}>
        <LinearGradient
          colors={["rgba(60,30,140,0.9)", "rgba(40,20,100,0.95)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={sug.suggestionIcon}>T</Text>
        <View>
          <Text style={sug.suggestionLabel}>Suggestion de l'IA</Text>
          <Text style={sug.suggestionText}>
            La composition n'est pas harmonieuse,{"\n"}corrigez !
          </Text>
        </View>
      </View>
      <TouchableOpacity style={sug.newBtn} onPress={onNew}>
        <Text style={sug.newBtnText}>Nouvelle suggestion</Text>
      </TouchableOpacity>
    </View>
  );
}

// AI oral suggestion overlay
function OralSuggestion({
  visible,
  onClose,
  onNew,
}: {
  visible: boolean;
  onClose: () => void;
  onNew: () => void;
}) {
  if (!visible) return null;
  return (
    <View style={sug.overlay}>
      <LinearGradient
        colors={["rgba(30,10,80,0.95)", "rgba(15,5,50,0.97)"]}
        style={StyleSheet.absoluteFillObject}
      />
      <TouchableOpacity style={sug.closeBtn} onPress={onClose}>
        <Icon name="x" size={14} color={Colors.textSecondary} />
      </TouchableOpacity>
      <View style={sug.titleRow}>
        <Icon name="sparkles" size={16} color={Colors.accentPink} />
        <Text style={sug.title}>Aide à l'oral ...</Text>
      </View>
      <View style={[sug.suggestionCard, { gap: 10 }]}>
        <LinearGradient
          colors={["rgba(60,30,140,0.9)", "rgba(40,20,100,0.95)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={sug.oralHeader}>
          <Icon name="mic" size={16} color="#fff" />
          <Text style={sug.suggestionLabel}>L'IA vous parle ....</Text>
        </View>
        <Text style={sug.suggestionText}>
          Ajustez la luminosité pour un rendu plus{"\n"}éclatant
        </Text>
        <TouchableOpacity style={sug.stopBtn}>
          <LinearGradient
            colors={Gradients.purpleBlue}
            style={sug.stopBtnGradient}
          >
            <Text style={sug.stopIcon}>⏹</Text>
            <Text style={sug.stopText}>Arrêter</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={sug.newBtn} onPress={onNew}>
        <Text style={sug.newBtnText}>Nouvelle suggestion</Text>
      </TouchableOpacity>
    </View>
  );
}

const sug = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    borderRadius: 20,
    overflow: "hidden",
    padding: 20,
    gap: 12,
    shadowColor: Colors.gradientPurple,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 5,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: { color: Colors.textSecondary, fontSize: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  titleIcon: { color: Colors.accentPink, fontSize: 16 },
  title: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary },
  suggestionCard: {
    borderRadius: 12,
    overflow: "hidden",
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  suggestionIcon: {
    fontSize: 18,
    color: Colors.accentBlue,
    fontWeight: "700",
    width: 24,
    textAlign: "center",
  },
  suggestionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  oralHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  oralMic: { fontSize: 16 },
  stopBtn: { borderRadius: 20, overflow: "hidden", alignSelf: "flex-start" },
  stopBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  stopIcon: { color: "#fff", fontSize: 12 },
  stopText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  newBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 10,
  },
  newBtnText: { color: Colors.textPrimary, fontSize: 14, fontWeight: "600" },
});

export default function CameraViewScreen() {
  const router = useRouter();
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [assistantMode, setAssistantMode] = useState<"none" | "ecrit" | "oral">(
    "none"
  );
  const [activeAdj, setActiveAdj] = useState(1);

  const handleChooseMode = (mode: "ecrit" | "oral") => {
    setShowAssistantModal(false);
    setAssistantMode(mode);
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" hidden />

      {/* Full-screen photo */}
      <View style={s.photoArea}>
        <LinearGradient
          colors={["#87CEEB", "#4A9FCC", "#2D7FA0"]}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Photo subject silhouette */}
        <LinearGradient
          colors={["transparent", "rgba(40,20,10,0.3)", "rgba(20,10,5,0.4)"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Top controls */}
        <View style={s.topControls}>
          <TouchableOpacity
            style={s.assistantBtn}
            onPress={() => setShowAssistantModal(true)}
          >
            <LinearGradient
              colors={Gradients.purpleBlue}
              style={s.assistantBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="sparkles" size={14} color="#fff" />
              <Text style={s.assistantText}>Assistant magique</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={s.topRight}>
            <TouchableOpacity style={s.iconBtn}>
              <Icon name="grid" size={16} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.iconBtn, s.iconBtnRed]}>
              <Icon name="zap" size={16} color={Colors.accentRed} />
            </TouchableOpacity>
          </View>
        </View>

        {/* AI suggestion overlays */}
        {assistantMode === "ecrit" && (
          <EcritSuggestion
            visible
            onClose={() => setAssistantMode("none")}
            onNew={() => {}}
          />
        )}
        {assistantMode === "oral" && (
          <OralSuggestion
            visible
            onClose={() => setAssistantMode("none")}
            onNew={() => {}}
          />
        )}
      </View>

      {/* Bottom controls */}
      <View style={s.bottomControls}>
        {/* Adjustment sliders */}
        <View style={s.adjustRow}>
          {ADJUSTMENTS.map((adj, i) => (
            <TouchableOpacity
              key={adj.label}
              style={[s.adjItem, activeAdj === i && s.adjItemActive]}
              onPress={() => setActiveAdj(i)}
            >
              <View
                style={[
                  s.adjIconWrapper,
                  activeAdj === i && s.adjIconWrapperActive,
                ]}
              >
                <LinearGradient
                  colors={
                    activeAdj === i
                      ? Gradients.purpleBlue
                      : ["transparent", "transparent"]
                  }
                  style={StyleSheet.absoluteFillObject}
                />
                <Icon name={adj.icon} size={20} color={Colors.textPrimary} />
              </View>
              <Text style={s.adjValue}>{adj.value}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Camera controls row */}
        <View style={s.cameraRow}>
          <TouchableOpacity style={s.sideBtn}>
            <Icon name="image" size={22} color={Colors.textPrimary} />
            <Text style={s.sideBtnLabel}>Gallerie</Text>
          </TouchableOpacity>

          {/* Main capture button */}
          <TouchableOpacity style={s.captureBtn}>
            <LinearGradient
              colors={Gradients.brand}
              style={s.captureBtnGradient}
            >
              <View style={s.captureBtnInner} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.sideBtn}
            onPress={() => router.push("/analyse/import")}
          >
            <Icon name="camera" size={22} color={Colors.textPrimary} />
            <Text style={s.sideBtnLabel}>Simple</Text>
          </TouchableOpacity>
        </View>
      </View>

      <AssistantModal
        visible={showAssistantModal}
        onClose={() => setShowAssistantModal(false)}
        onChoose={handleChooseMode}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  photoArea: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },

  // Top controls
  topControls: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 36,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  assistantBtn: { borderRadius: 20, overflow: "hidden" },
  assistantBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  assistantIcon: { color: "#fff", fontSize: 14 },
  assistantText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  topRight: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(20,20,40,0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconBtnRed: { borderColor: "rgba(255,59,48,0.3)" },
  iconBtnText: { fontSize: 16, color: Colors.textPrimary },

  // Bottom
  bottomControls: {
    backgroundColor: "#000",
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    gap: 16,
  },

  adjustRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    paddingHorizontal: 20,
  },
  adjItem: { alignItems: "center", gap: 6 },
  adjItemActive: {},
  adjIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(40,40,60,0.6)",
    overflow: "hidden",
    position: "relative",
  },
  adjIconWrapperActive: {},
  adjIcon: { fontSize: 20, color: Colors.textPrimary },
  adjValue: { fontSize: 13, color: Colors.textSecondary, fontWeight: "600" },

  cameraRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    paddingHorizontal: 20,
  },
  sideBtn: { alignItems: "center", gap: 6, width: 60 },
  sideBtnIcon: { fontSize: 22 },
  sideBtnLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },

  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    shadowColor: Colors.gradientPink,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  captureBtnGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtnInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
});
