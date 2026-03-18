import React, { useState, useCallback } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradients } from "@theme/colors";
import { Fonts } from "@theme/typography";
import { Icon } from "@components/ui/Icon";
import { usePhotos } from "@hooks/usePhotos";
import { useCreateStory } from "@hooks/useStories";
import { Photo } from "@services/api/photo.api";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 48 - 8) / 3;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function StoryCreationModal({ visible, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: photosData, isLoading: photosLoading } = usePhotos();
  const photos: Photo[] = photosData?.photos ?? [];

  const createStory = useCreateStory();

  const togglePhoto = useCallback((id: string) => {
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
        photoIds: [...selectedIds],
      });
      setTitle("");
      setSelectedIds(new Set());
      onClose();
    } catch {
      Alert.alert("Erreur", "Impossible de créer la sélection.");
    }
  };

  const handleClose = () => {
    setTitle("");
    setSelectedIds(new Set());
    onClose();
  };

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
    marginBottom: 20,
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
