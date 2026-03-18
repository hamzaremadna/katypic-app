import React, { useState, useRef, useEffect, useMemo } from "react";
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
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Gradients } from "../../theme/colors";
import { Icon } from "../../components/ui/Icon";
import { usePhotos, useDeletePhoto } from "../../hooks/usePhotos";
import { Photo } from "../../services/api/photo.api";

const { width } = Dimensions.get("window");
const CELL_SIZE = (width - 56) / 2;

// ── Anomaly helpers ──────────────────────────────────────────────────────────
function isFlou(p: Photo): boolean {
  return (p.analyses?.[0]?.technicalScore ?? 100) < 50;
}
function isYeux(p: Photo): boolean {
  return (p.analyses?.[0]?.compositionScore ?? 100) < 45;
}
function isDoublon(p: Photo): boolean {
  return !p.analyses?.length;
}
function getTag(
  p: Photo
): { label: string; type: "doublon" | "yeux" | "flou" } | null {
  if (isDoublon(p)) return { label: "Doublon", type: "doublon" };
  if (isFlou(p)) return { label: "Flou", type: "flou" };
  if (isYeux(p)) return { label: "Yeux", type: "yeux" };
  return null;
}

// ── PhotoCell ────────────────────────────────────────────────────────────────
function PhotoCell({
  photo,
  selected,
  onToggle,
  index,
}: {
  photo: Photo;
  selected: boolean;
  onToggle: (id: string) => void;
  index: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const tag = getTag(photo);

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
        style={[pc.cell, selected && pc.cellSelected]}
        onPress={() => onToggle(photo.id)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: photo.url }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />

        {/* Selection overlay */}
        {selected && (
          <View style={pc.selectedOverlay}>
            <LinearGradient
              colors={["rgba(233,30,140,0.3)", "rgba(123,47,190,0.2)"]}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
        )}

        {/* Tag badge */}
        {tag && (
          <View style={[pc.tag, tag.type === "doublon" && pc.tagDoublon]}>
            <Text style={pc.tagIcon}>
              {tag.type === "doublon" ? "⧉" : tag.type === "flou" ? "◎" : "◉"}
            </Text>
            <Text style={pc.tagText}>{tag.label}</Text>
          </View>
        )}

        {/* Analyse button */}
        <TouchableOpacity style={pc.bookmark}>
          <LinearGradient
            colors={Gradients.purpleBlue}
            style={pc.bookmarkGradient}
          >
            <Icon name="upload" size={12} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Selected checkmark */}
        {selected && (
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
});

// ── Screen ───────────────────────────────────────────────────────────────────
export default function AISelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type: string }>();
  const { data: photosData, isLoading } = usePhotos();
  const deletePhoto = useDeletePhoto();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const headerFade = useRef(new Animated.Value(0)).current;
  const actionBarSlide = useRef(new Animated.Value(-80)).current;

  // Filter photos based on the anomaly type requested
  const filteredPhotos = useMemo(() => {
    const photos = photosData?.photos ?? [];
    const type = params.type;
    if (type === "flou") return photos.filter(isFlou);
    if (type === "yeux") return photos.filter(isYeux);
    if (type === "doublon") return photos.filter(isDoublon);
    // "all" → union of every anomaly type
    return photos.filter((p) => isFlou(p) || isYeux(p) || isDoublon(p));
  }, [photosData, params.type]);

  // Pre-select all matching photos once data arrives
  useEffect(() => {
    if (filteredPhotos.length > 0) {
      setSelectedIds(new Set(filteredPhotos.map((p) => p.id)));
    }
  }, [filteredPhotos.length]);

  const selectedCount = selectedIds.size;

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
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
          onPress: async () => {
            setIsDeleting(true);
            try {
              for (const id of selectedIds) {
                await deletePhoto.mutateAsync(id);
              }
              router.back();
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setSelectedIds(new Set());
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
        <View style={s.settingsBtn} />
      </Animated.View>

      {/* Action bar (slides in when photos are selected) */}
      <Animated.View
        style={[s.actionBar, { transform: [{ translateY: actionBarSlide }] }]}
      >
        <LinearGradient colors={Gradients.purpleBlue} style={s.actionBarBg} />
        <Text style={s.actionBarCount}>
          {selectedCount} photo(s){"\n"}sélectionnée(s)
        </Text>
        <View style={s.actionBarBtns}>
          <TouchableOpacity
            style={s.deleteBtn}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            <LinearGradient
              colors={Gradients.redPink}
              style={s.deleteBtnGradient}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.deleteBtnText}>Supprimer</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.cancelBtn}
            onPress={handleCancel}
            disabled={isDeleting}
          >
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
        {isLoading ? (
          <ActivityIndicator
            color={Colors.accentPink}
            style={{ marginTop: 40 }}
          />
        ) : filteredPhotos.length === 0 ? (
          <View style={s.empty}>
            <Icon name="sparkles" size={36} color={Colors.textMuted} />
            <Text style={s.emptyText}>Aucune anomalie détectée 🎉</Text>
            <Text style={s.emptySubtext}>
              Toutes tes photos ont l'air en bonne forme !
            </Text>
          </View>
        ) : (
          <View style={s.photoGrid}>
            {filteredPhotos.map((photo, i) => (
              <PhotoCell
                key={photo.id}
                photo={photo}
                selected={selectedIds.has(photo.id)}
                onToggle={togglePhoto}
                index={i}
              />
            ))}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

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
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  settingsBtn: { width: 36, height: 36 },

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
  deleteBtnGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
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

  // Empty state
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
