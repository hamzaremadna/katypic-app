import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  Image,
  Alert,
  ActivityIndicator,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import ViewShot from "react-native-view-shot";
import {
  Brightness,
  Contrast,
  Saturate,
} from "react-native-color-matrix-image-filters";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { KaytiHeader } from "../../components/ui";
import { Icon, IconName } from "../../components/ui/Icon";
import { aiApi } from "../../services/api/ai.api";
import { hapticLight, hapticMedium } from "../../utils/haptics";

const { width } = Dimensions.get("window");

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type TabKey = "ajuster" | "recadrer";
type ScreenMode = "edit" | "saved";

interface PresetDef {
  key: string;
  label: string;
  icon: IconName;
  values: Record<string, number>;
}

interface AdjustmentSlider {
  key: string;
  label: string;
  min: number;
  max: number;
  defaultValue: number;
}

interface AspectRatio {
  key: string;
  label: string;
  sublabel: string;
  icon: IconName;
  ratio: number | null;
}

interface AISuggestion {
  label: string;
  detail: string;
  icon: IconName;
  adjustmentKey: string;
  adjustmentValue: number;
}

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────
const PRESETS: PresetDef[] = [
  { key: "lumineux", label: "Lumineux", icon: "sun", values: { exposition: 30, luminosite: 20, tons_clairs: 15, ombres: 10 } },
  { key: "contraste", label: "Contraste", icon: "sliders", values: { contraste: 40, point_noir: 15, tons_clairs: -10 } },
  { key: "chaud", label: "Chaud", icon: "zap", values: { saturation: 20, luminosite: 10, exposition: 5 } },
  { key: "froid", label: "Froid", icon: "moon", values: { saturation: -15, contraste: 10, luminosite: -5 } },
  { key: "dramatique", label: "Dramatique", icon: "target", values: { contraste: 50, point_noir: 25, ombres: -20, saturation: -10 } },
  { key: "vibrant", label: "Vibrant", icon: "sparkles", values: { saturation: 40, contraste: 15, luminosite: 10 } },
];

const ADJUSTMENTS: AdjustmentSlider[] = [
  { key: "exposition", label: "Exposition", min: -100, max: 100, defaultValue: 0 },
  { key: "contraste", label: "Contraste", min: -100, max: 100, defaultValue: 0 },
  { key: "saturation", label: "Saturation", min: -100, max: 100, defaultValue: 0 },
  { key: "luminosite", label: "Luminosité", min: -100, max: 100, defaultValue: 0 },
  { key: "brillance", label: "Brillance", min: -100, max: 100, defaultValue: 0 },
  { key: "tons_clairs", label: "Tons clairs", min: -100, max: 100, defaultValue: 0 },
  { key: "ombres", label: "Ombres", min: -100, max: 100, defaultValue: 0 },
  { key: "point_noir", label: "Point noir", min: 0, max: 100, defaultValue: 0 },
];

const ASPECT_RATIOS: AspectRatio[] = [
  { key: "original", label: "Original", sublabel: "", icon: "maximize", ratio: null },
  { key: "1:1", label: "1:1", sublabel: "Carré", icon: "image", ratio: 1 },
  { key: "4:3", label: "4:3", sublabel: "Photo", icon: "image", ratio: 4 / 3 },
  { key: "16:9", label: "16:9", sublabel: "Large", icon: "image", ratio: 16 / 9 },
  { key: "9:16", label: "9:16", sublabel: "Story", icon: "image", ratio: 9 / 16 },
  { key: "3:4", label: "3:4", sublabel: "Portrait", icon: "image", ratio: 3 / 4 },
];

// ─────────────────────────────────────────────
// Custom Slider
// ─────────────────────────────────────────────
function CustomSlider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const sliderRef = useRef<View>(null);
  const range = max - min;
  const percentage = ((value - min) / range) * 100;
  const displayValue = value > 0 ? `+${value}` : `${value}`;

  const handleTouch = useCallback(
    (pageX: number) => {
      sliderRef.current?.measure((_x, _y, w, _h, px) => {
        const rel = Math.max(0, Math.min(pageX - px, w));
        onChange(Math.round(min + (rel / w) * range));
      });
    },
    [min, range, onChange]
  );

  return (
    <View style={sl.container}>
      <View style={sl.labelRow}>
        <Text style={sl.label}>{label}</Text>
        <Text style={sl.value}>{displayValue}</Text>
      </View>
      <View
        ref={sliderRef}
        style={sl.track}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => handleTouch(e.nativeEvent.pageX)}
        onResponderMove={(e) => handleTouch(e.nativeEvent.pageX)}
      >
        <View style={sl.trackBg} />
        {min < 0 && <View style={sl.centerLine} />}
        {min < 0 ? (
          <View style={[sl.fill, value >= 0 ? { left: "50%", width: `${percentage - 50}%` } : { left: `${percentage}%`, width: `${50 - percentage}%` }]}>
            <LinearGradient colors={Gradients.brand} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          </View>
        ) : (
          <View style={[sl.fill, { left: 0, width: `${percentage}%` }]}>
            <LinearGradient colors={Gradients.brand} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          </View>
        )}
        <View style={[sl.thumb, { left: `${percentage}%` }]}>
          <LinearGradient colors={Gradients.brand} style={sl.thumbInner} />
        </View>
      </View>
    </View>
  );
}

const sl = StyleSheet.create({
  container: { gap: 10 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 14, fontFamily: Fonts.semibold, color: Colors.textSecondary },
  value: { fontSize: 13, fontFamily: Fonts.bold, color: Colors.textPrimary, minWidth: 36, textAlign: "right" },
  track: { height: 32, justifyContent: "center", position: "relative" },
  trackBg: { height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2 },
  centerLine: { position: "absolute", left: "50%", top: 10, width: 2, height: 12, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 1, marginLeft: -1 },
  fill: { position: "absolute", height: 4, top: 14, borderRadius: 2, overflow: "hidden" },
  thumb: {
    position: "absolute", width: 22, height: 22, borderRadius: 11, marginLeft: -11, top: 5,
    shadowColor: Colors.gradientPink, shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 6,
  },
  thumbInner: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
});

// ─────────────────────────────────────────────
// Preset Pill
// ─────────────────────────────────────────────
function PresetPill({ preset, isSelected, onPress }: { preset: PresetDef; isSelected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={() => { hapticLight(); onPress(); }} activeOpacity={0.7} style={pl.wrapper}>
      {isSelected ? (
        <LinearGradient colors={Gradients.brand} style={pl.circle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Icon name={preset.icon} size={22} color={Colors.textPrimary} />
        </LinearGradient>
      ) : (
        <View style={[pl.circle, pl.inactive]}>
          <Icon name={preset.icon} size={22} color={Colors.textSecondary} />
        </View>
      )}
      <Text style={[pl.label, isSelected && pl.labelActive]}>{preset.label}</Text>
    </TouchableOpacity>
  );
}

const pl = StyleSheet.create({
  wrapper: { alignItems: "center", gap: 6, marginHorizontal: 4 },
  circle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  inactive: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.cardBorder },
  label: { fontSize: 11, fontFamily: Fonts.semibold, color: Colors.textSecondary },
  labelActive: { color: Colors.textPrimary, fontFamily: Fonts.bold },
});

// ─────────────────────────────────────────────
// Ratio Item
// ─────────────────────────────────────────────
function RatioItem({ item, isSelected, onPress }: { item: AspectRatio; isSelected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={() => { hapticLight(); onPress(); }} activeOpacity={0.7} style={rt.wrapper}>
      {isSelected ? (
        <LinearGradient colors={Gradients.brand} style={rt.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={rt.checkBadge}>
            <Icon name="check" size={10} color="#fff" />
          </View>
          <Icon name={item.icon} size={20} color={Colors.textPrimary} />
          <Text style={[item.sublabel ? rt.label : rt.labelSmall, rt.labelActive]}>{item.label}</Text>
          {item.sublabel !== "" && <Text style={[rt.sublabel, rt.sublabelActive]}>{item.sublabel}</Text>}
        </LinearGradient>
      ) : (
        <View style={[rt.card, rt.inactive]}>
          <Icon name={item.icon} size={20} color={Colors.textSecondary} />
          <Text style={item.sublabel ? rt.label : rt.labelSmall}>{item.label}</Text>
          {item.sublabel !== "" && <Text style={rt.sublabel}>{item.sublabel}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const rt = StyleSheet.create({
  wrapper: { width: "30%", borderRadius: 16, overflow: "hidden" },
  card: { height: 90, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 4, position: "relative" },
  inactive: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.cardBorder },
  checkBadge: {
    position: "absolute", top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  label: { fontSize: 15, fontFamily: Fonts.bold, color: Colors.textSecondary },
  labelSmall: { fontSize: 12, fontFamily: Fonts.bold, color: Colors.textSecondary },
  labelActive: { color: Colors.textPrimary },
  sublabel: { fontSize: 11, color: Colors.textMuted, fontFamily: Fonts.medium },
  sublabelActive: { color: "rgba(255,255,255,0.7)" },
});

// ─────────────────────────────────────────────
// Crop Overlay (with PanResponder)
// ─────────────────────────────────────────────
const MIN_CROP = 60;

interface CropOverlayProps {
  selectedRatio: string;
  isFreeCrop: boolean;
  freeCropBox: { x: number; y: number; w: number; h: number };
  setFreeCropBox: React.Dispatch<React.SetStateAction<{ x: number; y: number; w: number; h: number }>>;
  setScrollEnabled: (v: boolean) => void;
  containerW: number;
  containerH: number;
}

function CropOverlay({ selectedRatio, isFreeCrop, freeCropBox, setFreeCropBox, setScrollEnabled, containerW, containerH }: CropOverlayProps) {
  const activeHandle = useRef("");
  const startBox = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const boxRef = useRef(freeCropBox);
  const isFreeCropRef = useRef(isFreeCrop);

  // Keep refs in sync without recreating PanResponder
  useEffect(() => { boxRef.current = freeCropBox; }, [freeCropBox]);
  useEffect(() => { isFreeCropRef.current = isFreeCrop; }, [isFreeCrop]);

  let cropX: number, cropY: number, cropW: number, cropH: number;

  if (isFreeCrop) {
    cropX = freeCropBox.x;
    cropY = freeCropBox.y;
    cropW = freeCropBox.w;
    cropH = freeCropBox.h;
  } else {
    const ratioObj = ASPECT_RATIOS.find((r) => r.key === selectedRatio);
    if (!ratioObj?.ratio) return null;
    const containerRatio = containerW / containerH;
    const targetRatio = ratioObj.ratio;
    if (targetRatio > containerRatio) {
      cropW = containerW;
      cropH = containerW / targetRatio;
    } else {
      cropH = containerH;
      cropW = containerH * targetRatio;
    }
    cropX = (containerW - cropW) / 2;
    cropY = (containerH - cropH) / 2;
  }

  // PanResponder created ONCE — uses refs, no stale closures
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => isFreeCropRef.current,
    onMoveShouldSetPanResponder: () => isFreeCropRef.current,
    onPanResponderGrant: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      const b = boxRef.current;
      startBox.current = { ...b };

      // Determine which handle/region was touched
      const edge = 35;
      const inT = Math.abs(locationY - b.y) < edge;
      const inB = Math.abs(locationY - (b.y + b.h)) < edge;
      const inL = Math.abs(locationX - b.x) < edge;
      const inR = Math.abs(locationX - (b.x + b.w)) < edge;
      if (inT && inL) activeHandle.current = "tl";
      else if (inT && inR) activeHandle.current = "tr";
      else if (inB && inL) activeHandle.current = "bl";
      else if (inB && inR) activeHandle.current = "br";
      else if (inT) activeHandle.current = "t";
      else if (inB) activeHandle.current = "b";
      else if (inL) activeHandle.current = "l";
      else if (inR) activeHandle.current = "r";
      else if (locationX > b.x && locationX < b.x + b.w && locationY > b.y && locationY < b.y + b.h) activeHandle.current = "move";
      else activeHandle.current = "";

      if (activeHandle.current) setScrollEnabled(false);
    },
    onPanResponderMove: (_e, gs) => {
      const h = activeHandle.current;
      if (!h) return;
      const b = startBox.current;
      const dx = gs.dx;
      const dy = gs.dy;

      let nx = b.x, ny = b.y, nw = b.w, nh = b.h;

      if (h === "move") {
        nx = Math.max(0, Math.min(b.x + dx, containerW - b.w));
        ny = Math.max(0, Math.min(b.y + dy, containerH - b.h));
      } else {
        if (h.includes("l")) { nx = Math.max(0, Math.min(b.x + dx, b.x + b.w - MIN_CROP)); nw = b.w - (nx - b.x); }
        if (h.includes("r")) { nw = Math.max(MIN_CROP, Math.min(b.w + dx, containerW - b.x)); }
        if (h.includes("t")) { ny = Math.max(0, Math.min(b.y + dy, b.y + b.h - MIN_CROP)); nh = b.h - (ny - b.y); }
        if (h.includes("b")) { nh = Math.max(MIN_CROP, Math.min(b.h + dy, containerH - b.y)); }
      }

      const next = { x: nx, y: ny, w: nw, h: nh };
      boxRef.current = next;
      setFreeCropBox(next);
    },
    onPanResponderRelease: () => {
      activeHandle.current = "";
      setScrollEnabled(true);
    },
    onPanResponderTerminate: () => {
      activeHandle.current = "";
      setScrollEnabled(true);
    },
  })).current;

  const Handle = ({ style }: { style: object }) => (
    <View style={[{ position: "absolute", width: 24, height: 24, zIndex: 10 }, style]}>
      <View style={{ position: "absolute", top: 0, left: 0, width: 24, height: 3, backgroundColor: "#fff", borderRadius: 1 }} />
      <View style={{ position: "absolute", top: 0, left: 0, width: 3, height: 24, backgroundColor: "#fff", borderRadius: 1 }} />
    </View>
  );

  return (
    <View style={StyleSheet.absoluteFillObject} {...panResponder.panHandlers}>
      {/* Darkened overlay regions */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: Math.max(0, cropY), backgroundColor: "rgba(0,0,0,0.6)", borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: Math.max(0, containerH - cropY - cropH), backgroundColor: "rgba(0,0,0,0.6)", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }} />
      <View style={{ position: "absolute", top: cropY, left: 0, width: Math.max(0, cropX), height: cropH, backgroundColor: "rgba(0,0,0,0.6)" }} />
      <View style={{ position: "absolute", top: cropY, right: 0, width: Math.max(0, containerW - cropX - cropW), height: cropH, backgroundColor: "rgba(0,0,0,0.6)" }} />

      {/* Border around crop area */}
      <View style={{ position: "absolute", top: cropY, left: cropX, width: cropW, height: cropH, borderWidth: 1.5, borderColor: "#fff" }} />

      {/* Corner handles */}
      <Handle style={{ top: cropY - 2, left: cropX - 2 }} />
      <Handle style={{ top: cropY - 2, left: cropX + cropW - 22, transform: [{ scaleX: -1 }] }} />
      <Handle style={{ top: cropY + cropH - 22, left: cropX - 2, transform: [{ scaleY: -1 }] }} />
      <Handle style={{ top: cropY + cropH - 22, left: cropX + cropW - 22, transform: [{ scaleX: -1 }, { scaleY: -1 }] }} />

      {/* Rule of thirds grid */}
      <View style={{ position: "absolute", top: cropY + cropH / 3, left: cropX + 1, width: cropW - 2, height: 0.5, backgroundColor: "rgba(255,255,255,0.25)" }} />
      <View style={{ position: "absolute", top: cropY + (cropH * 2) / 3, left: cropX + 1, width: cropW - 2, height: 0.5, backgroundColor: "rgba(255,255,255,0.25)" }} />
      <View style={{ position: "absolute", top: cropY + 1, left: cropX + cropW / 3, width: 0.5, height: cropH - 2, backgroundColor: "rgba(255,255,255,0.25)" }} />
      <View style={{ position: "absolute", top: cropY + 1, left: cropX + (cropW * 2) / 3, width: 0.5, height: cropH - 2, backgroundColor: "rgba(255,255,255,0.25)" }} />
    </View>
  );
}

// ─────────────────────────────────────────────
// Share Caption Modal
// ─────────────────────────────────────────────
function ShareCaptionModal({
  visible,
  photoUri,
  onClose,
}: {
  visible: boolean;
  photoUri: string | null;
  onClose: () => void;
}) {
  const [caption, setCaption] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleConfirmShare = async () => {
    hapticMedium();
    setIsSending(true);
    try {
      const message = caption.trim()
        ? `${caption.trim()}\n\nDécouvrez KaytiPic !`
        : "Découvrez cette photo sur KaytiPic !";
      await Share.share({ message, url: photoUri ?? "" });
    } catch {
      // user cancelled
    } finally {
      setIsSending(false);
      setCaption("");
      onClose();
    }
  };

  const handleClose = () => {
    hapticLight();
    setCaption("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={smc.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={handleClose} />
        <View style={smc.sheet}>
          <LinearGradient colors={["#0E0A24", "#080814"]} style={StyleSheet.absoluteFillObject} />
          <View style={smc.handle} />
          <Text style={smc.title}>Partager la photo</Text>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={smc.thumb} resizeMode="cover" />
          ) : null}
          <Text style={smc.label}>LÉGENDE</Text>
          <TextInput
            style={smc.input}
            value={caption}
            onChangeText={setCaption}
            placeholder="Écrire une légende..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={300}
            autoFocus={false}
          />
          <Text style={smc.charCount}>{caption.length}/300</Text>
          <TouchableOpacity
            style={smc.shareBtn}
            onPress={handleConfirmShare}
            activeOpacity={0.85}
            disabled={isSending}
          >
            <LinearGradient
              colors={Gradients.brand as [string, string]}
              style={smc.shareBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="share" size={18} color="#fff" />
              <Text style={smc.shareBtnText}>Partager</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={smc.cancelBtn} onPress={handleClose}>
            <Text style={smc.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const smc = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden",
    paddingHorizontal: 24, paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    gap: 12, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginBottom: 4,
  },
  title: { fontFamily: Fonts.bold, fontSize: 17, color: Colors.textPrimary, textAlign: "center" },
  thumb: { width: "100%", height: 180, borderRadius: 16, backgroundColor: Colors.bgCard },
  label: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accentPurple, letterSpacing: 1.5 },
  input: {
    backgroundColor: Colors.bgCard, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: Fonts.regular, fontSize: 15, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.cardBorder,
    minHeight: 80, textAlignVertical: "top",
  },
  charCount: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, textAlign: "right" },
  shareBtn: { borderRadius: 14, overflow: "hidden" },
  shareBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  shareBtnText: { fontFamily: Fonts.bold, fontSize: 16, color: "#fff" },
  cancelBtn: { alignItems: "center", paddingVertical: 4 },
  cancelText: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textMuted },
});

// ─────────────────────────────────────────────
// Main Editor Screen
// ─────────────────────────────────────────────
export default function RetoucheScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ photoId: string; photoUri?: string }>();
  const photoUri = params.photoUri || "";

  const [screenMode, setScreenMode] = useState<ScreenMode>("edit");
  const [showShareModal, setShowShareModal] = useState(false);
  const [savedUri, setSavedUri] = useState("");

  // Edit state
  const [activeTab, setActiveTab] = useState<TabKey>("ajuster");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [presetIntensity, setPresetIntensity] = useState(75);
  const [selectedRatio, setSelectedRatio] = useState("original");
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isFreeCrop, setIsFreeCrop] = useState(false);
  const [freeCropBox, setFreeCropBox] = useState({ x: 40, y: 40, w: width - 24 - 80, h: 280 });
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const dragStart = useRef({ x: 0, y: 0, box: { x: 0, y: 0, w: 0, h: 0 }, handle: "" });
  const [adjustments, setAdjustments] = useState<Record<string, number>>(
    Object.fromEntries(ADJUSTMENTS.map((a) => [a.key, a.defaultValue]))
  );

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [aiIdx, setAiIdx] = useState(0);
  const [showAi, setShowAi] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [exporting, setExporting] = useState(false);
  const intensityRef = useRef<View>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(tabAnim, { toValue: activeTab === "ajuster" ? 0 : 1, tension: 80, friction: 10, useNativeDriver: true }).start();
  }, [activeTab]);

  // Convert adjustment values [-100,100] to filter multipliers
  const brightnessAmount = 1 + (adjustments.exposition ?? 0) / 100 + (adjustments.luminosite ?? 0) / 200;
  const contrastAmount = 1 + (adjustments.contraste ?? 0) / 100;
  const saturationAmount = 1 + (adjustments.saturation ?? 0) / 100;

  const tabTranslate = tabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (width - 40) / 2] });

  // ─── Presets ───
  const applyPreset = useCallback((presetKey: string | null, intensity: number) => {
    if (!presetKey) {
      setAdjustments(Object.fromEntries(ADJUSTMENTS.map((a) => [a.key, a.defaultValue])));
      return;
    }
    const preset = PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
    const scale = intensity / 100;
    const newAdj: Record<string, number> = {};
    for (const a of ADJUSTMENTS) {
      newAdj[a.key] = Math.round((preset.values[a.key] || 0) * scale);
    }
    setAdjustments(newAdj);
  }, []);

  const handlePresetSelect = useCallback((key: string) => {
    const next = selectedPreset === key ? null : key;
    setSelectedPreset(next);
    applyPreset(next, presetIntensity);
  }, [selectedPreset, presetIntensity, applyPreset]);

  const handleIntensity = useCallback((pageX: number) => {
    intensityRef.current?.measure((_x, _y, w, _h, px) => {
      const val = Math.round(Math.max(0, Math.min(100, ((pageX - px) / w) * 100)));
      setPresetIntensity(val);
      applyPreset(selectedPreset, val);
    });
  }, [selectedPreset, applyPreset]);

  const updateAdjustment = useCallback((key: string, value: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
    setSelectedPreset(null);
  }, []);

  // ─── Transforms ───
  const handleRotateLeft = useCallback(() => setRotation((r) => (r - 90) % 360), []);
  const handleRotateRight = useCallback(() => setRotation((r) => (r + 90) % 360), []);
  const handleFlipH = useCallback(() => setFlipH((f) => !f), []);
  const handleFlipV = useCallback(() => setFlipV((f) => !f), []);

  // ─── AI Retouch ───
  const handleAIRetouch = useCallback(async () => {
    if (!photoUri) return;
    setAiLoading(true);
    try {
      const { data: preset } = await aiApi.generatePreset(photoUri);
      const sugs: AISuggestion[] = [];
      if (preset.exposure) sugs.push({ label: preset.exposure > 0 ? "Eclaircir l'image" : "Assombrir", detail: `${preset.exposure > 0 ? "+" : ""}${preset.exposure}% exposition`, icon: "sun", adjustmentKey: "exposition", adjustmentValue: preset.exposure });
      if (preset.contrast) sugs.push({ label: preset.contrast > 0 ? "Plus de contraste" : "Adoucir", detail: `${preset.contrast > 0 ? "+" : ""}${preset.contrast}% contraste`, icon: "sliders", adjustmentKey: "contraste", adjustmentValue: preset.contrast });
      if (preset.saturation) sugs.push({ label: preset.saturation > 0 ? "Renforcer les couleurs" : "Désaturer", detail: `${preset.saturation > 0 ? "+" : ""}${preset.saturation}% saturation`, icon: "sparkles", adjustmentKey: "saturation", adjustmentValue: preset.saturation });
      if (sugs.length === 0) sugs.push({ label: "Photo déjà optimale", detail: "Aucun ajustement", icon: "check", adjustmentKey: "", adjustmentValue: 0 });
      setAiSuggestions(sugs);
      setAiIdx(0);
      setShowAi(true);
    } catch {
      Alert.alert("Erreur", "Impossible de générer les suggestions IA.");
    } finally {
      setAiLoading(false);
    }
  }, [photoUri]);

  const handleApplySuggestion = useCallback(() => {
    const s = aiSuggestions[aiIdx];
    if (!s?.adjustmentKey) return;
    setAdjustments((prev) => ({ ...prev, [s.adjustmentKey]: s.adjustmentValue }));
    setSelectedPreset(null);
  }, [aiSuggestions, aiIdx]);

  // ─── Export ───
  const handleExport = useCallback(async () => {
    if (!photoUri) return;
    setExporting(true);
    try {
      // 1. Capture the preview (includes color filters: brightness, contrast, saturation)
      let sourceUri = photoUri;
      if (viewShotRef.current?.capture) {
        sourceUri = await viewShotRef.current.capture();
      }

      // 2. Apply geometric transforms (rotation, flip, crop) via ImageManipulator
      const actions: ImageManipulator.Action[] = [];
      if (rotation !== 0) actions.push({ rotate: rotation });
      if (flipH) actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      if (flipV) actions.push({ flip: ImageManipulator.FlipType.Vertical });

      const dims = await new Promise<{ width: number; height: number }>((res, rej) => {
        Image.getSize(sourceUri, (w, h) => res({ width: w, height: h }), rej);
      });

      if (isFreeCrop) {
        // Map free crop box (preview coords) to actual image pixels
        const containerW = width - 24;
        const containerH = 360;
        const scaleX = dims.width / containerW;
        const scaleY = dims.height / containerH;
        actions.push({ crop: {
          originX: Math.round(freeCropBox.x * scaleX),
          originY: Math.round(freeCropBox.y * scaleY),
          width: Math.round(freeCropBox.w * scaleX),
          height: Math.round(freeCropBox.h * scaleY),
        }});
      } else {
        const ratioObj = ASPECT_RATIOS.find((r) => r.key === selectedRatio);
        if (ratioObj?.ratio) {
          const target = ratioObj.ratio;
          const imgR = dims.width / dims.height;
          let cw: number, ch: number;
          if (imgR > target) { ch = dims.height; cw = Math.round(ch * target); }
          else { cw = dims.width; ch = Math.round(cw / target); }
          actions.push({ crop: { originX: Math.round((dims.width - cw) / 2), originY: Math.round((dims.height - ch) / 2), width: cw, height: ch } });
        }
      }

      const result = actions.length > 0
        ? await ImageManipulator.manipulateAsync(sourceUri, actions, { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG })
        : { uri: sourceUri };

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === "granted") {
        await MediaLibrary.saveToLibraryAsync(result.uri);
        setSavedUri(result.uri);
        setScreenMode("saved");
      } else {
        Alert.alert("Permission requise", "Autorisez l'accès à la galerie pour sauvegarder.");
      }
    } catch {
      Alert.alert("Erreur", "Impossible d'exporter la photo.");
    } finally {
      setExporting(false);
    }
  }, [photoUri, rotation, flipH, flipV, selectedRatio, adjustments]);

  const handleShare = useCallback(() => {
    if (!savedUri) return;
    hapticLight();
    setShowShareModal(true);
  }, [savedUri]);

  const handleReset = useCallback(() => {
    setAdjustments(Object.fromEntries(ADJUSTMENTS.map((a) => [a.key, a.defaultValue])));
    setSelectedPreset(null);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setSelectedRatio("original");
    setIsFreeCrop(false);
    setFreeCropBox({ x: 40, y: 40, w: width - 24 - 80, h: 280 });
    setShowAi(false);
  }, []);

  // ═══════════════════════════════════════════
  // SAVED SCREEN
  // ═══════════════════════════════════════════
  if (screenMode === "saved") {
    return (
      <View style={ss.container}>
        <StatusBar style="light" />
        <LinearGradient colors={["#0E0A24", "#080814"]} style={StyleSheet.absoluteFillObject} />
        <ShareCaptionModal
          visible={showShareModal}
          photoUri={savedUri}
          onClose={() => setShowShareModal(false)}
        />
        <KaytiHeader showBack title="Enregistrement effectué" onBack={() => setScreenMode("edit")} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ss.scroll}>
          <View style={ss.photoWrap}>
            <Image source={{ uri: savedUri }} style={ss.photo} resizeMode="contain" />
          </View>

          <TouchableOpacity style={ss.shareBtn} onPress={() => { hapticLight(); handleShare(); }} activeOpacity={0.7}>
            <Text style={ss.shareBtnText}>Partager</Text>
          </TouchableOpacity>

          <View style={ss.socialRow}>
            {([["Instagram", "image"], ["Stories", "plus"], ["WhatsApp", "message-circle"], ["Facebook", "globe"]] as [string, IconName][]).map(([label, icon]) => (
              <TouchableOpacity key={label} style={ss.socialItem} onPress={() => { hapticLight(); handleShare(); }} activeOpacity={0.7}>
                <View style={ss.socialIcon}><Icon name={icon} size={22} color={Colors.textPrimary} /></View>
                <Text style={ss.socialLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={ss.quickSection}>
            <Text style={ss.quickTitle}>Actions rapides</Text>
            <View style={ss.quickRow}>
              {([
                ["Nouveau\nprojet", "plus", () => router.push("/(tabs)/camera")],
                ["Options\nd'exportation", "share", handleShare],
                ["Qualité de\nl'image", "image", () => {}],
                ["Ajuster\nles filtres", "refresh", () => setScreenMode("edit")],
              ] as [string, IconName, () => void][]).map(([label, icon, action]) => (
                <TouchableOpacity key={label} style={ss.quickItem} onPress={action} activeOpacity={0.7}>
                  <View style={ss.quickIcon}><Icon name={icon} size={20} color={Colors.textPrimary} /></View>
                  <Text style={ss.quickLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

      </View>
    );
  }

  // ═══════════════════════════════════════════
  // EDIT SCREEN
  // ═══════════════════════════════════════════
  return (
    <View style={es.container}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0E0A24", "#080814"]} style={StyleSheet.absoluteFillObject} />
      <KaytiHeader showBack title="Retouche" />

      {/* Tabs */}
      <View style={es.tabWrap}>
        <View style={es.tabBar}>
          <Animated.View style={[es.tabInd, { transform: [{ translateX: tabTranslate }] }]}>
            <LinearGradient colors={Gradients.brand} style={es.tabIndGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          </Animated.View>
          <TouchableOpacity onPress={() => { hapticLight(); setActiveTab("ajuster"); }} style={es.tabBtn} activeOpacity={0.7}>
            <View style={es.tabBtnRow}>
              <Icon name="sliders" size={16} color={activeTab === "ajuster" ? "#fff" : Colors.textMuted} />
              <Text style={[es.tabText, activeTab === "ajuster" && es.tabActive]}>Ajuster</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { hapticLight(); setActiveTab("recadrer"); }} style={es.tabBtn} activeOpacity={0.7}>
            <View style={es.tabBtnRow}>
              <Icon name="crop" size={16} color={activeTab === "recadrer" ? "#fff" : Colors.textMuted} />
              <Text style={[es.tabText, activeTab === "recadrer" && es.tabActive]}>Recadrer</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Photo Preview - OUTSIDE ScrollView so crop gestures don't conflict */}
      <View style={es.photoOuter}>
        <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }} style={es.photoWrap}>
          {photoUri ? (
            <Brightness amount={brightnessAmount}>
              <Contrast amount={contrastAmount}>
                <Saturate amount={saturationAmount}>
                  <Image
                    source={{ uri: photoUri }}
                    style={[es.photo, { transform: [{ rotate: `${rotation}deg` }, { scaleX: flipH ? -1 : 1 }, { scaleY: flipV ? -1 : 1 }] }]}
                    resizeMode="contain"
                  />
                </Saturate>
              </Contrast>
            </Brightness>
          ) : (
            <LinearGradient colors={["#2D1060", "#1A0840"]} style={es.photoEmpty}>
              <Icon name="image" size={48} color={Colors.textMuted} />
              <Text style={es.photoEmptyText}>Aperçu de la photo</Text>
            </LinearGradient>
          )}
        </ViewShot>

        {/* Live crop overlay - sits on top of photo, outside ScrollView */}
        {(selectedRatio !== "original" || isFreeCrop) && <CropOverlay
          selectedRatio={selectedRatio}
          isFreeCrop={isFreeCrop}
          freeCropBox={freeCropBox}
          setFreeCropBox={setFreeCropBox}
          setScrollEnabled={setScrollEnabled}
          containerW={width - 24}
          containerH={360}
        />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={es.scroll} scrollEnabled={scrollEnabled}>

        {/* Reset + AI Button */}
        <View style={es.aiRow}>
          <TouchableOpacity onPress={() => { hapticLight(); handleReset(); }} style={es.resetBtn} activeOpacity={0.7}>
            <Icon name="refresh" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { hapticMedium(); handleAIRetouch(); }} activeOpacity={0.85} style={es.aiBtnWrap} disabled={aiLoading}>
            <LinearGradient colors={["#7B2FBE", "#2B7FFF"]} style={es.aiBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {aiLoading ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="sparkles" size={20} color="#fff" />}
              <Text style={es.aiBtnText}>IA Retouche Photo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* AI Suggestions */}
        {showAi && aiSuggestions.length > 0 && (
          <View style={es.aiCard}>
            <View style={es.aiCardHead}>
              <Text style={es.aiCardTitle}>Suggestions IA</Text>
              <Text style={es.aiCardCount}>{aiIdx + 1}/{aiSuggestions.length}</Text>
            </View>
            <View style={es.aiCardBody}>
              <TouchableOpacity onPress={() => { hapticLight(); setAiIdx((i) => Math.max(0, i - 1)); }} disabled={aiIdx === 0} style={es.aiNav}>
                <Icon name="chevron-left" size={20} color={aiIdx === 0 ? Colors.textMuted : "#fff"} />
              </TouchableOpacity>
              <View style={es.aiCardPillWrap}>
                <LinearGradient colors={["#2D1B69", "#1A1A2E"]} style={es.aiCardPill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Icon name={aiSuggestions[aiIdx].icon} size={20} color={Colors.accentPurple} />
                  <View>
                    <Text style={es.aiPillLabel}>{aiSuggestions[aiIdx].label}</Text>
                    <Text style={es.aiPillDetail}>{aiSuggestions[aiIdx].detail}</Text>
                  </View>
                </LinearGradient>
              </View>
              <TouchableOpacity onPress={() => { hapticLight(); setAiIdx((i) => Math.min(aiSuggestions.length - 1, i + 1)); }} disabled={aiIdx === aiSuggestions.length - 1} style={es.aiNav}>
                <Icon name="chevron-right" size={20} color={aiIdx === aiSuggestions.length - 1 ? Colors.textMuted : "#fff"} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => { hapticMedium(); handleApplySuggestion(); }} style={es.aiApply} activeOpacity={0.7}>
              <Text style={es.aiApplyText}>Appliquer cette suggestion</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TAB: Ajuster */}
        {activeTab === "ajuster" ? (
          <View style={es.tabContent}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={es.presetsRow}>
              {PRESETS.map((p) => (
                <PresetPill key={p.key} preset={p} isSelected={selectedPreset === p.key} onPress={() => handlePresetSelect(p.key)} />
              ))}
            </ScrollView>

            {selectedPreset && (
              <View style={es.intSection}>
                <View style={es.intHead}>
                  <Text style={es.intLabel}>Intensité</Text>
                  <Text style={es.intValue}>{presetIntensity}%</Text>
                </View>
                <View
                  ref={intensityRef}
                  style={es.intTrack}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onResponderGrant={(e) => handleIntensity(e.nativeEvent.pageX)}
                  onResponderMove={(e) => handleIntensity(e.nativeEvent.pageX)}
                >
                  <View style={es.intTrackBg} />
                  <View style={[es.intFill, { width: `${presetIntensity}%` }]}>
                    <LinearGradient colors={Gradients.brand} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  </View>
                  <View style={[es.intThumb, { left: `${presetIntensity}%` }]}>
                    <LinearGradient colors={Gradients.brand} style={es.intThumbInner} />
                  </View>
                </View>
                <View style={es.intActions}>
                  <TouchableOpacity style={es.intActionBtn} onPress={() => { hapticLight(); setSelectedPreset(null); applyPreset(null, 0); }}>
                    <Icon name="x" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={es.intActionBtn} onPress={() => { hapticLight(); setSelectedPreset(null); }}>
                    <Icon name="check" size={18} color={Colors.accentGreen} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={es.divider} />

            <View style={es.adjSection}>
              <Text style={es.adjTitle}>Ajustements manuels</Text>
              <View style={es.adjList}>
                {ADJUSTMENTS.map((a) => (
                  <CustomSlider key={a.key} label={a.label} value={adjustments[a.key]} min={a.min} max={a.max} onChange={(v) => updateAdjustment(a.key, v)} />
                ))}
              </View>
            </View>
          </View>
        ) : (
          /* TAB: Recadrer */
          <View style={es.tabContent}>
            <View style={es.ratioSection}>
              <View style={es.ratioGrid}>
                {ASPECT_RATIOS.map((item) => (
                  <RatioItem key={item.key} item={item} isSelected={selectedRatio === item.key && !isFreeCrop} onPress={() => { setSelectedRatio(item.key); setIsFreeCrop(false); }} />
                ))}
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.7} style={[es.freeCrop, isFreeCrop && es.freeCropActive]} onPress={() => { hapticLight(); setIsFreeCrop(!isFreeCrop); setSelectedRatio("original"); }}>
              <View style={es.freeCropInner}>
                <Icon name="crop" size={18} color={isFreeCrop ? "#fff" : Colors.textSecondary} />
                <Text style={[es.freeCropText, isFreeCrop && { color: "#fff" }]}>Recadrage libre</Text>
              </View>
            </TouchableOpacity>

            <View style={es.rotRow}>
              <TouchableOpacity style={es.rotBtn} onPress={() => { hapticLight(); handleRotateLeft(); }} activeOpacity={0.7}>
                <View style={es.rotBtnBg}><Icon name="flip-backward" size={20} color={Colors.textSecondary} /></View>
                <Text style={es.rotLabel}>-90°</Text>
              </TouchableOpacity>
              <TouchableOpacity style={es.rotBtn} onPress={() => { hapticLight(); handleRotateRight(); }} activeOpacity={0.7}>
                <View style={es.rotBtnBg}><Icon name="flip-forward" size={20} color={Colors.textSecondary} /></View>
                <Text style={es.rotLabel}>+90°</Text>
              </TouchableOpacity>
              <TouchableOpacity style={es.rotBtn} onPress={() => { hapticLight(); handleFlipV(); }} activeOpacity={0.7}>
                <View style={[es.rotBtnBg, flipV && es.rotBtnActive]}><Icon name="switch-horizontal" size={20} color={flipV ? "#fff" : Colors.textSecondary} /></View>
                <Text style={es.rotLabel}>Flip V</Text>
              </TouchableOpacity>
              <TouchableOpacity style={es.rotBtn} onPress={() => { hapticLight(); handleFlipH(); }} activeOpacity={0.7}>
                <View style={[es.rotBtnBg, flipH && es.rotBtnActive]}><Icon name="switch-horizontal" size={20} color={flipH ? "#fff" : Colors.textSecondary} /></View>
                <Text style={es.rotLabel}>Flip H</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Export */}
        <View style={es.exportWrap}>
          <TouchableOpacity onPress={() => { hapticMedium(); handleExport(); }} activeOpacity={0.85} disabled={exporting}>
            <LinearGradient colors={Gradients.brand} style={es.exportBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {exporting ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Icon name="download" size={18} color="#fff" />
                  <Text style={es.exportText}>Exporter</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

    </View>
  );
}

// ─────────────────────────────────────────────
// Saved Screen Styles
// ─────────────────────────────────────────────
const ss = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 120, gap: 20, paddingTop: 8 },
  photoWrap: { marginHorizontal: 20, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder },
  photo: { width: "100%", height: 340, borderRadius: 16 },
  shareBtn: { marginHorizontal: 20, backgroundColor: Colors.bgCard, borderRadius: 14, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: Colors.cardBorder },
  shareBtnText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary },
  socialRow: { flexDirection: "row", justifyContent: "center", gap: 28, paddingHorizontal: 20 },
  socialItem: { alignItems: "center", gap: 8 },
  socialIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.bgCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.cardBorder },
  socialLabel: { fontFamily: Fonts.medium, fontSize: 11, color: Colors.textSecondary },
  quickSection: { paddingHorizontal: 20, gap: 14 },
  quickTitle: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.textPrimary },
  quickRow: { flexDirection: "row", gap: 12 },
  quickItem: { flex: 1, alignItems: "center", gap: 8 },
  quickIcon: { width: 50, height: 50, borderRadius: 14, backgroundColor: Colors.bgCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.cardBorder },
  quickLabel: { fontFamily: Fonts.medium, fontSize: 10, color: Colors.textSecondary, textAlign: "center" },
});

// ─────────────────────────────────────────────
// Edit Screen Styles
// ─────────────────────────────────────────────
const es = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 120, gap: 16 },

  // Tabs
  tabWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  tabBar: { flexDirection: "row", backgroundColor: Colors.bgCard, borderRadius: 14, padding: 4, position: "relative", borderWidth: 1, borderColor: Colors.cardBorder },
  tabInd: { position: "absolute", top: 4, left: 4, width: (width - 40 - 8) / 2, height: "100%", borderRadius: 11, overflow: "hidden" },
  tabIndGrad: { flex: 1, borderRadius: 11 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center", zIndex: 1 },
  tabBtnRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tabText: { fontSize: 14, fontFamily: Fonts.semibold, color: Colors.textMuted },
  tabActive: { color: "#fff", fontFamily: Fonts.bold },

  // Photo
  photoOuter: { marginHorizontal: 12, position: "relative" },
  photoWrap: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder, height: 360, backgroundColor: "#0A0A14" },
  photo: { width: "100%", height: 360, borderRadius: 16 },
  photoEmpty: { width: "100%", height: 360, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  photoEmptyText: { fontSize: 14, color: Colors.textMuted, fontFamily: Fonts.semibold },

  // AI Row
  aiRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10 },
  resetBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.bgCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.cardBorder },
  aiBtnWrap: { flex: 1, borderRadius: 14, overflow: "hidden" },
  aiBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, gap: 10 },
  aiBtnText: { color: "#fff", fontSize: 15, fontFamily: Fonts.bold },

  // AI Suggestions
  aiCard: { marginHorizontal: 20, backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.cardBorder },
  aiCardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  aiCardTitle: { fontFamily: Fonts.bold, fontSize: 14, color: "#fff" },
  aiCardCount: { fontFamily: Fonts.semibold, fontSize: 12, color: Colors.textMuted },
  aiCardBody: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiNav: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  aiCardPillWrap: { flex: 1 },
  aiCardPill: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12 },
  aiPillLabel: { fontFamily: Fonts.semibold, fontSize: 14, color: "#fff" },
  aiPillDetail: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  aiApply: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  aiApplyText: { fontFamily: Fonts.semibold, fontSize: 13, color: "#fff" },

  // Tab content
  tabContent: { gap: 20 },
  presetsRow: { paddingHorizontal: 20, gap: 10 },

  // Intensity
  intSection: { paddingHorizontal: 20, gap: 10 },
  intHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  intLabel: { fontSize: 14, fontFamily: Fonts.semibold, color: Colors.textSecondary },
  intValue: { fontSize: 14, fontFamily: Fonts.bold, color: "#fff" },
  intTrack: { height: 32, justifyContent: "center", position: "relative" },
  intTrackBg: { height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2 },
  intFill: { position: "absolute", height: 4, top: 14, left: 0, borderRadius: 2, overflow: "hidden" },
  intThumb: { position: "absolute", width: 22, height: 22, borderRadius: 11, marginLeft: -11, top: 5, shadowColor: Colors.gradientPink, shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 6 },
  intThumbInner: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  intActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  intActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },

  // Divider
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginHorizontal: 20 },

  // Adjustments
  adjSection: { paddingHorizontal: 20, gap: 14 },
  adjTitle: { fontSize: 16, fontFamily: Fonts.black, color: "#fff" },
  adjList: { gap: 16 },

  // Ratio
  ratioSection: { paddingHorizontal: 20 },
  ratioGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },

  // Free crop
  freeCrop: { marginHorizontal: 20, borderRadius: 16, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.cardBorder },
  freeCropActive: { borderColor: Colors.accentPurple, backgroundColor: "rgba(123,47,190,0.15)" },
  freeCropInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 10 },
  freeCropText: { fontSize: 14, fontFamily: Fonts.semibold, color: Colors.textSecondary },

  // Rotation
  rotRow: { flexDirection: "row", justifyContent: "center", paddingHorizontal: 20, gap: 16 },
  rotBtn: { alignItems: "center", gap: 6, flex: 1 },
  rotBtnBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.bgCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.cardBorder, alignSelf: "center" },
  rotBtnActive: { borderColor: Colors.accentPurple, backgroundColor: "rgba(123,47,190,0.15)" },
  rotLabel: { fontSize: 10, color: Colors.textMuted, fontFamily: Fonts.semibold, textAlign: "center" },

  // Export
  exportWrap: { paddingHorizontal: 20, marginTop: 4 },
  exportBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 16, gap: 10 },
  exportText: { color: "#fff", fontSize: 16, fontFamily: Fonts.bold },
});
