import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
import { KaytiHeader } from "../../components/ui";
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
  counts,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
  counts: { all: number; doublon: number; yeux: number; flou: number };
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedType, setSelectedType] = useState("all");

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
    { id: "all", label: "Tous les problèmes", count: counts.all, icon: "✦" },
    { id: "doublon", label: "Doublons", count: counts.doublon, icon: "⧉" },
    { id: "yeux", label: "Yeux fermés", count: counts.yeux, icon: "◉" },
    { id: "flou", label: "Photos floues", count: counts.flou, icon: "◎" },
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
                style={[m.typeRow, selectedType === t.id && m.typeRowSelected]}
                onPress={() => setSelectedType(t.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    selectedType === t.id
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

          <TouchableOpacity style={m.manualBtn} onPress={() => onSelect(selectedType)}>
            <LinearGradient
              colors={Gradients.purpleBlue}
              style={m.manualBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={m.manualBtnText}>Suivant</Text>
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
    allowsMultipleSelection: true,
    quality: 0.9,
  });
  if (!result.canceled && result.assets.length > 0) {
    if (result.assets.length > 1) {
      Alert.alert(
        `${result.assets.length} photos sélectionnées`,
        "Chaque photo sera analysée séparément. Commençons par la première !",
        [{ text: "OK", onPress: () =>
          navigate(`/analyse/result?photoUri=${encodeURIComponent(result.assets[0].uri)}`)
        }]
      );
    } else {
      navigate(`/analyse/result?photoUri=${encodeURIComponent(result.assets[0].uri)}`);
    }
  }
}

export default function AnalyseImportScreen() {
  const router = useRouter();
  const [showAIModal, setShowAIModal] = useState(false);
  const headerFade = useRef(new Animated.Value(0)).current;

  // ── Real photos ──
  const { data: photosData } = usePhotos();
  const recentPhotos = photosData?.photos?.slice(0, 6) ?? [];

  // ── Anomaly counts for AI Selection modal ──
  const anomalies = useMemo(() => {
    const photos = photosData?.photos ?? [];
    const flou = photos.filter(
      (p) => (p.analyses?.[0]?.technicalScore ?? 100) < 50
    );
    const yeux = photos.filter(
      (p) => (p.analyses?.[0]?.compositionScore ?? 100) < 45
    );
    const doublon = photos.filter((p) => !p.analyses?.length);
    const allSet = new Set(
      [...flou, ...yeux, ...doublon].map((p) => p.id)
    );
    return {
      all: allSet.size,
      doublon: doublon.length,
      yeux: yeux.length,
      flou: flou.length,
    };
  }, [photosData]);

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

        {/* Subtitle */}
        <Animated.View style={[s.subtitleWrap, { opacity: headerFade }]}>
          <Text style={s.subtitle}>
            Importez une photo pour l'analyser ...
          </Text>
        </Animated.View>

        {/* Import card — centered vertical */}
        <TouchableOpacity
          style={s.importCard}
          activeOpacity={0.85}
          onPress={() => pickImageAndAnalyse(router)}
        >
          <LinearGradient
            colors={["#2A1565", "#1A0E55", "#120A3A"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={s.importCardBorder} />
          <Icon name="upload" size={28} color="#fff" />
          <Text style={s.importLabel}>Importer depuis la galerie</Text>
          <Text style={s.importSub}>Sélectionnez une photo à analyser</Text>
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
        </View>

        {/* Recent photos */}
        <View style={s.recentSection}>
          <View style={s.recentHeader}>
            <Text style={s.sectionTitle}>Photos récentes</Text>
            <View style={s.recentHeaderRight}>
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
              <TouchableOpacity style={s.gridIconBtn}>
                <Icon name="grid" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
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
              {/* First photo — large on left */}
              <TouchableOpacity
                style={s.photoCellLarge}
                onPress={() =>
                  handlePhotoPress(recentPhotos[0].id, recentPhotos[0].url)
                }
                activeOpacity={0.85}
              >
                <RNImage
                  source={{ uri: recentPhotos[0].url }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
                {recentPhotos[0].analyses &&
                  recentPhotos[0].analyses.length > 0 && (
                    <View style={s.photoTag}>
                      <Text style={s.photoTagText}>
                        Score: {recentPhotos[0].analyses[0].overallScore}
                      </Text>
                    </View>
                  )}
              </TouchableOpacity>
              {/* Right column — stacked */}
              <View style={s.photoColRight}>
                {recentPhotos.slice(1, 3).map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={s.photoCell}
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
            </View>
          )}

          {/* Additional photos row */}
          {recentPhotos.length > 3 && (
            <View style={s.photoRow}>
              {recentPhotos.slice(3, 5).map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={s.photoCellSmall}
                  onPress={() => handlePhotoPress(photo.id, photo.url)}
                  activeOpacity={0.85}
                >
                  <RNImage
                    source={{ uri: photo.url }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <AISelectionModal
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
        onSelect={(type) => {
          setShowAIModal(false);
          router.push(`/analyse/ai-selection?type=${type}`);
        }}
        counts={anomalies}
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

  subtitleWrap: { paddingHorizontal: 20 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },

  // Import card — centered vertical
  importCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 8,
    position: "relative",
  },
  importCardBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(123,47,190,0.5)",
    zIndex: 2,
  },
  importLabel: { fontSize: 16, fontWeight: "800", color: "#fff" },
  importSub: { fontSize: 13, color: "rgba(255,255,255,0.6)" },

  // Action buttons
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

  // Recent photos section
  recentSection: { paddingHorizontal: 20, gap: 14 },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recentHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  aiSelectBtn: { borderRadius: 20, overflow: "hidden" },
  aiSelectBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 5,
  },
  aiSelectBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  gridIconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  // Photo grid — first large left, 2 stacked right
  photoGrid: {
    flexDirection: "row",
    gap: 8,
  },
  photoCellLarge: {
    flex: 1,
    height: 290,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    backgroundColor: Colors.bgCard,
  },
  photoColRight: {
    flex: 1,
    gap: 8,
  },
  photoCell: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    backgroundColor: Colors.bgCard,
  },
  photoRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  photoCellSmall: {
    flex: 1,
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    backgroundColor: Colors.bgCard,
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
