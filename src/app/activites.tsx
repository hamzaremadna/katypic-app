import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { navigate } from "@/utils/navigation";
import { Colors, Gradients } from "../theme/colors";
import { BottomTabBar } from "../components/ui";
import { Icon } from "../components/ui/Icon";

// ─── Mock Data ───────────────────────────────────────────
const FAVORITE_SPOTS = [
  {
    id: "1",
    name: "Pont Alexandre III",
    location: "Paris 8e • 1.2 km",
    rating: 4.8,
    category: "Architecture",
    avatarColors: ["#2D1B69", "#1A1040"] as [string, string],
  },
  {
    id: "2",
    name: "Jardin du Luxembourg",
    location: "Paris 6e • 2.0 km",
    rating: 4.6,
    category: "Paysage",
    avatarColors: ["#0F4C2F", "#082B1A"] as [string, string],
  },
  {
    id: "3",
    name: "Sacré-Cœur",
    location: "Paris 18e • 3.5 km",
    rating: 4.5,
    category: "Architecture",
    avatarColors: ["#4A1E6E", "#2D0E4A"] as [string, string],
  },
  {
    id: "4",
    name: "Parc de la Villette",
    location: "Paris 19e • 2.3 km",
    rating: 4.3,
    category: "Paysage",
    avatarColors: ["#1A3A4A", "#0E2030"] as [string, string],
  },
];

const EVENTS_UPCOMING = [
  {
    id: "1",
    title: "Golden hour au parc",
    date: "Dim 16 mars • 18h30",
    location: "Jardin du Luxembourg",
    participants: 5,
    maxParticipants: 10,
    level: "Débutant",
    levelColor: "#00C851",
    coverColors: ["#3D1B69", "#1A1040"] as [string, string],
  },
  {
    id: "2",
    title: "Street photo nocturne",
    date: "Mer 19 mars • 21h00",
    location: "Le Marais, Paris",
    participants: 3,
    maxParticipants: 8,
    level: "Intermédiaire",
    levelColor: "#FF8C00",
    coverColors: ["#1A1A4E", "#0E0E30"] as [string, string],
  },
];

const EVENTS_CREATED = [
  {
    id: "3",
    title: "Portrait en lumière naturelle",
    date: "Sam 22 mars • 14h00",
    location: "Tuileries, Paris",
    participants: 2,
    maxParticipants: 6,
    level: "Tous niveaux",
    levelColor: "#4A90E2",
    coverColors: ["#2D1060", "#1A0840"] as [string, string],
  },
];

const EVENTS_PENDING = [
  {
    id: "4",
    title: "Architecture haussmannienne",
    date: "Dim 23 mars • 10h00",
    location: "Opéra Garnier",
    participants: 7,
    maxParticipants: 12,
    level: "Avancé",
    levelColor: "#E91E8C",
    coverColors: ["#3D0A20", "#200510"] as [string, string],
    status: "En attente",
  },
];

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
  spot: (typeof FAVORITE_SPOTS)[0];
  onRemove: () => void;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={s.spotCard} onPress={onPress} activeOpacity={0.8}>
      {/* Cover */}
      <View style={s.spotCover}>
        <LinearGradient
          colors={spot.avatarColors}
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
            {spot.location}
          </Text>
        </View>
        <View style={s.spotFooter}>
          <View style={s.spotRating}>
            <Icon name="star" size={12} color="#FFD700" />
            <Text style={s.spotRatingText}>{spot.rating}</Text>
          </View>
          <View style={s.spotCategoryTag}>
            <Text style={s.spotCategoryText}>{spot.category}</Text>
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
  event: (typeof EVENTS_UPCOMING)[0] & { status?: string };
  onPress: () => void;
  showStatus?: boolean;
}) {
  return (
    <TouchableOpacity style={s.eventCard} onPress={onPress} activeOpacity={0.8}>
      {/* Cover */}
      <View style={s.eventCover}>
        <LinearGradient
          colors={event.coverColors}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Level badge */}
        <View style={[s.levelBadge, { borderColor: event.levelColor + "60" }]}>
          <Text style={[s.levelBadgeText, { color: event.levelColor }]}>
            {event.level}
          </Text>
        </View>
        {showStatus && event.status && (
          <View style={s.statusBadge}>
            <Icon name="clock" size={11} color="#FF8C00" />
            <Text style={s.statusBadgeText}>{event.status}</Text>
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
            {event.date}
          </Text>
        </View>
        <View style={s.eventMetaRow}>
          <Icon name="marker-pin" size={12} color={Colors.textMuted} />
          <Text style={s.eventMetaText} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
        <View style={s.eventMetaRow}>
          <Icon name="users" size={12} color={Colors.textMuted} />
          <Text style={s.eventMetaText}>
            {event.participants}/{event.maxParticipants} participants
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
  const [mainTab, setMainTab] = useState<MainTab>("spots");
  const [eventSubTab, setEventSubTab] = useState<EventSubTab>("upcoming");
  const [favoriteSpots, setFavoriteSpots] = useState(FAVORITE_SPOTS);

  const removeSpot = (id: string) =>
    setFavoriteSpots((prev) => prev.filter((s) => s.id !== id));

  const eventsByTab = {
    upcoming: EVENTS_UPCOMING,
    history: [] as typeof EVENTS_UPCOMING,
    created: EVENTS_CREATED,
    pending: EVENTS_PENDING,
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
                  onRemove={() => removeSpot(spot.id)}
                  onPress={() =>
                    navigate(`/spot/${spot.id}`)
                  }
                />
              ))
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
            {currentEvents.length === 0 ? (
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
                  event={event as any}
                  showStatus={eventSubTab === "pending"}
                  onPress={() =>
                    navigate(`/event/${event.id}`)
                  }
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

      <BottomTabBar activeRoute="/(tabs)/discover" />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20 },

  // Header
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

  // Main tabs
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
  mainTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  mainTabTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  // Content
  tabContent: { paddingHorizontal: 20, paddingTop: 14, gap: 12 },
  tabSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "500",
    marginBottom: 2,
  },

  // Sub-tabs
  subTabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
  },
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
  subTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  subTabTextActive: {
    color: Colors.accentPurple,
  },

  // Spot card
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
  spotCoverIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  spotInfo: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  spotName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  spotLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  spotLocation: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
  },
  spotFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  spotRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  spotRatingText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  spotCategoryTag: {
    backgroundColor: "rgba(123,47,190,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(123,47,190,0.35)",
  },
  spotCategoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.accentPurple,
  },
  removeBtn: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 4,
  },

  // Event card
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
  levelBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
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
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FF8C00",
  },
  eventInfo: {
    padding: 14,
    gap: 5,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  eventMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventMetaText: {
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
  },

  // Create event button
  createEventBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
  },
  createEventBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  createEventBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 14,
  },
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
