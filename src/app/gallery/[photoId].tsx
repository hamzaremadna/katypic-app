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
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { KaytiHeader } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";
import { useDeletePhoto, usePhoto } from "../../hooks/usePhotos";
import { useAuthStore } from "../../stores/authStore";
import { hapticLight, hapticMedium, hapticHeavy } from "../../utils/haptics";

const { width } = Dimensions.get("window");
const PHOTO_HEIGHT = width; // square like Instagram

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function GalleryPhotoViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ photoId: string; photoUri: string }>();
  const photoUri = params.photoUri ?? "";
  const photoId = params.photoId ?? "";

  const deletePhoto = useDeletePhoto();
  const { data: photo } = usePhoto(photoId);
  const user = useAuthStore((s) => s.user);
  const [showShareModal, setShowShareModal] = useState(false);

  const score = photo?.analyses?.[0]?.overallScore;
  const username = user?.username ?? "moi";
  const initial = username[0]?.toUpperCase() ?? "?";

  const handleEdit = () => {
    hapticLight();
    router.push({ pathname: "/edit/[photoId]", params: { photoId, photoUri } });
  };

  const handleAnalyse = () => {
    hapticMedium();
    router.push({ pathname: "/analyse/result", params: { photoId, photoUri } });
  };

  const handleDelete = () => {
    hapticLight();
    Alert.alert("Supprimer la photo", "Cette action est irréversible.", [
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
    ]);
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0E0A24", "#080814"]} style={StyleSheet.absoluteFillObject} />

      <KaytiHeader showBack title="" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Photo */}
        <View style={s.photoWrap}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={s.photo} resizeMode="cover" />
          ) : (
            <View style={s.placeholder}>
              <Icon name="image" size={48} color={Colors.textMuted} />
            </View>
          )}
          {score !== undefined && (
            <View style={s.scoreBadge}>
              <Icon name="sparkles" size={12} color="#fff" />
              <Text style={s.scoreText}>{score}</Text>
            </View>
          )}
        </View>

        {/* User row + caption (Instagram style) */}
        <View style={s.metaSection}>
          <View style={s.userRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
            <View style={s.userInfo}>
              <Text style={s.username}>{username}</Text>
              {photo?.createdAt && (
                <Text style={s.date}>{formatDate(photo.createdAt)}</Text>
              )}
            </View>
          </View>

          {photo?.caption ? (
            <Text style={s.caption}>{photo.caption}</Text>
          ) : null}
        </View>

        {/* Divider */}
        <View style={s.divider} />

        {/* Actions */}
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

      </ScrollView>

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
  scroll: { paddingBottom: 40 },

  photoWrap: {
    width: width,
    height: PHOTO_HEIGHT,
    backgroundColor: "#0A0A14",
  },
  photo: { width: "100%", height: "100%" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },

  scoreBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(123,47,190,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  scoreText: { fontFamily: Fonts.bold, fontSize: 13, color: "#fff" },

  metaSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 10,
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: Fonts.bold, fontSize: 15, color: "#fff" },
  userInfo: { gap: 1 },
  username: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.textPrimary },
  date: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  caption: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 21,
    paddingLeft: 46,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 16,
    marginVertical: 12,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionItem: { alignItems: "center", gap: 6 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  actionLabel: { fontSize: 11, fontFamily: Fonts.medium, color: Colors.textSecondary },
});
