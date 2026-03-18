import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { navigate } from "@/utils/navigation";
import { Colors, Gradients } from "../theme/colors";
import { Icon } from "../components/ui/Icon";
import { useMyEvents, useCreatedEvents, usePendingRequests } from "@/hooks/useEvents";
import { useFavoriteSpots, useToggleFavorite } from "@/hooks/useSpots";
import { EVENT_LEVEL_LABELS, EventLevel, Event } from "@/services/api/event.api";
import { Spot } from "@/services/api/spot.api";

// ─── Helpers ─────────────────────────────────────────────
const LEVEL_COLORS: Record<EventLevel, string> = {
  BEGINNER: "#00C851",
  ALL_LEVELS: "#4A90E2",
  INTERMEDIATE: "#FF8C00",
  ADVANCED: "#E91E8C",
};

function formatEventDate(startsAt: string): string {
  try {
    const d = new Date(startsAt);
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return startsAt;
  }
}

type MainTab = "spots" | "events";
type EventSubTab = "upcoming" | "history" | "created" | "pending";

const EVENT_SUBTABS: { id: EventSubTab; label: string }[] = [
  { id: "upcoming", label: "À venir" },
  { id: "history", label: "Historique" },
  { id: "created", label: "Créés" },
  { id: "pending", label: "En attente" },
];

// ─── Spot Favorite Card ──────────────────────────────────
function SpotCard({
  spot,
  onRemove,
  onPress,
}: {
  spot: Spot;
  onRemove: () => void;
  onPress: () => void;
}) {
  const categoryLabel = spot.category
    ? spot.category.charAt(0) + spot.category.slice(1).toLowerCase()
    : "Spot";

  return (
    <TouchableOpacity style={s.spotCard} onPress={onPress} activeOpacity={0.8}>
      {/* Cover */}
      <View style={s.spotCover}>
        <LinearGradient
          colors={["#2D1B69", "#1A1040"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={s.spotCoverIcon}>
          <Icon name="image" size={22} color="rgba(255,255,255,0.3)" />
        </View>
      </View>

      {/* Info */}
      <View style={s.spotInfo}>
        <Text style={s.spotName} numberOfLines={1}>
          {spot.name}
        </Text>
        <View style={s.spotLocationRow}>
          <Icon name="marker-pin" size={12} color={Colors.textMuted} />
          <Text style={s.spotLocation} numberOfLines={1}>
            {spot.address || categoryLabel}
          </Text>
        </View>
        <View style={s.spotFooter}>
          <View style={s.spotRating}>
            <Icon name="star" size={12} color="#FFD700" />
            <Text style={s.spotRatingText}>
              {spot.averageRating ? spot.averageRating.toFixed(1) : "—"}
            </Text>
          </View>
          <View style={s.spotCategoryTag}>
            <Text style={s.spotCategoryText}>{categoryLabel}</Text>
          </View>
        </View>
      </View>

      {/* Remove */}
      <TouchableOpacity style={s.removeBtn} onPress={onRemove}>
        <Icon name="trash" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Event Card ──────────────────────────────────────────
function EventCard({
  event,
  onPress,
  showStatus,
}: {
  event: Event;
  onPress: () => void;
  showStatus?: boolean;
}) {
  const levelLabel = EVENT_LEVEL_LABELS[event.level] ?? "Tous niveaux";
  const levelColor = LEVEL_COLORS[event.level] ?? "#4A90E2";
  const memberCount = event._count?.members ?? event.members?.length ?? 0;

  return (
    <TouchableOpacity style={s.eventCard} onPress={onPress} activeOpacity={0.8}>
      {/* Cover */}
      <View style={s.eventCover}>
        <LinearGradient
          colors={["#2D1B69", "#1A1040"]}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Level badge */}
        <View style={[s.levelBadge, { borderColor: levelColor + "60" }]}>
          <Text style={[s.levelBadgeText, { color: levelColor }]}>
            {levelLabel}
          </Text>
        </View>
        {showStatus && (
          <View style={s.statusBadge}>
            <Icon name="clock" size={11} color="#FF8C00" />
            <Text style={s.statusBadgeText}>En attente</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={s.eventInfo}>
        <Text style={s.eventTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={s.eventMetaRow}>
          <Icon name="calendar" size={12} color={Colors.textMuted} />
          <Text style={s.eventMetaText} numberOfLines={1}>
            {formatEventDate(event.startsAt)}
          </Text>
        </View>
        {event.address ? (
          <View style={s.eventMetaRow}>
            <Icon name="marker-pin" size={12} color={Colors.textMuted} />
            <Text style={s.eventMetaText} numberOfLines={1}>
              {event.address}
            </Text>
          </View>
        ) : null}
        <View style={s.eventMetaRow}>
          <Icon name="users" size={12} color={Colors.textMuted} />
          <Text style={s.eventMetaText}>
            {memberCount}
            {event.maxParticipants ? `/${event.maxParticipants}` : ""} participants
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ─────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <View style={s.emptyState}>
      <View style={s.emptyIcon}>
        <Icon name="camera" size={32} color={Colors.textMuted} />
      </View>
      <Text style={s.emptyText}>{message}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────
export default function ActivitesScreen() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<MainTab>("spots");
  const [eventSubTab, setEventSubTab] = useState<EventSubTab>("upcoming");

  const { data: favoriteSpots = [], isLoading: spotsLoading } = useFavoriteSpots();
  const toggleFav = useToggleFavorite();

  const { data: myEvents, isLoading: myEventsLoading } = useMyEvents();
  const { data: createdEvents = [], isLoading: createdLoading } = useCreatedEvents();
  const { data: pendingRequests = [], isLoading: pendingLoading } = usePendingRequests();

  const upcoming = myEvents?.upcoming ?? [];
  const past = myEvents?.past ?? [];

  const eventsLoading = myEventsLoading || createdLoading || pendingLoading;

  const eventsByTab: Record<EventSubTab, Event[]> = {
    upcoming,
    history: past,
    created: createdEvents,
    pending: pendingRequests.map((r) => r.event),
  };

  const currentEvents = eventsByTab[eventSubTab];

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Header ── */}
      <LinearGradient
        colors={["rgba(93,36,167,0.2)", "transparent"]}
        style={s.headerBg}
      />
      <View style={s.header}>
        <TouchableOpacity style={s.headerAction} onPress={() => router.back()}>
          <Icon name="chevron-left" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mes activités</Text>
        <TouchableOpacity
          style={s.headerAction}
          onPress={() => navigate("/(tabs)/settings")}
        >
          <Icon name="settings" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Main Tabs ── */}
      <View style={s.mainTabs}>
        <TouchableOpacity
          style={[s.mainTab, mainTab === "spots" && s.mainTabActive]}
          onPress={() => setMainTab("spots")}
        >
          {mainTab === "spots" && (
            <LinearGradient
              colors={Gradients.brand}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          )}
          <Icon
            name="heart"
            size={15}
            color={mainTab === "spots" ? "#fff" : Colors.textMuted}
          />
          <Text
            style={[s.mainTabText, mainTab === "spots" && s.mainTabTextActive]}
          >
            Spots favoris
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.mainTab, mainTab === "events" && s.mainTabActive]}
          onPress={() => setMainTab("events")}
        >
          {mainTab === "events" && (
            <LinearGradient
              colors={Gradients.brand}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          )}
          <Icon
            name="calendar"
            size={15}
            color={mainTab === "events" ? "#fff" : Colors.textMuted}
          />
          <Text
            style={[s.mainTabText, mainTab === "events" && s.mainTabTextActive]}
          >
            Événements
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── Spots Favoris ── */}
        {mainTab === "spots" && (
          <View style={s.tabContent}>
            {spotsLoading ? (
              <ActivityIndicator color={Colors.accentPurple} style={{ marginTop: 40 }} />
            ) : (
              <>
                <Text style={s.tabSubtitle}>
                  {favoriteSpots.length} spot{favoriteSpots.length !== 1 ? "s" : ""}{" "}
                  sauvegardé{favoriteSpots.length !== 1 ? "s" : ""}
                </Text>
                {favoriteSpots.length === 0 ? (
                  <EmptyState message="Aucun spot favori pour l'instant. Explorez la carte pour en découvrir !" />
                ) : (
                  favoriteSpots.map((spot) => (
                    <SpotCard
                      key={spot.id}
                      spot={spot}
                      onRemove={() => toggleFav.mutate(spot.id)}
                      onPress={() => navigate(`/spot/${spot.id}`)}
                    />
                  ))
                )}
              </>
            )}
          </View>
        )}

        {/* ── Événements ── */}
        {mainTab === "events" && (
          <View style={s.tabContent}>
            {/* Sub-tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.subTabsRow}
            >
              {EVENT_SUBTABS.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    s.subTab,
                    eventSubTab === tab.id && s.subTabActive,
                  ]}
                  onPress={() => setEventSubTab(tab.id)}
                >
                  <Text
                    style={[
                      s.subTabText,
                      eventSubTab === tab.id && s.subTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Events list */}
            {eventsLoading ? (
              <ActivityIndicator color={Colors.accentPurple} style={{ marginTop: 40 }} />
            ) : currentEvents.length === 0 ? (
              <EmptyState
                message={
                  eventSubTab === "history"
                    ? "Aucun événement passé."
                    : eventSubTab === "pending"
                    ? "Aucune demande en attente."
                    : "Aucun événement ici."
                }
              />
            ) : (
              currentEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  showStatus={eventSubTab === "pending"}
                  onPress={() => navigate(`/event/${event.id}`)}
                />
              ))
            )}

            {/* Create event CTA (only on upcoming tab) */}
            {eventSubTab === "upcoming" && (
              <TouchableOpacity
                style={s.createEventBtn}
                onPress={() => navigate("/event/create")}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={Gradients.brand}
                  style={s.createEventBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Icon name="plus" size={18} color="#fff" />
                  <Text style={s.createEventBtnText}>
                    Créer un événement
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20 },

  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 130 : 110,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 58 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  mainTabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 6,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  mainTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
    overflow: "hidden",
  },
  mainTabActive: {},
  mainTabText: { fontSize: 14, fontWeight: "600", color: Colors.textMuted },
  mainTabTextActive: { color: "#fff", fontWeight: "700" },

  tabContent: { paddingHorizontal: 20, paddingTop: 14, gap: 12 },
  tabSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "500",
    marginBottom: 2,
  },

  subTabsRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  subTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  subTabActive: {
    backgroundColor: "rgba(123,47,190,0.25)",
    borderColor: "rgba(123,47,190,0.5)",
  },
  subTabText: { fontSize: 13, fontWeight: "600", color: Colors.textMuted },
  subTabTextActive: { color: Colors.accentPurple },

  spotCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  spotCover: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  spotCoverIcon: { alignItems: "center", justifyContent: "center" },
  spotInfo: { flex: 1, paddingVertical: 12, paddingHorizontal: 12, gap: 4 },
  spotName: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  spotLocationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  spotLocation: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  spotFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  spotRating: { flexDirection: "row", alignItems: "center", gap: 4 },
  spotRatingText: { fontSize: 13, fontWeight: "700", color: Colors.textPrimary },
  spotCategoryTag: {
    backgroundColor: "rgba(123,47,190,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(123,47,190,0.35)",
  },
  spotCategoryText: { fontSize: 11, fontWeight: "600", color: Colors.accentPurple },
  removeBtn: { width: 48, alignItems: "center", justifyContent: "center", paddingRight: 4 },

  eventCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  eventCover: {
    height: 100,
    alignItems: "flex-start",
    justifyContent: "flex-end",
    padding: 12,
    flexDirection: "row",
    alignContent: "flex-start",
  },
  levelBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
  },
  levelBadgeText: { fontSize: 11, fontWeight: "700" },
  statusBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(255,140,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,140,0,0.4)",
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700", color: "#FF8C00" },
  eventInfo: { padding: 14, gap: 5 },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  eventMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eventMetaText: { fontSize: 13, color: Colors.textMuted, flex: 1 },

  createEventBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  createEventBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  createEventBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  emptyState: { alignItems: "center", paddingVertical: 40, gap: 14 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 240,
  },
});
