import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Colors, Gradients } from "../../theme/colors";
import { BottomTabBar } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";
import { TourOverlay } from "../../components/tour/TourOverlay";
import { TOUR_CAMERA } from "../../data/tours";
import { useTourStore } from "../../stores/tourStore";
import { AssistantModeModal } from "../../components/camera/AssistantModeModal";
import { AiTipOverlay } from "../../components/camera/AiTipOverlay";
import type { AssistantMode } from "../../components/camera/AssistantModeModal";
import { aiApi } from "../../services/api/ai.api";
import { readAsStringAsync, deleteAsync } from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const { width, height } = Dimensions.get("window");

// ─────────────────────────────────────────────
// Permission Request Screen
// ─────────────────────────────────────────────
function PermissionScreen({ onRequest }: { onRequest: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={perm.container}>
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View
        style={[
          perm.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={perm.iconContainer}>
          <LinearGradient colors={Gradients.brand} style={perm.iconCircle}>
            <Icon name="camera" size={40} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <Text style={perm.title}>Accès Caméra</Text>
        <Text style={perm.subtitle}>
          KaytiPic a besoin d'accéder à votre caméra pour prendre des photos et
          les analyser avec notre IA.
        </Text>
        <TouchableOpacity
          onPress={onRequest}
          activeOpacity={0.85}
          style={perm.btnWrapper}
        >
          <LinearGradient
            colors={Gradients.brand}
            style={perm.btn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={perm.btnText}>Autoriser l'accès</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={perm.hint}>
          Vous pouvez modifier cette autorisation dans les réglages.
        </Text>
      </Animated.View>
    </View>
  );
}

const perm = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  iconContainer: {
    marginBottom: 8,
    shadowColor: Colors.gradientPink,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  btnWrapper: {
    borderRadius: 50,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: Colors.gradientPink,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
    alignItems: "center",
  },
  btnText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  hint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
});

// ─────────────────────────────────────────────
// Grid Overlay
// ─────────────────────────────────────────────
function GridOverlay() {
  return (
    <View style={grid.container} pointerEvents="none">
      {/* Vertical lines */}
      <View style={[grid.lineVertical, { left: "33.33%" }]} />
      <View style={[grid.lineVertical, { left: "66.66%" }]} />
      {/* Horizontal lines */}
      <View style={[grid.lineHorizontal, { top: "33.33%" }]} />
      <View style={[grid.lineHorizontal, { top: "66.66%" }]} />
    </View>
  );
}

const grid = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  lineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  lineHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});

// ─────────────────────────────────────────────
// Camera Mode Options
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Main Camera Screen
// ─────────────────────────────────────────────
export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [isProMode, setIsProMode] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // ── Tour ──────────────────────────────────────────────
  const { markSeen, load } = useTourStore();
  const [showTour, setShowTour] = useState(false);
  useEffect(() => {
    load().then(() => {
      if (!useTourStore.getState().hasSeen("camera")) {
        setTimeout(() => setShowTour(true), 1000);
      }
    });
  }, []);

  // ── AI Assistant ───────────────────────────────────────
  const [showModeModal, setShowModeModal] = useState(false);
  const [assistantActive, setAssistantActive] = useState(false);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("text");
  const [assistantIntensity, setAssistantIntensity] = useState(60);
  const [currentTip, setCurrentTip] = useState<{ tip: string; category: string; alert?: string } | null>(null);
  const [showTipOverlay, setShowTipOverlay] = useState(false);
  const tipIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** intensity 20–100 → poll interval 30s–8s */
  const intensityToMs = (intensity: number) =>
    Math.round(30000 - ((intensity - 20) / 80) * 22000);

  const FALLBACK_TIPS = [
    { alert: "Sous-exposition", tip: "La scène est trop sombre — cherchez plus de lumière ou activez le flash.", category: "lumiere" },
    { alert: "Horizon penché", tip: "Inclinez légèrement votre téléphone pour redresser l'horizon.", category: "technique" },
    { alert: "Sujet trop loin", tip: "Faites deux pas vers votre sujet pour remplir davantage le cadre.", category: "composition" },
    { alert: "Contre-jour", tip: "Repositionnez-vous pour avoir la source de lumière dans le dos.", category: "lumiere" },
    { alert: "Cadrage déséquilibré", tip: "Déplacez votre sujet vers une intersection des lignes du tiers.", category: "composition" },
    { alert: "Belle lumière ✓", tip: "La lumière est bonne — essayez simplement de varier votre angle.", category: "lumiere" },
  ];

  const fetchTip = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      // Capture frame (skipProcessing: false ensures JPEG, not HEIC on iOS)
      const frame = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      if (!frame?.uri) return;

      // Resize to max 512px wide at quality 0.6 — reduces payload from ~3MB to ~40KB
      // This cuts latency from 3–5s to ~1s and reduces Gemini token cost 10x
      const resized = await manipulateAsync(
        frame.uri,
        [{ resize: { width: 512 } }],
        { compress: 0.6, format: SaveFormat.JPEG }
      );

      // Cleanup original full-size frame immediately
      deleteAsync(frame.uri, { idempotent: true }).catch(() => {});

      // Read resized image as base64
      const base64 = await readAsStringAsync(resized.uri, { encoding: "base64" });
      deleteAsync(resized.uri, { idempotent: true }).catch(() => {});

      const response = await aiApi.getCameraTip(base64, "image/jpeg");
      setCurrentTip(response.data);
      setShowTipOverlay(true);
    } catch {
      // API down or capture failed — show a local fallback tip so user always gets something
      const fallback = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
      setCurrentTip(fallback);
      setShowTipOverlay(true);
    }
  }, []);

  const startAssistant = useCallback(
    (mode: AssistantMode, intensity: number) => {
      setAssistantMode(mode);
      setAssistantIntensity(intensity);
      setAssistantActive(true);
      setShowModeModal(false);

      // Fetch first tip immediately, then poll
      fetchTip();
      const ms = intensityToMs(intensity);
      tipIntervalRef.current = setInterval(fetchTip, ms);
    },
    [fetchTip],
  );

  const stopAssistant = useCallback(() => {
    if (tipIntervalRef.current) {
      clearInterval(tipIntervalRef.current);
      tipIntervalRef.current = null;
    }
    setAssistantActive(false);
    setShowTipOverlay(false);
    setCurrentTip(null);
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current);
    };
  }, []);

  // Capture button animation
  const captureScale = useRef(new Animated.Value(1)).current;
  const captureOpacity = useRef(new Animated.Value(1)).current;

  const handleCapture = useCallback(async () => {
    if (isCapturing || !cameraRef.current) return;
    setIsCapturing(true);

    // Animate capture button
    Animated.sequence([
      Animated.parallel([
        Animated.spring(captureScale, {
          toValue: 0.85,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(captureOpacity, {
          toValue: 0.7,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(captureScale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(captureOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      if (photo) {
        // Navigate to analysis result
        router.push({
          pathname: "/analyse/result",
          params: { photoUri: photo.uri },
        });
      }
    } catch (error) {
      console.warn("Erreur de capture:", error);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, router]);

  const toggleFlash = useCallback(() => {
    setFlashEnabled((prev) => !prev);
  }, []);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGrid((prev) => !prev);
  }, []);

  // ─── Permission not yet determined ───
  if (!permission) {
    return (
      <View style={s.container}>
        <LinearGradient
          colors={["#0E0A24", "#080814"]}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color={Colors.gradientPink} />
      </View>
    );
  }

  // ─── Permission denied ───
  if (!permission.granted) {
    return <PermissionScreen onRequest={requestPermission} />;
  }

  // ─── Camera active ───
  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* Camera Viewfinder */}
      <CameraView
        ref={cameraRef}
        style={s.camera}
        facing={facing}
        flash={flashEnabled ? "on" : "off"}
      >
        {/* Grid overlay */}
        {showGrid && <GridOverlay />}

        {/* Top Bar */}
        <View style={s.topBar}>
          <LinearGradient
            colors={["rgba(10,10,20,0.7)", "transparent"]}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Assistant Magique Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={s.assistantBtnWrapper}
            onPress={() => assistantActive ? stopAssistant() : setShowModeModal(true)}
          >
            <LinearGradient
              colors={assistantActive
                ? ["rgba(233,30,140,0.4)", "rgba(123,47,190,0.4)"]
                : [Colors.gradientPink, Colors.gradientPurple]}
              style={s.assistantBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="sparkles" size={14} color="#FFFFFF" />
              <Text style={s.assistantText}>
                {assistantActive ? "Désactiver" : "Assistant magique"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Flip Camera */}
          <TouchableOpacity
            onPress={toggleFacing}
            style={s.topBtn}
            activeOpacity={0.7}
          >
            <View style={s.topBtnBg}>
              <Icon name="switch-horizontal" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Flip Camera */}
          <TouchableOpacity
            onPress={toggleGrid}
            style={s.topBtn}
            activeOpacity={0.7}
          >
            <View style={s.topBtnBg}>
              <Icon name="grid" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          {/* Flash toggle */}
          <TouchableOpacity
            onPress={toggleFlash}
            style={s.topBtn}
            activeOpacity={0.7}
          >
            <View style={[s.topBtnBg, flashEnabled && s.topBtnBgActive]}>
              <Icon
                name={flashEnabled ? "flash" : "flash-off"}
                size={18}
                color="#FFFFFF"
              />
              {flashEnabled && <View style={s.activeIndicator} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Pro / Simple mode toggle
        <View style={s.modeToggleRow}>
          <TouchableOpacity
            onPress={() => setIsProMode(true)}
            style={[s.modeToggleBtn, isProMode && s.modeToggleBtnActive]}
            activeOpacity={0.7}
          >
            <Text
              style={[s.modeToggleText, isProMode && s.modeToggleTextActive]}
            >
              Pro
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsProMode(false)}
            style={[s.modeToggleBtn, !isProMode && s.modeToggleBtnActive]}
            activeOpacity={0.7}
          >
            <Text
              style={[s.modeToggleText, !isProMode && s.modeToggleTextActive]}
            >
              Simple
            </Text>
          </TouchableOpacity>
        </View> */}

        {/* Bottom Controls Overlay */}
        <View style={s.bottomOverlay}>
          <LinearGradient
            colors={[
              "transparent",
              "rgba(10,10,20,0.85)",
              "rgba(10,10,20,0.95)",
            ]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Capture Row */}
          <View style={s.captureRow}>
            {/* Galerie label */}
            <TouchableOpacity
              style={s.sideLabel}
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/gallery")}
            >
              <Text style={s.sideLabelText}>Galerie</Text>
            </TouchableOpacity>

            {/* Gradient shutter button */}
            <TouchableOpacity
              onPress={handleCapture}
              activeOpacity={0.9}
              disabled={isCapturing}
            >
              <Animated.View
                style={[
                  s.shutterShadow,
                  {
                    transform: [{ scale: captureScale }],
                    opacity: captureOpacity,
                  },
                ]}
              >
                <LinearGradient
                  colors={["#D8073E", "#1F5EDA"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.shutterBtn}
                >
                  {isCapturing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Icon name="camera" size={26} color="#FFFFFF" />
                  )}
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>

            {/* Simple / Pro label */}
            <TouchableOpacity
              style={s.sideLabel}
              activeOpacity={0.7}
              onPress={() => setIsProMode((prev) => !prev)}
            >
              <Text style={s.sideLabelText}>
                {isProMode ? "Pro" : "Simple"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* AI Tip Overlay — inside CameraView so it floats over the viewfinder */}
        {showTipOverlay && currentTip && (
          <AiTipOverlay
            tip={currentTip.tip}
            alert={currentTip.alert}
            category={currentTip.category}
            mode={assistantMode}
            onClose={() => setShowTipOverlay(false)}
            onListen={() => {/* TTS deferred — requires expo-speech rebuild */}}
          />
        )}
      </CameraView>

      {/* <BottomTabBar activeRoute="/(tabs)/camera" /> */}

      {/* ── Guided Tour ── */}
      <TourOverlay
        steps={TOUR_CAMERA}
        tourTitle="Prise de photo"
        visible={showTour}
        onFinish={() => {
          setShowTour(false);
          markSeen("camera");
        }}
      />

      {/* ── Assistant Mode Modal ── */}
      <AssistantModeModal
        visible={showModeModal}
        onClose={() => setShowModeModal(false)}
        onConfirm={startAssistant}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },

  // ─── Top Bar ───
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: 16,
  },
  topBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  topBtnBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(10,10,20,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  topBtnBgActive: {
    backgroundColor: "rgba(233,30,140,0.25)",
    borderColor: Colors.accentPink,
  },
  activeIndicator: {
    position: "absolute",
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentPink,
  },

  // ─── Assistant Magique Button ───
  assistantBtnWrapper: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: Colors.gradientPink,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  assistantBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    gap: 6,
  },
  assistantText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },

  // ─── Pro / Simple Toggle ───
  modeToggleRow: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "rgba(10,10,20,0.5)",
    borderRadius: 20,
    padding: 3,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modeToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 17,
  },
  modeToggleBtnActive: {
    backgroundColor: "rgba(123,47,190,0.4)",
  },
  modeToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  modeToggleTextActive: {
    color: Colors.textPrimary,
  },

  // ─── Bottom Overlay ───
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === "ios" ? 50 : 30,
    paddingTop: 40,
  },

  // ─── Capture Row ───
  captureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },

  // Side labels (Galerie / Pro·Simple)
  sideLabel: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  sideLabelText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  // Gradient shutter button
  shutterShadow: {
    width: 70,
    height: 70,
    borderRadius: 35,
    shadowColor: "#5717A6",
    shadowOpacity: 0.9,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  shutterBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
