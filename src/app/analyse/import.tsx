import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Modal,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { navigate } from "@/utils/navigation";
import * as ImagePicker from "expo-image-picker";
import { Colors, Gradients } from "../../theme/colors";
import { KaytiHeader, BottomTabBar } from "../../components/ui";
import { TourOverlay } from "../../components/tour/TourOverlay";
import { TOUR_ANALYSE } from "../../data/tours";
import { useTourStore } from "../../stores/tourStore";
import { Icon } from "../../components/ui/Icon";
import { usePhotos } from "../../hooks/usePhotos";
import { Image as RNImage } from "react-native";

const { width, height } = Dimensions.get("window");

// AI Selection modal - "Sélection intelligente"
function AISelectionModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;
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
          tension: 65,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const types = [
    {
      id: "all",
      label: "Tous les problèmes",
      count: 5,
      icon: "✦",
      selected: true,
    },
    { id: "doublon", label: "Doublons", count: 2, icon: "⧉", selected: false },
    { id: "yeux", label: "Yeux fermés", count: 2, icon: "◉", selected: false },
    {
      id: "flou",
      label: "Photos floues",
      count: 1,
      icon: "◎",
      selected: false,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[m.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
        />
        <Animated.View
          style={[m.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <LinearGradient
            colors={["rgba(20,10,50,0.99)", "rgba(10,5,30,0.99)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity style={m.closeBtn} onPress={onClose}>
            <Icon name="x" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={m.titleRow}>
            <Icon name="sparkles" size={18} color={Colors.accentPink} />
            <Text style={m.title}>Sélection intelligente</Text>
          </View>
          <Text style={m.subtitle}>L'IA peut détecter automatiquement :</Text>

          <View style={m.typeList}>
            {types.map((t, i) => (
              <TouchableOpacity
                key={t.id}
                style={[m.typeRow, t.selected && m.typeRowSelected]}
                onPress={() => onSelect(t.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    t.selected
                      ? Gradients.purpleBlue
                      : ["transparent", "transparent"]
                  }
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={m.typeIcon}>{t.icon}</Text>
                <Text style={m.typeLabel}>{t.label}</Text>
                <View style={m.typeCount}>
                  <Text style={m.typeCountText}>{t.count}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={m.manualBtn} onPress={onClose}>
            <LinearGradient
              colors={Gradients.purpleBlue}
              style={m.manualBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={m.manualBtnText}>Sélection manuelle</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const m = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,8,20,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
    overflow: "hidden",
    gap: 14,
  },
  closeBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  closeIcon: { color: Colors.textSecondary, fontSize: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  titleIcon: { color: Colors.accentPink, fontSize: 18 },
  title: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary },
  typeList: { gap: 8 },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
    position: "relative",
  },
  typeRowSelected: { borderColor: "rgba(100,60,200,0.4)" },
  typeIcon: {
    fontSize: 16,
    color: Colors.textPrimary,
    width: 20,
    textAlign: "center",
  },
  typeLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  typeCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  typeCountText: { color: Colors.textPrimary, fontSize: 13, fontWeight: "700" },
  manualBtn: { borderRadius: 50, overflow: "hidden" },
  manualBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  manualBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

async function pickImageAndAnalyse(router: ReturnType<typeof useRouter>) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      "Permission requise",
      "Autorisez l'accès à vos photos pour importer une image."
    );
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 0.9,
  });
  if (!result.canceled && result.assets[0]) {
    navigate(`/analyse/result?photoUri=${encodeURIComponent(result.assets[0].uri)}`);
  }
}

export default function AnalyseImportScreen() {
  const router = useRouter();
  const [showAIModal, setShowAIModal] = useState(false);
  const headerFade = useRef(new Animated.Value(0)).current;

  // ── Real photos ──
  const { data: photosData } = usePhotos();
  const recentPhotos = photosData?.photos?.slice(0, 6) ?? [];

  // ── Tour ──────────────────────────────────────────────
  const { markSeen, load } = useTourStore();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    load().then(() => {
      if (!useTourStore.getState().hasSeen("analyse")) {
        setTimeout(() => setShowTour(true), 700);
      }
    });
  }, []);

  const handlePhotoPress = (photoId: string, photoUrl: string) => {
    router.push({
      pathname: "/analyse/result",
      params: { photoId, photoUri: photoUrl },
    });
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        <KaytiHeader showSettings showBack title="Analyser une photo" />

        {/* Hero banner */}
        <Animated.View style={[s.heroBanner, { opacity: headerFade }]}>
          <LinearGradient
            colors={["#2D1060", "#1A0840", "#0A0820"]}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={["transparent", "rgba(8,8,20,0.8)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={s.heroContent}>
            <Icon name="camera" size={28} color={Colors.textPrimary} />
            <Text style={s.heroTitle}>Analyser une photo</Text>
            <Text style={s.heroSub}>
              Importez une photo pour{"\n"}l'analyser ...
            </Text>
          </View>
        </Animated.View>

        {/* Import button */}
        <TouchableOpacity
          style={s.importBtn}
          activeOpacity={0.85}
          onPress={() => pickImageAndAnalyse(router)}
        >
          <LinearGradient
            colors={Gradients.purpleBlue}
            style={s.importBtnInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="upload" size={24} color="#fff" />
            <View>
              <Text style={s.importLabel}>Importer depuis la galerie</Text>
              <Text style={s.importSub}>Sélectionnez une photo à analyser</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Action buttons */}
        <View style={s.actionBtns}>
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => navigate("/(tabs)/camera")}
          >
            <LinearGradient
              colors={Gradients.purpleBlue}
              style={s.actionBtnGradient}
            >
              <Text style={s.actionBtnText}>Prendre une photo</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnDark]}
            onPress={() => pickImageAndAnalyse(router)}
          >
            <Text style={s.actionBtnTextDark}>
              Importer à partir de l'application
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent photos */}
        <View style={s.recentSection}>
          <View style={s.recentHeader}>
            <Text style={s.sectionTitle}>Photos récentes</Text>
            <TouchableOpacity
              style={s.aiSelectBtn}
              onPress={() => setShowAIModal(true)}
            >
              <LinearGradient
                colors={Gradients.redPink}
                style={s.aiSelectBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon name="sparkles" size={12} color="#fff" />
                <Text style={s.aiSelectBtnText}>Sélection IA</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {recentPhotos.length === 0 ? (
            <View style={s.emptyRecent}>
              <Icon name="image" size={36} color={Colors.textMuted} />
              <Text style={s.emptyRecentText}>
                Aucune photo récente
              </Text>
            </View>
          ) : (
            <View style={s.photoGrid}>
              {recentPhotos.map((photo, i) => (
                <TouchableOpacity
                  key={photo.id}
                  style={[s.photoCell, i === 0 && s.photoCellLarge]}
                  onPress={() => handlePhotoPress(photo.id, photo.url)}
                  activeOpacity={0.85}
                >
                  <RNImage
                    source={{ uri: photo.url }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                  {photo.analyses && photo.analyses.length > 0 && (
                    <View style={s.photoTag}>
                      <Text style={s.photoTagText}>
                        Score: {photo.analyses[0].overallScore}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabBar activeRoute="/(tabs)/camera" />
      <AISelectionModal
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
        onSelect={(type) => {
          setShowAIModal(false);
          router.push(`/analyse/ai-selection?type=${type}`);
        }}
      />

      {/* ── Guided Tour ── */}
      <TourOverlay
        steps={TOUR_ANALYSE}
        tourTitle="Analyser une photo"
        visible={showTour}
        onFinish={() => {
          setShowTour(false);
          markSeen("analyse");
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20, gap: 16 },

  heroBanner: {
    height: 100,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
  },
  heroContent: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroIcon: { fontSize: 28 },
  heroTitle: { fontSize: 20, fontWeight: "900", color: Colors.textPrimary },
  heroSub: { fontSize: 13, color: Colors.textSecondary },

  importBtn: { marginHorizontal: 20, borderRadius: 16, overflow: "hidden" },
  importBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
  },
  importIcon: { fontSize: 24, color: "#fff" },
  importLabel: { fontSize: 16, fontWeight: "800", color: "#fff" },
  importSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },

  actionBtns: { paddingHorizontal: 20, gap: 10 },
  actionBtn: { borderRadius: 50, overflow: "hidden" },
  actionBtnGradient: {
    alignItems: "center",
    paddingVertical: 15,
  },
  actionBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  actionBtnDark: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 50,
  },
  actionBtnTextDark: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },

  recentSection: { paddingHorizontal: 20, gap: 14 },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  aiSelectBtn: { borderRadius: 20, overflow: "hidden" },
  aiSelectBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    gap: 5,
  },
  aiSelectBtnIcon: { color: "#fff", fontSize: 12 },
  aiSelectBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoCell: {
    width: (width - 56) / 2,
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    backgroundColor: Colors.bgCard,
  },
  photoCellLarge: {
    height: 180,
  },
  photoTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.gradientPurple,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  photoTagRed: { backgroundColor: Colors.accentRed },
  photoTagText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  // Empty recent photos
  emptyRecent: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  emptyRecentText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
