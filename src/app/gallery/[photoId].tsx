import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { KaytiHeader } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";
import { useDeletePhoto, usePhoto } from "../../hooks/usePhotos";
import { hapticLight, hapticMedium, hapticHeavy } from "../../utils/haptics";

const { width, height } = Dimensions.get("window");

// ─── Share caption modal ──────────────────────────────────────────────────────

interface ShareModalProps {
  visible: boolean;
  photoUri: string;
  onClose: () => void;
}

function ShareCaptionModal({ visible, photoUri, onClose }: ShareModalProps) {
  const [caption, setCaption] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleConfirmShare = async () => {
    hapticMedium();
    setIsSending(true);
    try {
      const message = caption.trim()
        ? `${caption.trim()}\n\nDécouvrez KaytiPic !`
        : "Découvrez cette photo sur KaytiPic !";
      await Share.share({ message, url: photoUri });
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
        style={sm.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={handleClose} />
        <View style={sm.sheet}>
          <LinearGradient colors={["#0E0A24", "#080814"]} style={StyleSheet.absoluteFillObject} />

          {/* Handle */}
          <View style={sm.handle} />

          <Text style={sm.title}>Partager la photo</Text>

          {/* Photo thumbnail */}
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={sm.thumb} resizeMode="cover" />
          ) : null}

          {/* Caption input */}
          <Text style={sm.label}>LÉGENDE</Text>
          <TextInput
            style={sm.input}
            value={caption}
            onChangeText={setCaption}
            placeholder="Écrire une légende..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={300}
            autoFocus={false}
          />
          <Text style={sm.charCount}>{caption.length}/300</Text>

          {/* Share button */}
          <TouchableOpacity
            style={sm.shareBtn}
            onPress={handleConfirmShare}
            activeOpacity={0.85}
            disabled={isSending}
          >
            <LinearGradient
              colors={Gradients.brand as [string, string]}
              style={sm.shareBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="share" size={18} color="#fff" />
              <Text style={sm.shareBtnText}>Partager</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={sm.cancelBtn} onPress={handleClose}>
            <Text style={sm.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const sm = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 4,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  thumb: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    backgroundColor: Colors.bgCard,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.accentPurple,
    letterSpacing: 1.5,
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
    minHeight: 80,
    textAlignVertical: "top",
  },
  charCount: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "right",
    marginTop: -4,
  },
  shareBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
  },
  shareBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  shareBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: "#fff" },
  cancelBtn: { alignItems: "center", paddingVertical: 8 },
  cancelText: { fontFamily: Fonts.medium, fontSize: 15, color: Colors.textMuted },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GalleryPhotoViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    photoId: string;
    photoUri: string;
  }>();

  const photoUri = params.photoUri ?? "";
  const photoId = params.photoId ?? "";

  const deletePhoto = useDeletePhoto();
  const { data: photo } = usePhoto(photoId);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleImport = () => {
    hapticMedium();
    router.push({
      pathname: "/analyse/import",
      params: { photoUri },
    });
  };

  const handleEdit = () => {
    hapticLight();
    router.push({
      pathname: "/edit/[photoId]",
      params: { photoId, photoUri },
    });
  };

  const handleAnalyse = () => {
    hapticMedium();
    router.push({
      pathname: "/analyse/result",
      params: { photoId, photoUri },
    });
  };

  const handleDelete = () => {
    hapticLight();
    Alert.alert(
      "Supprimer la photo",
      "Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            hapticHeavy();
            try {
              await deletePhoto.mutateAsync(photoId);
              router.back();
            } catch {
              Alert.alert("Erreur", "Impossible de supprimer la photo.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      <KaytiHeader showBack title="Ma Galerie" />

      {/* Full photo */}
      <View style={s.photoWrap}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={s.photo}
            resizeMode="contain"
          />
        ) : (
          <View style={s.placeholder}>
            <Icon name="image" size={48} color={Colors.textMuted} />
          </View>
        )}
      </View>

      {/* Caption */}
      {photo?.caption ? (
        <View style={s.captionWrap}>
          <Text style={s.captionText}>{photo.caption}</Text>
        </View>
      ) : null}

      {/* Action buttons row */}
      <View style={s.actionsRow}>
        <TouchableOpacity style={s.actionItem} onPress={handleAnalyse}>
          <View style={s.actionIcon}>
            <Icon name="sparkles" size={20} color={Colors.accentPurple} />
          </View>
          <Text style={s.actionLabel}>Analyser</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.actionItem} onPress={handleEdit}>
          <View style={s.actionIcon}>
            <Icon name="sliders" size={20} color={Colors.accentBlue} />
          </View>
          <Text style={s.actionLabel}>Retoucher</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.actionItem} onPress={() => { hapticLight(); setShowShareModal(true); }}>
          <View style={s.actionIcon}>
            <Icon name="share" size={20} color={Colors.textSecondary} />
          </View>
          <Text style={s.actionLabel}>Partager</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.actionItem} onPress={handleDelete}>
          <View style={s.actionIcon}>
            <Icon name="trash" size={20} color="#FF6B6B" />
          </View>
          <Text style={s.actionLabel}>Supprimer</Text>
        </TouchableOpacity>
      </View>

      {/* Import CTA */}
      <View style={s.importWrap}>
        <TouchableOpacity
          style={s.importBtn}
          onPress={handleImport}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={Gradients.brand as [string, string]}
            style={s.importBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={s.importBtnText}>Importer</Text>
            <Icon name="chevron-right" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ShareCaptionModal
        visible={showShareModal}
        photoUri={photoUri}
        onClose={() => setShowShareModal(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },

  photoWrap: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: "#0A0A14",
  },
  photo: { width: "100%", height: "100%" },
  captionWrap: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  captionText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 24,
  },
  actionItem: { alignItems: "center", gap: 6 },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },

  importWrap: { paddingHorizontal: 20, paddingBottom: 16 },
  importBtn: { borderRadius: 16, overflow: "hidden" },
  importBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  importBtnText: { fontSize: 16, fontFamily: Fonts.bold, color: "#fff" },
});
