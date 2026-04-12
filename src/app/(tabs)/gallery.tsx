import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Share,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { Icon } from "../../components/ui/Icon";
import { Colors, Gradients } from "../../theme/colors";
import { KaytiHeader, BottomTabBar } from "../../components/ui";
import { usePhotos, useBatchDeletePhotos } from "../../hooks/usePhotos";
import { Photo } from "../../services/api/photo.api";
import { hapticLight, hapticMedium, hapticHeavy } from "../../utils/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 10;
const GRID_PADDING = 16;
const COLUMN_COUNT = 2;
const ITEM_WIDTH =
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / COLUMN_COUNT;

// Stable keyExtractor + getItemLayout avoid re-renders
const extractPhotoKey = (item: Photo) => item.id;
const ITEM_TOTAL = ITEM_WIDTH + GRID_GAP;
const getPhotoLayout = (_: unknown, index: number) => ({
  length: ITEM_TOTAL,
  offset: ITEM_TOTAL * Math.floor(index / COLUMN_COUNT),
  index,
});

export default function GalleryScreen() {
  const router = useRouter();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Real data ──
  const { data, isLoading, refetch } = usePhotos();

  // Refetch photos when screen gains focus (e.g. after deleting elsewhere)
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));
  const photos: Photo[] = data?.photos ?? [];
  const totalCount = data?.total ?? 0;
  const batchDelete = useBatchDeletePhotos();

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => {
      if (prev) {
        setSelectedIds(new Set());
      }
      return !prev;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)));
    }
  }, [selectedIds.size, photos]);

  const handlePhotoPress = useCallback(
    (id: string) => {
      hapticLight();
      if (selectionMode) {
        toggleSelect(id);
      } else {
        // Navigate to full photo view
        const photo = photos.find((p) => p.id === id);
        if (photo) {
          router.push({
            pathname: "/gallery/[photoId]",
            params: { photoId: id, photoUri: photo.url },
          });
        }
      }
    },
    [selectionMode, toggleSelect, photos, router],
  );

  const handleLongPress = useCallback(
    (id: string) => {
      if (!selectionMode) {
        setSelectionMode(true);
        setSelectedIds(new Set([id]));
      }
    },
    [selectionMode],
  );

  const handleDelete = useCallback(() => {
    const count = selectedIds.size;
    Alert.alert(
      "Supprimer",
      `Supprimer ${count} photo${count > 1 ? "s" : ""} ? Cette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            hapticHeavy();
            const ids = Array.from(selectedIds);
            setSelectedIds(new Set());
            setSelectionMode(false);
            try {
              await batchDelete.mutateAsync(ids);
            } catch {
              Alert.alert("Erreur", "Certaines photos n'ont pas pu être supprimées.");
            }
          },
        },
      ],
    );
  }, [selectedIds, batchDelete]);

  const profileCount = useMemo(() => photos.filter((p) => p.isPublic).length, [photos]);

  const renderPhoto = useCallback(
    ({ item, index }: { item: Photo; index: number }) => {
      const isSelected = selectedIds.has(item.id);
      const isLeftColumn = index % 2 === 0;

      return (
        <TouchableOpacity
          style={[
            styles.photoContainer,
            { marginRight: isLeftColumn ? GRID_GAP : 0 },
          ]}
          activeOpacity={0.8}
          onPress={() => handlePhotoPress(item.id)}
          onLongPress={() => handleLongPress(item.id)}
        >
          <Image source={{ uri: item.url }} style={styles.photoImage} />
          {/* Analysis score badge */}
          {item.analyses && item.analyses.length > 0 && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeText}>
                {item.analyses[0].overallScore}
              </Text>
            </View>
          )}
          {selectionMode && (
            <View style={styles.checkboxOverlay}>
              <View
                style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected,
                ]}
              >
                {isSelected && (
                  <Icon name="check" size={14} color="#FFFFFF" />
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [selectionMode, selectedIds, handlePhotoPress, handleLongPress],
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFill}
      />

      <KaytiHeader
        showBack
        title="Ma Galerie"
        rightIcon={
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push("/(tabs)/settings" as never)}
          >
            <Icon name="settings" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        }
      />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalCount}</Text>
          <Text style={styles.statLabel}>Capturées</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profileCount}</Text>
          <Text style={styles.statLabel}>Profil</Text>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={styles.selectAllButton}
          onPress={() => {
            hapticLight();
            if (!selectionMode) {
              setSelectionMode(true);
              setSelectedIds(new Set(photos.map((p) => p.id)));
            } else {
              selectAll();
            }
          }}
        >
          <Icon name="check" size={14} color={Colors.textSecondary} />
          <Text style={styles.selectAllText}>Sélectionner</Text>
        </TouchableOpacity>
      </View>

      {/* Loading state */}
      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.accentPurple} />
        </View>
      ) : photos.length === 0 ? (
        /* Empty state */
        <View style={styles.emptyState}>
          <Icon name="image" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Aucune photo</Text>
          <Text style={styles.emptySubtitle}>
            Prenez votre première photo avec la caméra
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push("/(tabs)/camera" as never)}
          >
            <LinearGradient
              colors={Gradients.brand}
              style={styles.emptyBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="camera" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Prendre une photo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        /* Photo Grid */
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={extractPhotoKey}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          style={styles.grid}
          maxToRenderPerBatch={12}
          windowSize={5}
          removeClippedSubviews
          getItemLayout={getPhotoLayout}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.accentPurple} />
          }
        />
      )}

      {/* Selection Mode Bottom Bar */}
      {selectionMode && (
        <View style={styles.selectionBar}>
          <TouchableOpacity
            style={styles.selectionBarClose}
            onPress={toggleSelectionMode}
          >
            <Icon name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.selectionBarCount}>
            {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
          </Text>

          <TouchableOpacity
            style={styles.selectionBarAll}
            onPress={() => { hapticLight(); selectAll(); }}
          >
            <Text style={styles.selectionBarAllText}>Tout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => {
              hapticLight();
              Share.share({
                message: `${selectedIds.size} photo${selectedIds.size > 1 ? "s" : ""} partagée${selectedIds.size > 1 ? "s" : ""} depuis KaytiPic`,
              });
            }}
          >
            <LinearGradient
              colors={Gradients.purpleBlue}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shareButtonGradient}
            >
              <Icon name="share" size={16} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Partager</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Icon name="trash" size={18} color="#FF4444" />
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      )}

      <BottomTabBar activeRoute="/(tabs)/gallery" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A14" },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: GRID_PADDING,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  statItem: { alignItems: "center", gap: 2 },
  statNumber: { fontSize: 18, fontWeight: "700", color: "#7B2FBE" },
  statLabel: { fontSize: 11, color: Colors.textSecondary },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 16,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  selectAllText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  grid: { flex: 1 },
  gridContent: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 12,
    paddingBottom: 100,
  },
  photoContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: GRID_GAP,
    backgroundColor: "#1A1A2E",
  },
  photoImage: { width: "100%", height: "100%", borderRadius: 12 },
  scoreBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(123,47,190,0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  scoreBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  checkboxOverlay: { position: "absolute", bottom: 8, left: 8 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#7B2FBE",
    borderColor: "#7B2FBE",
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
  },
  emptyBtn: { borderRadius: 50, overflow: "hidden", marginTop: 16 },
  emptyBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 8,
  },
  emptyBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Selection bar
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1A1A2E",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  selectionBarClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionBarCount: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    flex: 1,
  },
  selectionBarAll: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  selectionBarAllText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  shareButton: { borderRadius: 10, overflow: "hidden" },
  shareButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  shareButtonText: { fontSize: 13, color: "#FFFFFF", fontWeight: "600" },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  deleteButtonText: { fontSize: 13, color: "#FF4444", fontWeight: "600" },
});
