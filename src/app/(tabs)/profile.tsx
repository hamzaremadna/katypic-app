import { useState, useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Share,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Colors, Gradients } from "../../theme/colors";
import { KaytiHeader, BottomTabBar } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";
import { useRouter } from "expo-router";
import { navigate } from "@/utils/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/authStore";
import { profileApi } from "../../services/api/profile.api";
import { messageApi, Conversation } from "../../services/api/message.api";
import { usePhotos } from "../../hooks/usePhotos";
import { Photo } from "../../services/api/photo.api";
import { Story } from "../../services/api/story.api";
import { useMyStories } from "../../hooks/useStories";
import { StoryCreationModal } from "../../components/profile/StoryCreationModal";
import { StoryViewer } from "../../components/profile/StoryViewer";
import { hapticLight } from "../../utils/haptics";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 40 - 8) / 3;

type StoryItem = Story | { id: "new"; isAdd: true };

// ─── Avatar helper (deterministic color from userId) ─────
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

// ─── Story Circle ────────────────────────────────────────
function StoryCircle({
  story,
  onPress,
}: {
  story: StoryItem;
  onPress: () => void;
}) {
  const isAdd = "isAdd" in story;
  const coverUrl = !isAdd ? (story as Story).coverUrl : null;
  const label = isAdd ? "Nouveau+" : (story as Story).title;

  return (
    <TouchableOpacity style={s.storyItem} onPress={onPress} activeOpacity={0.8}>
      <View style={s.storyRing}>
        <LinearGradient
          colors={isAdd ? ["#606080", "#404060"] : (Gradients.brand as [string, string])}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={s.storyInner}>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={isAdd ? [Colors.bgCard, Colors.bgDark] : ["#2D1060", "#1A1040"]}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            />
          )}
          {isAdd && (
            <View style={s.storyAddOverlay}>
              <Text style={s.storyAddIcon}>+</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={s.storyLabel} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Friend Card ─────────────────────────────────────────
function FriendCard({
  conversation,
  onChat,
  onView,
}: {
  conversation: Conversation;
  onChat: () => void;
  onView: () => void;
}) {
  const color = getAvatarColor(conversation.userId);
  const initials = conversation.username.slice(0, 2).toUpperCase();

  return (
    <View style={s.friendCard}>
      <View style={[s.friendAvatar, { backgroundColor: color }]}>
        <Text style={s.friendAvatarText}>{initials}</Text>
      </View>
      <View style={s.friendInfo}>
        <Text style={s.friendName}>{conversation.username}</Text>
        <Text style={s.friendCommon} numberOfLines={1}>
          {conversation.lastMessage}
        </Text>
      </View>
      <TouchableOpacity style={s.friendChatBtn} onPress={onChat}>
        <Icon name="message-chat" size={14} color={Colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity style={s.friendViewBtn} onPress={onView}>
        <Text style={s.friendViewText}>Voir</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<"photos" | "amis">("photos");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewerStory, setViewerStory] = useState<Story | null>(null);

  const { data: myStories = [] } = useMyStories();

  const { data: profile } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileApi.getMyProfile().then((r) => r.data),
  });

  const { data: creative } = useQuery({
    queryKey: ["creative-profile"],
    queryFn: () => profileApi.getCreativeProfile().then((r) => r.data),
  });

  const { data: conversations = [], isLoading: convLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messageApi.getConversations().then((r) => r.data),
    enabled: activeTab === "amis",
    refetchInterval: 30000,
  });

  // ── Real photos ──
  const { data: photosData, isLoading: photosLoading, refetch: refetchPhotos } = usePhotos();
  // Profile only shows photos explicitly added by the user (isPublic = true)
  const userPhotos: Photo[] = (photosData?.photos ?? []).filter((p) => p.isPublic);
  const photoCount = userPhotos.length;

  // Refetch when screen regains focus (e.g. after taking a photo)
  useFocusEffect(useCallback(() => { refetchPhotos(); }, [refetchPhotos]));

  const displayName = profile?.displayName ?? authUser?.username ?? "Photographe";
  const bio = profile?.bio ?? "Passionné de photographie.";
  const avatarUrl = profile?.avatarUrl;
  const locationDisplay = useMemo(
    () =>
      profile?.city && profile?.country
        ? `${profile.city}, ${profile.country}`
        : profile?.city || profile?.country || "Non renseignée",
    [profile?.city, profile?.country],
  );

  // Specialties from creative profile → shown as hashtags
  const hashtags = useMemo<string[]>(
    () =>
      creative?.visualPreferences?.length
        ? creative.visualPreferences.slice(0, 5).map((t) => `#${t}`)
        : [],
    [creative?.visualPreferences],
  );

  const analysesCount = useMemo(
    () => userPhotos.filter((p) => (p.analyses?.length ?? 0) > 0).length,
    [userPhotos],
  );

  const handleGoToEditProfile = useCallback(() => {
    hapticLight();
    navigate("/edit-profile");
  }, []);

  const handleGoToMessages = useCallback(() => {
    hapticLight();
    navigate("/messages");
  }, []);

  const handleGoToFriends = useCallback(() => {
    hapticLight();
    navigate("/friends");
  }, []);

  const handleSetPhotosTab = useCallback(() => {
    hapticLight();
    setActiveTab("photos");
  }, []);

  const handleSetAmisTab = useCallback(() => {
    hapticLight();
    setActiveTab("amis");
  }, []);

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0E0A24", "#080814"]} style={StyleSheet.absoluteFillObject} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => refetchPhotos()}
            tintColor={Colors.accentPurple}
          />
        }
      >
        <KaytiHeader showBack title="Mon profil" />

        {/* ── Profile header ── */}
        <View style={s.profileHeader}>
          <View style={s.topRow}>

            {/* Avatar with gradient ring */}
            <TouchableOpacity
              style={s.avatarRingWrap}
              onPress={handleGoToEditProfile}
            >
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
                  <LinearGradient
                    colors={["#2D1060", "#4D2090"]}
                    style={[s.avatarFallback]}
                  >
                    <Text style={s.avatarInitial}>
                      {displayName[0]?.toUpperCase() ?? "?"}
                    </Text>
                  </LinearGradient>
                )}
              </View>
            </TouchableOpacity>

            {/* Stats + Level */}
            <View style={s.statsAndLevel}>
              <View style={s.statsRow}>
                <View style={s.statItem}>
                  <Text style={s.statNumber}>{photoCount}</Text>
                  <Text style={s.statLabel}>Photos</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={s.statNumber}>{conversations.length}</Text>
                  <Text style={s.statLabel}>Amis</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={s.statNumber}>{analysesCount}</Text>
                  <Text style={s.statLabel}>Analyses</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Action buttons ── */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={s.actionBtnPrimary}
            onPress={handleGoToEditProfile}
          >
            <LinearGradient
              colors={Gradients.brand as [string, string]}
              style={s.actionBtnPrimaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="edit" size={14} color="#fff" />
              <Text style={s.actionBtnPrimaryText}>Modifier</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionBtnDark}
            onPress={handleGoToMessages}
          >
            <Icon name="message-circle" size={14} color={Colors.textSecondary} />
            <Text style={s.actionBtnDarkText}>Messagerie</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionBtnIcon}
            onPress={handleGoToFriends}
          >
            <Icon name="users" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Username & bio ── */}
        <View style={s.bioSection}>
          <Text style={s.username}>{displayName}</Text>
          <Text style={s.bioText}>{bio}</Text>
          <View style={s.locationRow}>
            <Icon name="marker-pin" size={12} color={Colors.textMuted} />
            <Text style={s.locationText}>{locationDisplay}</Text>
          </View>
        </View>

        {/* ── À la une ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>À la une</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.storiesRow}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
            {/* "Nouveau+" button always first */}
            <StoryCircle
              story={{ id: "new", isAdd: true }}
              onPress={() => { hapticLight(); setShowCreateModal(true); }}
            />
            {myStories.map((story) => (
              <StoryCircle
                key={story.id}
                story={story}
                onPress={() => { hapticLight(); setViewerStory(story); }}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── Hashtags (from specialties) ── */}
        {hashtags.length > 0 && (
          <View style={s.hashtagRow}>
            {hashtags.map((tag) => (
              <View key={tag} style={s.hashtagPill}>
                <Text style={s.hashtagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Tab selector ── */}
        <View style={s.tabSelector}>
          {(["photos", "amis"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={tab === "photos" ? handleSetPhotosTab : handleSetAmisTab}
            >
              {activeTab === tab && (
                <LinearGradient
                  colors={Gradients.brand as [string, string]}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              )}
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === "photos" ? "Photos" : "Amis"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab content ── */}
        {activeTab === "photos" ? (
          <View style={s.photoGrid}>
            {photosLoading ? (
              <View style={s.photosLoading}>
                <ActivityIndicator color={Colors.accentPurple} />
              </View>
            ) : userPhotos.length === 0 ? (
              <View style={s.emptyPhotos}>
                <Icon name="camera" size={36} color={Colors.textMuted} />
                <Text style={s.emptyPhotosText}>
                  Aucune photo pour l&apos;instant
                </Text>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: "/(tabs)/camera", params: { source: "profile" } } as never)}
                >
                  <Text style={s.emptyPhotosLink}>Prendre une photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Always-visible Add button */}
                <TouchableOpacity
                  style={[s.photoItem, s.photoAddItem]}
                  onPress={() => { hapticLight(); router.push({ pathname: "/(tabs)/camera", params: { source: "profile" } } as never); }}
                >
                  <Icon name="plus" size={28} color={Colors.textMuted} />
                </TouchableOpacity>
                {userPhotos.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={s.photoItem}
                    onPress={() => {
                      hapticLight();
                      router.push({
                        pathname: "/gallery/[photoId]",
                        params: { photoId: photo.id, photoUri: photo.url },
                      });
                    }}
                  >
                    <Image
                      source={{ uri: photo.url }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        ) : (
          <View style={s.friendsList}>
            {convLoading ? (
              <ActivityIndicator
                color={Colors.accentPurple}
                style={{ marginTop: 32 }}
              />
            ) : conversations.length === 0 ? (
              <View style={s.emptyFriends}>
                <Icon name="users" size={36} color={Colors.textMuted} />
                <Text style={s.emptyFriendsText}>Aucune conversation pour l'instant</Text>
              </View>
            ) : (
              conversations.map((conv) => (
                <FriendCard
                  key={conv.userId}
                  conversation={conv}
                  onChat={() =>
                    navigate(
                      `/chat/${conv.userId}?name=${encodeURIComponent(conv.username)}`
                    )
                  }
                  onView={() =>
                    navigate(`/profile/${conv.userId}`)
                  }
                />
              ))
            )}
          </View>
        )}

        <View style={s.bottomSpacer} />
      </ScrollView>

      <BottomTabBar activeRoute="/(tabs)/profile" />

      <StoryCreationModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <StoryViewer
        story={viewerStory}
        visible={viewerStory !== null}
        onClose={() => setViewerStory(null)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20 },

  // Profile header
  profileHeader: { paddingHorizontal: 20, marginTop: 8 },
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
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },

  // Stats
  statsAndLevel: { flex: 1 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statItem: { alignItems: "center", gap: 2 },
  statNumber: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: "500" },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.divider },
  levelText: { fontSize: 14, fontWeight: "700", color: Colors.accentPink, textAlign: "center" },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 16,
    alignItems: "center",
  },
  actionBtnPrimary: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: Colors.gradientPink,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  actionBtnPrimaryGradient: {
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
  },
  actionBtnPrimaryText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  actionBtnDark: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  actionBtnDarkText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  actionBtnIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  // Bio section
  bioSection: { paddingHorizontal: 20, marginTop: 16, gap: 6 },
  username: { fontSize: 17, fontWeight: "800", color: Colors.textPrimary },
  bioText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  locationText: { fontSize: 13, color: Colors.textMuted, fontWeight: "500" },

  // Section
  section: { marginTop: 20, gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
    paddingHorizontal: 20,
  },

  // Stories
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
  storyAddOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,10,20,0.6)",
  },
  storyAddIcon: { fontSize: 26, color: Colors.textPrimary, fontWeight: "300" },
  storyLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
    textAlign: "center",
  },

  // Hashtags
  hashtagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    marginTop: 14,
    gap: 8,
  },
  hashtagPill: {
    backgroundColor: "rgba(123,47,190,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(123,47,190,0.3)",
  },
  hashtagText: { fontSize: 13, color: Colors.accentPurple, fontWeight: "600" },

  // Tab selector
  tabSelector: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 14,
    backgroundColor: Colors.bgCard,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    overflow: "hidden",
  },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: "600", color: Colors.textMuted },
  tabTextActive: { color: Colors.textPrimary, fontWeight: "700" },

  // Photo grid
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    marginTop: 16,
    gap: 10,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.bgCard,
  },
  photoAddItem: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    borderStyle: "dashed",
  },
  photosLoading: {
    width: "100%",
    alignItems: "center",
    paddingTop: 32,
  },
  emptyPhotos: {
    width: "100%",
    alignItems: "center",
    paddingTop: 48,
    gap: 10,
  },
  emptyPhotosText: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: "center",
  },
  emptyPhotosLink: {
    fontSize: 14,
    color: Colors.accentPurple,
    fontWeight: "600",
  },

  // Friends
  friendsList: { paddingHorizontal: 20, marginTop: 16, gap: 10 },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  friendAvatarText: { color: Colors.textPrimary, fontSize: 17, fontWeight: "800" },
  friendInfo: { flex: 1, gap: 2 },
  friendName: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  friendCommon: { fontSize: 12, color: Colors.textMuted },
  friendChatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  friendViewBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(123,47,190,0.2)",
    borderWidth: 1,
    borderColor: "rgba(123,47,190,0.4)",
  },
  friendViewText: { fontSize: 13, fontWeight: "600", color: Colors.accentPurple },

  emptyFriends: { alignItems: "center", paddingTop: 48, gap: 12 },
  emptyFriendsText: { fontSize: 15, color: Colors.textMuted, textAlign: "center" },
  bottomSpacer: { height: 100 },
});
