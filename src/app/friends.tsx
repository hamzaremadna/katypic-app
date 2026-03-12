import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { navigate } from "@/utils/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors, Gradients } from "../theme/colors";
import { Fonts } from "../theme/typography";
import { KaytiHeader, BottomTabBar } from "../components/ui";
import { Icon } from "../components/ui/Icon";
import {
  friendshipApi,
  type FriendItem,
  type FriendRequestItem,
  type SearchUserItem,
} from "../services/api/friendship.api";

// ─── Types ───────────────────────────────────────────────
type TabKey = "amis" | "decouvrir" | "recues" | "envoyees";

// ─── Avatar Color Helper ─────────────────────────────────
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
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Friend Card ─────────────────────────────────────────
function FriendCard({
  friend,
  onMessage,
}: {
  friend: FriendItem;
  onMessage: () => void;
}) {
  const color = getAvatarColor(friend.userId);
  return (
    <View style={fc.card}>
      <View style={fc.avatarWrap}>
        <View style={[fc.avatar, { backgroundColor: color }]}>
          <Text style={fc.avatarText}>{getInitials(friend.displayName)}</Text>
        </View>
      </View>
      <View style={fc.info}>
        <View style={fc.nameRow}>
          <Text style={fc.name} numberOfLines={1}>
            {friend.displayName}
          </Text>
        </View>
        <Text style={fc.username}>@{friend.username}</Text>
      </View>
      <TouchableOpacity style={fc.messageBtn} onPress={onMessage}>
        <Text style={fc.messageBtnText}>Message</Text>
      </TouchableOpacity>
    </View>
  );
}

const fc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 17, fontFamily: Fonts.extrabold },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  username: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textMuted },
  messageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  messageBtnText: {
    fontSize: 13,
    fontFamily: Fonts.semibold,
    color: Colors.textSecondary,
  },
});

// ─── Request Card ────────────────────────────────────────
function RequestCard({
  request,
  type,
  onAccept,
  onDecline,
  onCancel,
}: {
  request: FriendRequestItem;
  type: "received" | "sent";
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
}) {
  const color = getAvatarColor(request.userId);
  return (
    <View style={rc.card}>
      <View style={[rc.avatar, { backgroundColor: color }]}>
        <Text style={rc.avatarText}>{getInitials(request.displayName)}</Text>
      </View>
      <View style={rc.info}>
        <View style={rc.nameRow}>
          <Text style={rc.name}>{request.displayName}</Text>
        </View>
        <Text style={rc.username}>@{request.username}</Text>
      </View>
      {type === "received" ? (
        <View style={rc.actions}>
          <TouchableOpacity style={rc.acceptBtn} onPress={onAccept}>
            <LinearGradient
              colors={Gradients.brand as [string, string]}
              style={rc.acceptBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="check" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={rc.declineBtn} onPress={onDecline}>
            <Icon name="x" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={rc.cancelBtn} onPress={onCancel}>
          <Text style={rc.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const rc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontFamily: Fonts.extrabold },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 15, fontFamily: Fonts.bold, color: Colors.textPrimary },
  username: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textMuted },
  actions: { flexDirection: "row", gap: 8 },
  acceptBtn: { borderRadius: 12, overflow: "hidden" },
  acceptBtnGrad: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  declineBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,60,60,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,60,60,0.25)",
  },
  cancelBtnText: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: "#FF6B6B",
  },
});

// ─── Discover Card ───────────────────────────────────────
function DiscoverCard({
  user,
  onAdd,
  isPending,
}: {
  user: SearchUserItem;
  onAdd: () => void;
  isPending: boolean;
}) {
  const color = getAvatarColor(user.userId);
  const alreadyFriend = user.friendshipStatus === "ACCEPTED";
  const pendingSent =
    user.friendshipStatus === "PENDING" && user.direction === "sent";
  const pendingReceived =
    user.friendshipStatus === "PENDING" && user.direction === "received";

  return (
    <View style={dc.card}>
      <View style={[dc.avatar, { backgroundColor: color }]}>
        <Text style={dc.avatarText}>{getInitials(user.displayName)}</Text>
      </View>
      <View style={dc.info}>
        <Text style={dc.name} numberOfLines={1}>
          {user.displayName}
        </Text>
        <Text style={dc.username}>@{user.username}</Text>
      </View>
      {alreadyFriend ? (
        <View style={dc.statusBadge}>
          <Icon name="check" size={14} color="#2D9B6E" />
          <Text style={dc.statusText}>Ami</Text>
        </View>
      ) : pendingSent ? (
        <View style={dc.statusBadge}>
          <Text style={dc.statusTextPending}>Envoyée</Text>
        </View>
      ) : pendingReceived ? (
        <View style={dc.statusBadge}>
          <Text style={dc.statusTextPending}>Reçue</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={dc.addBtn}
          onPress={onAdd}
          disabled={isPending}
        >
          <LinearGradient
            colors={Gradients.brand as [string, string]}
            style={dc.addBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="user-plus" size={14} color="#fff" />
                <Text style={dc.addBtnText}>Ajouter</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const dc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontFamily: Fonts.extrabold },
  info: { flex: 1, gap: 2 },
  name: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  username: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textMuted },
  addBtn: { borderRadius: 12, overflow: "hidden" },
  addBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: { fontSize: 13, fontFamily: Fonts.bold, color: "#fff" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statusText: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: "#2D9B6E",
  },
  statusTextPending: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: Colors.textMuted,
  },
});

// ─── Main Screen ─────────────────────────────────────────
export default function FriendsScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("amis");
  const [search, setSearch] = useState("");
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [pendingAddIds, setPendingAddIds] = useState<Set<string>>(new Set());

  // ── Queries ──────────────────────────────────────────
  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ["friendships", "friends"],
    queryFn: () => friendshipApi.getFriends().then((r) => r.data),
  });

  const { data: received = [], isLoading: receivedLoading } = useQuery({
    queryKey: ["friendships", "received"],
    queryFn: () => friendshipApi.getReceivedRequests().then((r) => r.data),
  });

  const { data: sent = [], isLoading: sentLoading } = useQuery({
    queryKey: ["friendships", "sent"],
    queryFn: () => friendshipApi.getSentRequests().then((r) => r.data),
  });

  const {
    data: searchResults = [],
    isLoading: searchLoading,
    isFetching: searchFetching,
  } = useQuery({
    queryKey: ["friendships", "search", discoverSearch],
    queryFn: () =>
      friendshipApi.searchUsers(discoverSearch).then((r) => r.data),
    enabled: discoverSearch.length >= 2,
  });

  // ── Mutations ────────────────────────────────────────
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["friendships"] });
  }, [queryClient]);

  const acceptMutation = useMutation({
    mutationFn: (friendshipId: string) =>
      friendshipApi.acceptRequest(friendshipId),
    onSuccess: invalidateAll,
    onError: () => Alert.alert("Erreur", "Impossible d'accepter la demande."),
  });

  const declineMutation = useMutation({
    mutationFn: (friendshipId: string) =>
      friendshipApi.declineRequest(friendshipId),
    onSuccess: invalidateAll,
    onError: () => Alert.alert("Erreur", "Impossible de refuser la demande."),
  });

  const cancelMutation = useMutation({
    mutationFn: (friendshipId: string) =>
      friendshipApi.cancelRequest(friendshipId),
    onSuccess: invalidateAll,
    onError: () => Alert.alert("Erreur", "Impossible d'annuler la demande."),
  });

  const sendRequestMutation = useMutation({
    mutationFn: (receiverId: string) =>
      friendshipApi.sendRequest(receiverId),
    onSuccess: (_data, receiverId) => {
      setPendingAddIds((prev) => {
        const next = new Set(prev);
        next.delete(receiverId);
        return next;
      });
      invalidateAll();
    },
    onError: (_err, receiverId) => {
      setPendingAddIds((prev) => {
        const next = new Set(prev);
        next.delete(receiverId);
        return next;
      });
      Alert.alert("Erreur", "Impossible d'envoyer la demande.");
    },
  });

  const handleSendRequest = (userId: string) => {
    setPendingAddIds((prev) => new Set(prev).add(userId));
    sendRequestMutation.mutate(userId);
  };

  // ── Derived state ────────────────────────────────────
  const filteredFriends = friends.filter(
    (f) =>
      f.displayName.toLowerCase().includes(search.toLowerCase()) ||
      f.username.toLowerCase().includes(search.toLowerCase()),
  );

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "amis", label: "Amis", count: friends.length },
    { key: "decouvrir", label: "Découvrir" },
    { key: "recues", label: "Reçues", count: received.length },
    { key: "envoyees", label: "Envoyées", count: sent.length },
  ];

  const isLoading =
    (activeTab === "amis" && friendsLoading) ||
    (activeTab === "recues" && receivedLoading) ||
    (activeTab === "envoyees" && sentLoading);

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      <KaytiHeader showBack title="Mes Amis" />

      {/* Tab selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={s.tabRow}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            {activeTab === tab.key && (
              <LinearGradient
                colors={Gradients.brand as [string, string]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            )}
            <Text
              style={[s.tabText, activeTab === tab.key && s.tabTextActive]}
            >
              {tab.label}
              {tab.count != null ? ` (${tab.count})` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search — show different search for Discover tab */}
      {activeTab === "decouvrir" ? (
        <View style={s.searchRow}>
          <Icon name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={s.searchInput}
            value={discoverSearch}
            onChangeText={setDiscoverSearch}
            placeholder="Rechercher par pseudo ou nom..."
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoFocus
          />
          {searchFetching && (
            <ActivityIndicator size="small" color={Colors.accentPurple} />
          )}
        </View>
      ) : (
        <View style={s.searchRow}>
          <Icon name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un ami..."
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
          />
        </View>
      )}

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {isLoading ? (
          <ActivityIndicator
            color={Colors.accentPurple}
            style={{ marginTop: 48 }}
          />
        ) : (
          <>
            {/* ── Amis tab ── */}
            {activeTab === "amis" && (
              <View style={s.list}>
                {filteredFriends.length === 0 ? (
                  <View style={s.empty}>
                    <Icon name="users" size={36} color={Colors.textMuted} />
                    <Text style={s.emptyText}>
                      {friends.length === 0
                        ? "Vous n'avez pas encore d'amis"
                        : "Aucun résultat"}
                    </Text>
                    {friends.length === 0 && (
                      <Text style={s.emptySubtext}>
                        Allez dans l'onglet Découvrir pour trouver des
                        photographes !
                      </Text>
                    )}
                  </View>
                ) : (
                  filteredFriends.map((friend) => (
                    <FriendCard
                      key={friend.friendshipId}
                      friend={friend}
                      onMessage={() =>
                        navigate(
                          `/chat/${friend.userId}?name=${encodeURIComponent(friend.displayName)}`,
                        )
                      }
                    />
                  ))
                )}
              </View>
            )}

            {/* ── Découvrir tab ── */}
            {activeTab === "decouvrir" && (
              <View style={s.list}>
                {discoverSearch.length < 2 ? (
                  <View style={s.empty}>
                    <Icon name="search" size={36} color={Colors.textMuted} />
                    <Text style={s.emptyText}>
                      Recherchez des photographes
                    </Text>
                    <Text style={s.emptySubtext}>
                      Tapez au moins 2 caractères pour rechercher par pseudo ou
                      nom
                    </Text>
                  </View>
                ) : searchLoading ? (
                  <ActivityIndicator
                    color={Colors.accentPurple}
                    style={{ marginTop: 48 }}
                  />
                ) : searchResults.length === 0 ? (
                  <View style={s.empty}>
                    <Icon name="users" size={36} color={Colors.textMuted} />
                    <Text style={s.emptyText}>Aucun résultat</Text>
                    <Text style={s.emptySubtext}>
                      Essayez avec un autre pseudo ou nom
                    </Text>
                  </View>
                ) : (
                  searchResults.map((user) => (
                    <DiscoverCard
                      key={user.userId}
                      user={user}
                      onAdd={() => handleSendRequest(user.userId)}
                      isPending={pendingAddIds.has(user.userId)}
                    />
                  ))
                )}
              </View>
            )}

            {/* ── Reçues tab ── */}
            {activeTab === "recues" && (
              <View style={s.list}>
                {received.length === 0 ? (
                  <View style={s.empty}>
                    <Icon name="inbox" size={36} color={Colors.textMuted} />
                    <Text style={s.emptyText}>Aucune demande reçue</Text>
                  </View>
                ) : (
                  received.map((req) => (
                    <RequestCard
                      key={req.friendshipId}
                      request={req}
                      type="received"
                      onAccept={() => acceptMutation.mutate(req.friendshipId)}
                      onDecline={() =>
                        declineMutation.mutate(req.friendshipId)
                      }
                    />
                  ))
                )}
              </View>
            )}

            {/* ── Envoyées tab ── */}
            {activeTab === "envoyees" && (
              <View style={s.list}>
                {sent.length === 0 ? (
                  <View style={s.empty}>
                    <Icon name="send" size={36} color={Colors.textMuted} />
                    <Text style={s.emptyText}>Aucune demande envoyée</Text>
                  </View>
                ) : (
                  sent.map((req) => (
                    <RequestCard
                      key={req.friendshipId}
                      request={req}
                      type="sent"
                      onCancel={() => cancelMutation.mutate(req.friendshipId)}
                    />
                  ))
                )}
              </View>
            )}
          </>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      <BottomTabBar activeRoute="/(tabs)/profile" />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20 },

  tabRow: {
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 4,
    paddingBottom: 2,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "hidden",
  },
  tabActive: {},
  tabText: {
    fontSize: 13,
    fontFamily: Fonts.semibold,
    color: Colors.textMuted,
  },
  tabTextActive: { color: "#fff", fontFamily: Fonts.bold },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },

  list: { paddingHorizontal: 20, marginTop: 16, gap: 10 },

  empty: { alignItems: "center", paddingTop: 48, gap: 12 },
  emptyText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 18,
  },
});
