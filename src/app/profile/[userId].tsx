import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Share,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { navigate } from "@/utils/navigation";
import { useQuery } from "@tanstack/react-query";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { Icon } from "../../components/ui/Icon";
import { profileApi } from "../../services/api/profile.api";
import { Story } from "../../services/api/story.api";
import { useUserStories } from "../../hooks/useStories";
import { StoryViewer } from "../../components/profile/StoryViewer";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 40 - 8) / 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#E91E8C", "#7B2FBE", "#4A90E2", "#2D9B6E",
  "#E8833A", "#4A6FA5", "#9B59B6", "#2D7D32",
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

// ─── Public Profile Screen ─────────────────────────────────────────────────────

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["publicProfile", userId],
    queryFn: () => profileApi.getPublicProfile(userId).then((r) => r.data),
    enabled: !!userId,
  });

  const profile = data?.profile;
  const photos = data?.photos ?? [];

  const displayName =
    profile?.displayName ??
    profile?.user?.username ??
    "Photographe";
  const username = profile?.user?.username;
  const bio = profile?.bio ?? "Passionné de photographie.";
  const avatarUrl = profile?.avatarUrl;
  const avatarColor = userId ? getAvatarColor(userId) : "#7B2FBE";
  const initials = getInitials(displayName);

  const handleShare = () => {
    Share.share({
      message: `Découvrez le profil de ${displayName} sur KaytiPic !`,
    });
  };

  const handleMessage = () => {
    navigate(
      `/chat/${userId}?name=${encodeURIComponent(displayName)}`
    );
  };

  const [viewerStory, setViewerStory] = useState<Story | null>(null);
  const { data: userStories = [] } = useUserStories(userId);

  // ── Loading ──
  if (isLoading) {
    return (
      <View style={s.loadingContainer}>
        <StatusBar style="light" />
        <LinearGradient
          colors={["#0E0A24", "#080814"]}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator color={Colors.accentPurple} size="large" />
      </View>
    );
  }

  // ── Error ──
  if (isError || !profile) {
    return (
      <View style={s.loadingContainer}>
        <StatusBar style="light" />
        <LinearGradient
          colors={["#0E0A24", "#080814"]}
          style={StyleSheet.absoluteFillObject}
        />
        <TouchableOpacity style={s.backBtnAbsolute} onPress={() => router.back()}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Icon name="user" size={48} color={Colors.textMuted} />
        <Text style={s.errorText}>Profil introuvable</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
          <Text style={s.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        {/* ── Header ── */}
        <View style={s.header}>
          <LinearGradient
            colors={["#3D1880", "#1E3A8A"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>
            {displayName}
          </Text>
          <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
            <Icon name="share" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Avatar + Stats ── */}
        <View style={s.profileHeader}>
          <View style={s.topRow}>
            {/* Avatar */}
            <View style={s.avatarRingWrap}>
              <LinearGradient
                colors={Gradients.brand as [string, string]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={s.avatarInner}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={s.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[s.avatarFallback, { backgroundColor: avatarColor }]}>
                    <Text style={s.avatarInitial}>{initials}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Stats */}
            <View style={s.statsAndLevel}>
              <View style={s.statsRow}>
                <View style={s.statItem}>
                  <Text style={s.statNumber}>{photos.length}</Text>
                  <Text style={s.statLabel}>Photos</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Name, username & bio ── */}
        <View style={s.bioSection}>
          <Text style={s.displayName}>{displayName}</Text>
          {username && (
            <Text style={s.usernameText}>@{username}</Text>
          )}
          <Text style={s.bioText}>{bio}</Text>
        </View>

        {/* ── Action buttons ── */}
        <View style={s.actionRow}>
          <TouchableOpacity style={s.messageBtnWrap} onPress={handleMessage}>
            <LinearGradient
              colors={Gradients.brand as [string, string]}
              style={s.messageBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="message-chat" size={16} color="#fff" />
              <Text style={s.messageBtnText}>Envoyer un message</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── À la une ── */}
        {userStories.length > 0 && (
          <View style={s.storiesSection}>
            <Text style={s.storiesSectionTitle}>À la une</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.storiesRow}
            >
              {userStories.map((story) => (
                <TouchableOpacity
                  key={story.id}
                  style={s.storyItem}
                  onPress={() => setViewerStory(story)}
                  activeOpacity={0.8}
                >
                  <View style={s.storyRing}>
                    <LinearGradient
                      colors={Gradients.brand as [string, string]}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <View style={s.storyInner}>
                      {story.coverUrl ? (
                        <Image
                          source={{ uri: story.coverUrl }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={["#2D1060", "#1A1040"]}
                          style={{ flex: 1 }}
                        />
                      )}
                    </View>
                  </View>
                  <Text style={s.storyLabel} numberOfLines={1}>
                    {story.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Section title ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Photos</Text>
          <Text style={s.sectionCount}>{photos.length}</Text>
        </View>

        {/* ── Photo grid ── */}
        {photos.length === 0 ? (
          <View style={s.emptyPhotos}>
            <Icon name="image" size={36} color={Colors.textMuted} />
            <Text style={s.emptyText}>Aucune photo publique</Text>
          </View>
        ) : (
          <View style={s.photoGrid}>
            {photos.map((photo: any) => (
              <TouchableOpacity
                key={photo.id}
                style={s.photoItem}
                activeOpacity={0.85}
              >
                {photo.url ? (
                  <Image
                    source={{ uri: photo.url }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={["#2D1060", Colors.bgDark]}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <StoryViewer
        story={viewerStory}
        visible={viewerStory !== null}
        onClose={() => setViewerStory(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20 },

  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },

  backBtnAbsolute: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 36,
    left: 16,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: 16,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: "#fff",
  },
  shareBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  // Profile header
  profileHeader: { paddingHorizontal: 20, marginTop: 16 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 16 },

  // Avatar
  avatarRingWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: "hidden",
    padding: 2.5,
  },
  avatarInner: {
    position: "absolute",
    top: 2.5,
    left: 2.5,
    right: 2.5,
    bottom: 2.5,
    borderRadius: 39,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: Fonts.extrabold,
    fontSize: 28,
    color: "#fff",
  },

  // Stats
  statsAndLevel: { flex: 1 },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 24 },
  statItem: { alignItems: "center", gap: 2 },
  statNumber: {
    fontFamily: Fonts.extrabold,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Bio section
  bioSection: { paddingHorizontal: 20, marginTop: 14, gap: 4 },
  displayName: {
    fontFamily: Fonts.extrabold,
    fontSize: 17,
    color: Colors.textPrimary,
  },
  usernameText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textMuted,
  },
  bioText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },

  // Action buttons
  actionRow: { paddingHorizontal: 20, marginTop: 16 },
  messageBtnWrap: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: Colors.gradientPink,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  messageBtnGrad: {
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
  },
  messageBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: "#fff",
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.extrabold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  sectionCount: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.textMuted,
  },

  // Photo grid
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    gap: 10,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.bgCard,
  },

  // Empty / Error
  emptyPhotos: {
    alignItems: "center",
    paddingTop: 40,
    gap: 12,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textMuted,
  },
  errorText: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Colors.textMuted,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  retryText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // À la une stories
  storiesSection: { marginTop: 20, gap: 12 },
  storiesSectionTitle: {
    fontFamily: Fonts.extrabold,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingHorizontal: 20,
  },
  storiesRow: { paddingHorizontal: 20, gap: 16 },
  storyItem: { alignItems: "center", gap: 6, width: 68 },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    position: "relative",
  },
  storyInner: {
    position: "absolute",
    top: 2.5,
    left: 2.5,
    right: 2.5,
    bottom: 2.5,
    borderRadius: 30,
    overflow: "hidden",
  },
  storyLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
