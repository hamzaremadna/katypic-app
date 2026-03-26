import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors } from "../theme/colors";
import { Fonts } from "../theme/typography";
import { Icon } from "../components/ui/Icon";
import { notificationApi, AppNotification } from "../services/api/notification.api";
import { hapticLight, hapticMedium } from "../utils/haptics";
import { navigate } from "@/utils/navigation";

// ─── Icon per notification type ──────────────────────────────────────────────

const TYPE_ICON: Record<AppNotification["type"], { icon: string; color: string }> = {
  message:        { icon: "message-chat", color: "#4A90E2" },
  friend_request: { icon: "user",         color: "#E91E8C" },
  friend_accept:  { icon: "check",        color: "#00C851" },
  quest_complete: { icon: "target",       color: "#FFB800" },
  like:           { icon: "sparkles",     color: "#7B2FBE" },
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

// ─── Notification Row ─────────────────────────────────────────────────────────

function NotifRow({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: (n: AppNotification) => void;
}) {
  const meta = TYPE_ICON[item.type] ?? { icon: "bell", color: "#7B2FBE" };

  return (
    <TouchableOpacity
      style={[s.row, !item.isRead && s.rowUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      {/* Unread indicator */}
      {!item.isRead && <View style={s.unreadDot} />}

      {/* Icon bubble */}
      <View style={[s.iconBubble, { backgroundColor: meta.color + "22" }]}>
        <Icon name={meta.icon as never} size={20} color={meta.color} />
      </View>

      {/* Content */}
      <View style={s.rowContent}>
        <Text style={[s.rowTitle, !item.isRead && s.rowTitleUnread]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={s.rowBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={s.rowTime}>{formatRelativeTime(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getNotifications().then((r) => r.data),
  });

  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOne = useMutation({
    mutationFn: (id: string) => notificationApi.markOneRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifUnread"] });
    },
  });

  const handlePress = useCallback(
    (notif: AppNotification) => {
      hapticLight();
      if (!notif.isRead) markOne.mutate(notif.id);
      // Navigate based on type
      if (notif.type === "message" && notif.data.senderId) {
        navigate(`/chat/${notif.data.senderId}?name=${encodeURIComponent(notif.data.senderUsername ?? "")}`);
      } else if (notif.type === "friend_request" || notif.type === "friend_accept") {
        navigate("/friends");
      }
    },
    [markOne],
  );

  const handleMarkAll = useCallback(() => {
    hapticMedium();
    markAll.mutate();
  }, [markAll]);

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0E0A24", "#080814"]} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={s.header}>
        <LinearGradient
          colors={["#3D1880", "#1E3A8A"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <TouchableOpacity style={s.backBtn} onPress={() => { hapticLight(); router.back(); }}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity style={s.markAllBtn} onPress={handleMarkAll}>
            <Text style={s.markAllText}>Tout lire</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.backBtn} />
        )}
      </View>

      {isLoading ? (
        <View style={s.centered}>
          <ActivityIndicator color={Colors.accentPurple} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={s.centered}>
          <Icon name="bell" size={44} color={Colors.textMuted} />
          <Text style={s.emptyTitle}>Aucune notification</Text>
          <Text style={s.emptyBody}>Les nouvelles notifications apparaîtront ici.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => <NotifRow item={item} onPress={handlePress} />}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onRefresh={refetch}
          refreshing={isLoading}
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
  markAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.textSecondary,
  },
  emptyBody: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  rowUnread: {
    backgroundColor: "rgba(123,47,190,0.06)",
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  unreadDot: {
    position: "absolute",
    left: 0,
    top: "50%",
    width: 3,
    height: 36,
    borderRadius: 2,
    backgroundColor: Colors.accentPurple,
    marginTop: -18,
  },
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowContent: { flex: 1, gap: 2 },
  rowTitle: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  rowTitleUnread: {
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
  },
  rowBody: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  rowTime: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
