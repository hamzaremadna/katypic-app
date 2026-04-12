import { useState, useRef, useCallback, useEffect } from "react";
import { CameraView } from "expo-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { readAsStringAsync, deleteAsync } from "expo-file-system/legacy";
import { aiApi } from "../services/api/ai.api";
import type { AssistantMode } from "../components/camera/AssistantModeModal";

interface CameraTip {
  tip: string;
  category: string;
  alert?: string;
}

const FALLBACK_TIPS: CameraTip[] = [
  { alert: "Sous-exposition", tip: "La scène est trop sombre — cherchez plus de lumière ou activez le flash.", category: "lumiere" },
  { alert: "Horizon penché", tip: "Inclinez légèrement votre téléphone pour redresser l'horizon.", category: "technique" },
  { alert: "Sujet trop loin", tip: "Faites deux pas vers votre sujet pour remplir davantage le cadre.", category: "composition" },
  { alert: "Contre-jour", tip: "Repositionnez-vous pour avoir la source de lumière dans le dos.", category: "lumiere" },
  { alert: "Cadrage déséquilibré", tip: "Déplacez votre sujet vers une intersection des lignes du tiers.", category: "composition" },
  { alert: "Belle lumière ✓", tip: "La lumière est bonne — essayez simplement de varier votre angle.", category: "lumiere" },
];

/** intensity 20–100 → poll interval 30s–8s */
function intensityToMs(intensity: number): number {
  return Math.round(30000 - ((intensity - 20) / 80) * 22000);
}

export function useCameraTip(cameraRef: React.RefObject<CameraView | null>) {
  const [currentTip, setCurrentTip] = useState<CameraTip | null>(null);
  const [showTipOverlay, setShowTipOverlay] = useState(false);
  const [assistantActive, setAssistantActive] = useState(false);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("text");
  const [assistantIntensity, setAssistantIntensity] = useState(60);
  const tipIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTip = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const frame = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      } as Parameters<typeof cameraRef.current.takePictureAsync>[0]);
      if (!frame?.uri) return;

      // Resize to max 512px — cuts payload from ~3MB to ~40KB, latency 3–5s → ~1s
      const resized = await manipulateAsync(
        frame.uri,
        [{ resize: { width: 512 } }],
        { compress: 0.6, format: SaveFormat.JPEG },
      );

      deleteAsync(frame.uri, { idempotent: true }).catch(() => {});
      const base64 = await readAsStringAsync(resized.uri, { encoding: "base64" });
      deleteAsync(resized.uri, { idempotent: true }).catch(() => {});

      const response = await aiApi.getCameraTip(base64, "image/jpeg");
      setCurrentTip(response.data);
      setShowTipOverlay(true);
    } catch {
      const fallback = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
      setCurrentTip(fallback);
      setShowTipOverlay(true);
    }
  }, [cameraRef]);

  const startAssistant = useCallback(
    (mode: AssistantMode, intensity: number) => {
      setAssistantMode(mode);
      setAssistantIntensity(intensity);
      setAssistantActive(true);

      fetchTip();
      tipIntervalRef.current = setInterval(fetchTip, intensityToMs(intensity));
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

  return {
    currentTip,
    showTipOverlay,
    setShowTipOverlay,
    assistantActive,
    assistantMode,
    assistantIntensity,
    startAssistant,
    stopAssistant,
  };
}
