import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { KaytiHeader, BottomTabBar } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";

const { width, height } = Dimensions.get("window");

export default function GalleryPhotoViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    photoId: string;
    photoUri: string;
  }>();

  const photoUri = params.photoUri ?? "";
  const photoId = params.photoId ?? "";

  const handleImport = () => {
    // Navigate to analysis import with this photo
    router.push({
      pathname: "/analyse/import",
      params: { photoUri },
    });
  };

  const handleEdit = () => {
    router.push({
      pathname: "/edit/[photoId]",
      params: { photoId, photoUri },
    });
  };

  const handleAnalyse = () => {
    router.push({
      pathname: "/analyse/result",
      params: { photoId, photoUri },
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: "Découvrez cette photo sur KaytiPic !",
        url: photoUri,
      });
    } catch {
      // User cancelled
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Supprimer la photo",
      "Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => router.back(),
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

        <TouchableOpacity style={s.actionItem} onPress={handleShare}>
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

      <BottomTabBar activeRoute="/(tabs)/gallery" />
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
