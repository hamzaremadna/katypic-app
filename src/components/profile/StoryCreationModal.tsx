import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { Colors, Gradients } from "@theme/colors";
import { Fonts } from "@theme/typography";
import { Icon } from "@components/ui/Icon";
import { hapticLight, hapticMedium } from "@/utils/haptics";
import { usePhotos } from "@hooks/usePhotos";
import { useCreateStory } from "@hooks/useStories";
import { Photo } from "@services/api/photo.api";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 48 - 8) / 3;
const PREVIEW_HEIGHT = width * 0.6;

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ─── Location Picker Modal ───────────────────────────────────────────────────
interface LocationResult { label: string; sublabel?: string; }

function LocationPicker({ visible, onSelect, onClose }: {
  visible: boolean;
  onSelect: (loc: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [gpsResult, setGpsResult] = useState<LocationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-detect GPS on open
  useEffect(() => {
    if (!visible) return;
    setQuery("");
    setResults([]);
    setGpsResult(null);
    (async () => {
      setGpsLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [place] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (place) {
          const label = [place.city ?? place.district ?? place.subregion, place.country].filter(Boolean).join(", ");
          const sublabel = [place.street, place.postalCode].filter(Boolean).join(" ");
          setGpsResult({ label, sublabel });
        }
      } catch { /* silent */ } finally {
        setGpsLoading(false);
      }
    })();
  }, [visible]);

  // Search as user types
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim()) { setResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const geo = await Location.geocodeAsync(query);
        const unique = new Map<string, LocationResult>();
        for (const g of geo.slice(0, 8)) {
          const [place] = await Location.reverseGeocodeAsync({ latitude: g.latitude, longitude: g.longitude });
          if (place) {
            const label = [place.city ?? place.district ?? place.subregion, place.country].filter(Boolean).join(", ");
            if (label && !unique.has(label)) unique.set(label, { label, sublabel: place.street ?? undefined });
          }
        }
        setResults(Array.from(unique.values()));
      } catch { setResults([]); } finally { setLoading(false); }
    }, 500);
  }, [query]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={lp.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={lp.inner}>
          {/* Header */}
          <View style={lp.header}>
            <TouchableOpacity onPress={onClose} style={lp.closeBtn}>
              <Icon name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={lp.title}>Ajouter un lieu</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Search bar */}
          <View style={lp.searchBar}>
            <Icon name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={lp.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher un lieu…"
              placeholderTextColor={Colors.textMuted}
              autoFocus
              returnKeyType="search"
            />
            {loading && <ActivityIndicator size="small" color={Colors.accentPurple} />}
          </View>

          {/* GPS suggestion */}
          {!query.trim() && (
            <TouchableOpacity
              style={lp.row}
              onPress={() => { if (gpsResult) { hapticLight(); onSelect(gpsResult.label); } }}
              disabled={gpsLoading || !gpsResult}
            >
              <View style={lp.iconWrap}>
                {gpsLoading ? <ActivityIndicator size="small" color={Colors.accentPurple} /> : <Icon name="marker-pin" size={18} color={Colors.accentPurple} />}
              </View>
              <View style={lp.rowText}>
                <Text style={lp.rowLabel}>{gpsResult ? gpsResult.label : "Utiliser ma position"}</Text>
                {gpsResult?.sublabel ? <Text style={lp.rowSub}>{gpsResult.sublabel}</Text> : null}
              </View>
            </TouchableOpacity>
          )}

          {/* Search results */}
          <FlatList
            data={results}
            keyExtractor={(r) => r.label}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={lp.row} onPress={() => { hapticLight(); onSelect(item.label); }}>
                <View style={lp.iconWrap}>
                  <Icon name="marker-pin" size={18} color={Colors.textSecondary} />
                </View>
                <View style={lp.rowText}>
                  <Text style={lp.rowLabel}>{item.label}</Text>
                  {item.sublabel ? <Text style={lp.rowSub}>{item.sublabel}</Text> : null}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={query.trim() && !loading ? (
              <Text style={lp.noResults}>Aucun résultat</Text>
            ) : null}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
const DEFAULT_TEXT_POS = { x: 40, y: PREVIEW_HEIGHT / 2 - 20 };
const DEFAULT_LOC_POS  = { x: 40, y: PREVIEW_HEIGHT / 2 + 40 };

export function StoryCreationModal({ visible, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [storyText, setStoryText] = useState("");
  const [editingText, setEditingText] = useState(false);

  // Sticker positions (ref = live drag, state = committed for render)
  const textPosRef = useRef({ ...DEFAULT_TEXT_POS });
  const [textPos, setTextPos] = useState({ ...DEFAULT_TEXT_POS });
  const locPosRef  = useRef({ ...DEFAULT_LOC_POS });
  const [locPos, setLocPos]   = useState({ ...DEFAULT_LOC_POS });

  const { data: photosData, isLoading: photosLoading } = usePhotos();
  const photos: Photo[] = photosData?.photos ?? [];
  const createStory = useCreateStory();

  // PanResponder for text sticker
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        textPosRef.current = {
          x: textPosRef.current.x + gs.dx,
          y: textPosRef.current.y + gs.dy,
        };
      },
      onPanResponderRelease: () => {
        setTextPos({ ...textPosRef.current });
      },
    })
  ).current;

  // PanResponder for location sticker
  const locPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        locPosRef.current = {
          x: locPosRef.current.x + gs.dx,
          y: locPosRef.current.y + gs.dy,
        };
      },
      onPanResponderRelease: () => {
        setLocPos({ ...locPosRef.current });
      },
    })
  ).current;

  const openLocationPicker = useCallback(() => {
    hapticLight();
    setShowLocationPicker(true);
  }, []);

  const togglePhoto = useCallback((id: string) => {
    hapticLight();
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

  const handleCreate = async () => {
    hapticMedium();
    if (!title.trim()) {
      Alert.alert("Titre requis", "Donne un nom à ta sélection.");
      return;
    }
    if (selectedIds.size === 0) {
      Alert.alert("Photos requises", "Sélectionne au moins une photo.");
      return;
    }
    try {
      await createStory.mutateAsync({
        title: title.trim(),
        location: location.trim() || undefined,
        photoIds: [...selectedIds],
      });
      setTitle("");
      setLocation("");
      setSelectedIds(new Set());
      setStoryText("");
      textPosRef.current = { ...DEFAULT_TEXT_POS };
      setTextPos({ ...DEFAULT_TEXT_POS });
      locPosRef.current = { ...DEFAULT_LOC_POS };
      setLocPos({ ...DEFAULT_LOC_POS });
      onClose();
    } catch {
      Alert.alert("Erreur", "Impossible de créer la sélection.");
    }
  };

  const handleClose = () => {
    hapticLight();
    setTitle("");
    setLocation("");
    setShowLocationPicker(false);
    setSelectedIds(new Set());
    setStoryText("");
    textPosRef.current = { ...DEFAULT_TEXT_POS };
    setTextPos({ ...DEFAULT_TEXT_POS });
    locPosRef.current = { ...DEFAULT_LOC_POS };
    setLocPos({ ...DEFAULT_LOC_POS });
    onClose();
  };

  // First selected photo for preview
  const firstSelectedPhoto = photos.find((p) => selectedIds.has(p.id));

  const renderPhoto = ({ item }: { item: Photo }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={s.photoCell}
        onPress={() => togglePhoto(item.id)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.thumbnailUrl ?? item.url }}
          style={s.photoImage}
          resizeMode="cover"
        />
        {isSelected && (
          <View style={s.photoOverlay}>
            <LinearGradient
              colors={["rgba(91,47,190,0.6)", "rgba(43,127,255,0.6)"]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={s.checkBadge}>
              <Icon name="check" size={12} color="#fff" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={s.container}>
        <LinearGradient
          colors={["#0E0A24", "#080814"]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
            <Icon name="x" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Nouvelle sélection</Text>
          <View style={s.headerSpacer} />
        </View>

        {/* Title Input */}
        <View style={s.inputSection}>
          <Text style={s.inputLabel}>NOM DE LA SÉLECTION</Text>
          <TextInput
            style={s.input}
            value={title}
            onChangeText={setTitle}
            placeholder="ex. Voyages, Nature, Portraits…"
            placeholderTextColor={Colors.textMuted}
            maxLength={30}
            autoFocus
          />
          <Text style={s.charCount}>{title.length}/30</Text>
        </View>

        {/* Story preview with stickers (shows when photo selected) */}
        {firstSelectedPhoto && (
          <View style={s.previewSection}>
            {/* Sticker toolbar */}
            <View style={s.stickerBar}>
              <TouchableOpacity
                style={[s.stickerBtn, storyText.trim() && s.stickerBtnActive]}
                onPress={() => { hapticLight(); setEditingText(true); }}
              >
                <Text style={s.stickerBtnLabel}>Aa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.stickerBtn, location.trim() && s.stickerBtnActive]}
                onPress={openLocationPicker}
              >
                <Icon name="marker-pin" size={16} color={location.trim() ? Colors.accentPurple : Colors.textSecondary} />
                <Text style={[s.stickerBtnLabel, location.trim() && { color: Colors.accentPurple }]}>Lieu</Text>
              </TouchableOpacity>
            </View>

            {/* Image canvas */}
            <View style={s.previewWrap}>
              <Image
                source={{ uri: firstSelectedPhoto.thumbnailUrl ?? firstSelectedPhoto.url }}
                style={s.previewImage}
                resizeMode="cover"
              />
              <View style={s.previewDim} />

              {/* Draggable text sticker */}
              {storyText.trim().length > 0 && (
                <View style={[s.textOverlay, { left: textPos.x, top: textPos.y }]} {...panResponder.panHandlers}>
                  <Text style={s.overlayText}>{storyText}</Text>
                </View>
              )}

              {/* Draggable location sticker */}
              {location.trim().length > 0 && (
                <View style={[s.locationSticker, { left: locPos.x, top: locPos.y }]} {...locPanResponder.panHandlers}>
                  <Icon name="marker-pin" size={12} color="#fff" />
                  <Text style={s.locationStickerText} numberOfLines={1}>{location}</Text>
                  <TouchableOpacity
                    onPress={() => { hapticLight(); setLocation(""); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="x" size={11} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {(storyText.trim() || location.trim()) && (
              <Text style={s.dragHint}>Faites glisser les stickers pour les repositionner</Text>
            )}
          </View>
        )}

        {/* Inline text editor overlay */}
        {editingText && (
          <Modal visible transparent animationType="fade">
            <View style={s.textEditorBg}>
              <TextInput
                style={s.textEditorInput}
                value={storyText}
                onChangeText={setStoryText}
                placeholder="Écrire sur la photo..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                autoFocus
                maxLength={100}
              />
              <TouchableOpacity
                style={s.textEditorDone}
                onPress={() => { hapticLight(); setEditingText(false); }}
              >
                <Text style={s.textEditorDoneText}>OK</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        )}

        {/* Photos section */}
        <Text style={s.photosLabel}>
          CHOISIR DES PHOTOS{" "}
          {selectedIds.size > 0 && (
            <Text style={s.selectedCount}>• {selectedIds.size} sélectionnée{selectedIds.size > 1 ? "s" : ""}</Text>
          )}
        </Text>

        {photosLoading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={Colors.accentPurple} />
          </View>
        ) : photos.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyText}>Aucune photo disponible.</Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            keyExtractor={(p) => p.id}
            renderItem={renderPhoto}
            numColumns={3}
            columnWrapperStyle={s.photoRow}
            contentContainerStyle={s.photoGrid}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Create button */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[
              s.createBtn,
              (createStory.isPending || !title.trim() || selectedIds.size === 0) &&
                s.createBtnDisabled,
            ]}
            onPress={handleCreate}
            disabled={createStory.isPending || !title.trim() || selectedIds.size === 0}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                !title.trim() || selectedIds.size === 0
                  ? (["#2A1F5C", "#2A1F5C"] as [string, string])
                  : (Gradients.brand as [string, string])
              }
              style={s.createBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {createStory.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.createBtnText}>Créer la sélection</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <LocationPicker
        visible={showLocationPicker}
        onSelect={(loc) => { setLocation(loc); setShowLocationPicker(false); }}
        onClose={() => setShowLocationPicker(false)}
      />
    </Modal>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0E0A24",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 36,
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.accentPurple,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  charCount: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "right",
    marginTop: 6,
  },
  stickerBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  stickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  stickerBtnActive: {
    borderColor: Colors.accentPurple,
    backgroundColor: "rgba(123,47,190,0.15)",
  },
  stickerBtnLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  locationSticker: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    maxWidth: 200,
  },
  locationStickerText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: "#fff",
    flex: 1,
  },

  // Story text preview
  previewSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  previewWrap: {
    height: PREVIEW_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.bgCard,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  textOverlay: {
    position: "absolute",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 8,
    maxWidth: width - 80,
  },
  overlayText: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  editTextBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  editTextBtnLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: "#fff",
  },
  dragHint: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 6,
  },

  // Full-screen text editor
  textEditorBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 20,
  },
  textEditorInput: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: "#fff",
    textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: "100%",
    maxHeight: 160,
  },
  textEditorDone: {
    backgroundColor: "#fff",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 50,
  },
  textEditorDoneText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: "#000",
  },

  photosLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.accentPurple,
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  selectedCount: {
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textMuted,
  },
  photoGrid: {
    paddingHorizontal: 20,
    gap: 4,
  },
  photoRow: {
    gap: 4,
    marginBottom: 4,
  },
  photoCell: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.bgCard,
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    padding: 6,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#5B2FBE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  createBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnText: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: "#fff",
  },
});

const lp = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    backgroundColor: "#0E0A24",
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(123,47,190,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  rowSub: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  noResults: {
    textAlign: "center",
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 32,
  },
});
