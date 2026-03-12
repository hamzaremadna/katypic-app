import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Gradients } from "../../theme/colors";
import { BottomTabBar } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";

const { width } = Dimensions.get("window");

const CELL_SIZE = (width - 56) / 2;

interface Photo {
  id: string;
  colors: readonly [string, string];
  tag: string | null;
  tagType: "doublon" | "yeux" | null;
  selected: boolean;
}

const MOCK_PHOTOS: Photo[] = [
  {
    id: "1",
    colors: ["#5A8B3A", "#2A5A1A"],
    tag: null,
    tagType: null,
    selected: false,
  },
  {
    id: "2",
    colors: ["#8B8B5A", "#5A5A2A"],
    tag: null,
    tagType: null,
    selected: false,
  },
  {
    id: "3",
    colors: ["#3A5A8B", "#1A2A5A"],
    tag: null,
    tagType: null,
    selected: false,
  },
  {
    id: "4",
    colors: ["#5A3A8B", "#2A1A5A"],
    tag: "Doublon",
    tagType: "doublon",
    selected: false,
  },
  {
    id: "5",
    colors: ["#2A5A3A", "#1A3A2A"],
    tag: null,
    tagType: null,
    selected: false,
  },
  {
    id: "6",
    colors: ["#8B5A3A", "#5A2A1A"],
    tag: null,
    tagType: null,
    selected: false,
  },
  {
    id: "7",
    colors: ["#3A8B5A", "#1A5A2A"],
    tag: null,
    tagType: null,
    selected: false,
  },
  {
    id: "8",
    colors: ["#5A3A5A", "#2A1A2A"],
    tag: "Doublon",
    tagType: "doublon",
    selected: false,
  },
];

function PhotoCell({
  photo,
  onToggle,
  index,
}: {
  photo: Photo;
  onToggle: (id: string) => void;
  index: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
    >
      <TouchableOpacity
        style={[pc.cell, photo.selected && pc.cellSelected]}
        onPress={() => onToggle(photo.id)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={photo.colors}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Selection overlay */}
        {photo.selected && (
          <View style={pc.selectedOverlay}>
            <LinearGradient
              colors={["rgba(233,30,140,0.3)", "rgba(123,47,190,0.2)"]}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
        )}

        {/* Tag badge */}
        {photo.tag && (
          <View style={[pc.tag, photo.tagType === "doublon" && pc.tagDoublon]}>
            <Text style={pc.tagIcon}>
              {photo.tagType === "doublon" ? "⧉" : "◉"}
            </Text>
            <Text style={pc.tagText}>{photo.tag}</Text>
          </View>
        )}

        {/* Upload/bookmark button */}
        <TouchableOpacity style={pc.bookmark}>
          <LinearGradient
            colors={Gradients.purpleBlue}
            style={pc.bookmarkGradient}
          >
            <Icon name="upload" size={12} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Selected checkmark */}
        {photo.selected && (
          <View style={pc.checkmark}>
            <LinearGradient
              colors={Gradients.brand}
              style={pc.checkmarkGradient}
            >
              <Icon name="check" size={12} color="#fff" />
            </LinearGradient>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const pc = StyleSheet.create({
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE * 0.8,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: Colors.bgCard,
  },
  cellSelected: {
    borderWidth: 2.5,
    borderColor: Colors.accentRed,
  },
  selectedOverlay: { ...StyleSheet.absoluteFillObject },
  tag: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.gradientPurple,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 3,
  },
  tagDoublon: { backgroundColor: Colors.accentRed },
  tagIcon: { fontSize: 10, color: "#fff" },
  tagText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  bookmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    zIndex: 3,
  },
  bookmarkGradient: { flex: 1, alignItems: "center", justifyContent: "center" },
  bookmarkIcon: { color: "#fff", fontSize: 12 },
  checkmark: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 4,
  },
  checkmarkGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkIcon: { color: "#fff", fontSize: 12, fontWeight: "800" },
});

export default function AISelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type: string }>();
  const [photos, setPhotos] = useState<Photo[]>(MOCK_PHOTOS);

  const selectedPhotos = photos.filter((p) => p.selected);
  const selectedCount = selectedPhotos.length;

  const headerFade = useRef(new Animated.Value(0)).current;
  const actionBarSlide = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.spring(actionBarSlide, {
      toValue: selectedCount > 0 ? 0 : -80,
      tension: 70,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [selectedCount]);

  const togglePhoto = (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleDelete = () => {
    Alert.alert(
      `Supprimer ${selectedCount} photo(s) ?`,
      "Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => setPhotos((prev) => prev.filter((p) => !p.selected)),
        },
      ]
    );
  };

  const handleCancel = () => {
    setPhotos((prev) => prev.map((p) => ({ ...p, selected: false })));
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <Animated.View style={[s.header, { opacity: headerFade }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Sélection IA</Text>
        <TouchableOpacity style={s.settingsBtn}>
          <Icon name="settings" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Action bar (appears when items selected) */}
      <Animated.View
        style={[s.actionBar, { transform: [{ translateY: actionBarSlide }] }]}
      >
        <LinearGradient colors={Gradients.purpleBlue} style={s.actionBarBg} />
        <Text style={s.actionBarCount}>
          {selectedCount} photo(s){"\n"}sélectionnée(s)
        </Text>
        <View style={s.actionBarBtns}>
          <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
            <LinearGradient
              colors={Gradients.redPink}
              style={s.deleteBtnGradient}
            >
              <Text style={s.deleteBtnText}>Supprimer</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
            <View style={s.cancelBtnInner}>
              <Text style={s.cancelBtnText}>Annuler</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        <View style={s.photoGrid}>
          {photos.map((photo, i) => (
            <PhotoCell
              key={photo.id}
              photo={photo}
              onToggle={togglePhoto}
              index={i}
            />
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabBar activeRoute="/(tabs)/camera" />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  backIcon: { color: Colors.textPrimary, fontSize: 22 },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  settingsBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: { fontSize: 18 },

  // Action bar
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: "hidden",
    position: "relative",
    zIndex: 10,
  },
  actionBarBg: { ...StyleSheet.absoluteFillObject },
  actionBarCount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 18,
  },
  actionBarBtns: { flexDirection: "row", gap: 10 },
  deleteBtn: { borderRadius: 20, overflow: "hidden" },
  deleteBtnGradient: { paddingVertical: 8, paddingHorizontal: 16 },
  deleteBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  cancelBtn: { borderRadius: 20, overflow: "hidden" },
  cancelBtnInner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
  },
  cancelBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
