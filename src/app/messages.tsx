import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { navigate } from "@/utils/navigation";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@tanstack/react-query";
import { Colors, Gradients } from "../theme/colors";
import { Fonts } from "../theme/typography";
import { Icon } from "../components/ui/Icon";
import { messageApi, Conversation } from "../services/api/message.api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#E91E8C",
  "#7B2FBE",
  "#4A90E2",
  "#2D9B6E",
  "#E8833A",
  "#4A6FA5",
  "#9B59B6",
  "#2D7D32",
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0)
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (diffDays === 1) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

// ─── Conversation Row ─────────────────────────────────────────────────────────

function ConversationRow({ item }: { item: Conversation }) {
  const color = getAvatarColor(item.userId);
  const initials = getInitials(item.username);

  return (
    <TouchableOpacity
      style={s.row}
      activeOpacity={0.75}
      onPress={() =>
        navigate(
          `/chat/${item.userId}?name=${encodeURIComponent(item.username)}`
        )
      }
    >
      {/* Avatar */}
      <View style={s.avatarWrapper}>
        <View style={[s.avatar, { backgroundColor: color }]}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={s.rowContent}>
        <View style={s.rowTop}>
          <Text style={s.rowName} numberOfLines={1}>
            {item.username}
          </Text>
          <Text style={s.rowTime}>{formatTime(item.lastMessageAt)}</Text>
        </View>
        <View style={s.rowBottom}>
          <Text
            style={[s.rowLastMsg, item.unreadCount > 0 && s.rowLastMsgUnread]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={s.unreadBadge}>
              <LinearGradient
                colors={Gradients.brand}
                style={s.unreadBadgeGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={s.unreadCount}>{item.unreadCount}</Text>
              </LinearGradient>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MessagesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"principal" | "general">(
    "principal"
  );

  const {
    data: conversations = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messageApi.getConversations().then((r) => r.data),
    refetchInterval: 10000,
  });

  const filtered = conversations.filter((c) =>
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  // "Général" is reserved for future group chats
  const displayed = activeTab === "principal" ? filtered : [];
  const principalUnread = conversations.filter((c) => c.unreadCount > 0).length;

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
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
        <Text style={s.headerTitle}>Mes messages</Text>
        <TouchableOpacity
          style={s.settingsBtn}
          onPress={() => navigate("/(tabs)/settings")}
        >
          <Icon name="settings" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrapper}>
        <View style={s.searchBar}>
          <Icon name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Rechercher une conversation..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter tabs */}
      <View style={s.filterRow}>
        <TouchableOpacity style={s.filterDropdown}>
          <Icon name="sliders" size={16} color={Colors.textSecondary} />
          <Icon name="chevron-down" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.filterTab, activeTab === "principal" && s.filterTabActive]}
          onPress={() => setActiveTab("principal")}
        >
          <View style={s.filterDot} />
          <Text
            style={[
              s.filterTabText,
              activeTab === "principal" && s.filterTabTextActive,
            ]}
          >
            Principal
          </Text>
          {principalUnread > 0 && (
            <Text
              style={[
                s.filterCount,
                activeTab === "principal" && s.filterCountActive,
              ]}
            >
              {principalUnread}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.filterTab, activeTab === "general" && s.filterTabActive]}
          onPress={() => setActiveTab("general")}
        >
          <View style={s.filterDot} />
          <Text
            style={[
              s.filterTabText,
              activeTab === "general" && s.filterTabTextActive,
            ]}
          >
            Général
          </Text>
        </TouchableOpacity>
      </View>

      {/* List / States */}
      {isLoading ? (
        <View style={s.centered}>
          <ActivityIndicator color={Colors.accentPurple} />
        </View>
      ) : isError ? (
        <View style={s.centered}>
          <Icon name="refresh" size={36} color={Colors.textMuted} />
          <Text style={s.emptyText}>Erreur de chargement</Text>
          <TouchableOpacity onPress={() => refetch()} style={s.retryBtn}>
            <Text style={s.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => <ConversationRow item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="message-chat" size={40} color={Colors.textMuted} />
              <Text style={s.emptyText}>
                {activeTab === "general"
                  ? "Bientôt disponible"
                  : "Aucune conversation"}
              </Text>
            </View>
          }
        />
      )}

    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: 16,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  backBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: "#fff",
  },
  settingsBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },

  searchWrapper: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textPrimary,
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  filterDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterTabActive: { backgroundColor: Colors.textPrimary },
  filterDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#5B5BD6" },
  filterTabText: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.textSecondary },
  filterTabTextActive: { color: "#000", fontFamily: Fonts.bold },
  filterCount: { fontFamily: Fonts.semibold, fontSize: 12, color: Colors.textMuted },
  filterCountActive: { color: "#000" },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 100,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  retryText: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.textSecondary },

  list: { paddingHorizontal: 16, paddingBottom: 110, gap: 2 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textMuted },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  avatarWrapper: { position: "relative", width: 54, height: 54 },
  avatar: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: Fonts.extrabold, fontSize: 18, color: "#fff" },
  rowContent: { flex: 1, gap: 4 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowName: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.textPrimary, flex: 1, marginRight: 8 },
  rowTime: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, flexShrink: 0 },
  rowBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLastMsg: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted, flex: 1, marginRight: 8 },
  rowLastMsgUnread: { color: Colors.textSecondary, fontFamily: Fonts.medium },
  unreadBadge: { borderRadius: 12, overflow: "hidden", flexShrink: 0 },
  unreadBadgeGrad: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  unreadCount: { fontFamily: Fonts.extrabold, fontSize: 12, color: "#fff" },
});
