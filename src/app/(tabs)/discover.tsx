import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "../../components/ui/Icon";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { KaytiHeader, BottomTabBar } from "../../components/ui";
import { useRouter } from "expo-router";
import { navigate } from "@/utils/navigation";
import { useQuery } from "@tanstack/react-query";
import { TourOverlay } from "../../components/tour/TourOverlay";
import { TOUR_DISCOVER } from "../../data/tours";
import { useTourStore } from "../../stores/tourStore";
import { useToggleFavorite } from "../../hooks/useSpots";
import { spotApi, Spot as ApiSpot } from "../../services/api/spot.api";
import { eventApi, Event as ApiEvent } from "../../services/api/event.api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TabType = "spots" | "events";

// ─── Paris bounding box (covers ~30 km radius) ───────────────────────────────
const PARIS = { lat: 48.8566, lng: 2.3522 };
const BOUNDS = { minLat: 43.0, maxLat: 50.0, minLng: 1.5, maxLng: 7.5 }; // all France

// ─── Helpers ─────────────────────────────────────────────────────────────────

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Internal card shape (normalized from both APIs)
interface CardItem {
  id: string;
  name: string;
  rating: number;
  distance: string;
  description: string;
  views: number;
  image: string;
  latitude: number;
  longitude: number;
  date?: string; // events only
}

function spotToCard(s: ApiSpot, idx: number, userLoc: { lat: number; lng: number }): CardItem {
  return {
    id: s.id,
    name: s.name,
    rating: s.averageRating ?? 4.5,
    distance: distanceKm(userLoc.lat, userLoc.lng, s.latitude, s.longitude),
    description: s.description ?? "",
    views: s.visitCount,
    image: s.thumbnailUrl ?? `https://picsum.photos/seed/spot${idx}/200/200`,
    latitude: s.latitude,
    longitude: s.longitude,
  };
}

function eventToCard(e: ApiEvent, idx: number, userLoc: { lat: number; lng: number }): CardItem {
  return {
    id: e.id,
    name: e.title,
    rating: 4.5,
    distance: distanceKm(userLoc.lat, userLoc.lng, e.latitude, e.longitude),
    description: e.description ?? "",
    views: e._count?.members ?? 0,
    image: e.coverImageUrl ?? `https://picsum.photos/seed/event${idx}/200/200`,
    latitude: e.latitude,
    longitude: e.longitude,
    date: formatEventDate(e.startsAt),
  };
}

// ─── Map style ───────────────────────────────────────────────────────────────

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1d1d35" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8c8ca0" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2a2a40" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#22223a" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2a2a45" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a30" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e20" }] },
];

const INITIAL_REGION = {
  latitude: PARIS.lat,
  longitude: PARIS.lng,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("spots");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const mapRef = useRef<MapView>(null);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation] = useState(PARIS);
  const toggleFavorite = useToggleFavorite();

  // ── GPS location ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

  // ── Tour ──────────────────────────────────────────────────────────────────
  const { markSeen, load } = useTourStore();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    load().then(() => {
      if (!useTourStore.getState().hasSeen("discover")) {
        setTimeout(() => setShowTour(true), 800);
      }
    });
  }, []);

  // ── API Queries ───────────────────────────────────────────────────────────
  const { data: rawSpots = [], isLoading: spotsLoading } = useQuery({
    queryKey: ["spots", "bounds"],
    queryFn: () =>
      spotApi
        .listByBounds(BOUNDS.minLat, BOUNDS.maxLat, BOUNDS.minLng, BOUNDS.maxLng)
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: rawEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["events", "location", userLocation.lat, userLocation.lng],
    queryFn: () =>
      eventApi.listByLocation(userLocation.lat, userLocation.lng, 500).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const spots = useMemo(() => rawSpots.map((s, i) => spotToCard(s, i, userLocation)), [rawSpots, userLocation]);
  const events = useMemo(() => rawEvents.map((e, i) => eventToCard(e, i, userLocation)), [rawEvents, userLocation]);

  const currentData = activeTab === "spots" ? spots : events;
  const isLoading = activeTab === "spots" ? spotsLoading : eventsLoading;
  const currentItem = currentData[currentCardIndex] ?? null;

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setCurrentCardIndex(0);
  }, []);

  const animateTo = useCallback((item: CardItem) => {
    mapRef.current?.animateToRegion(
      { latitude: item.latitude, longitude: item.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      500
    );
  }, []);

  const goToNextCard = useCallback(() => {
    if (currentData.length === 0) return;
    setCurrentCardIndex((prev) => {
      const next = prev < currentData.length - 1 ? prev + 1 : 0;
      animateTo(currentData[next]);
      return next;
    });
  }, [currentData]);

  const goToPreviousCard = useCallback(() => {
    if (currentData.length === 0) return;
    setCurrentCardIndex((prev) => {
      const next = prev > 0 ? prev - 1 : currentData.length - 1;
      animateTo(currentData[next]);
      return next;
    });
  }, [currentData]);

  const handleMarkerPress = useCallback(
    (index: number) => {
      setCurrentCardIndex(index);
      animateTo(currentData[index]);
    },
    [currentData, animateTo]
  );

  const handleToggleMapType = useCallback(() => {
    setMapType((prev) => (prev === "standard" ? "satellite" : "standard"));
  }, []);

  const handleViewItem = useCallback(() => {
    if (!currentItem) return;
    navigate(
      activeTab === "spots"
        ? `/spot/${currentItem.id}`
        : `/event/${currentItem.id}`
    );
  }, [activeTab, currentItem]);

  const handleShareItem = useCallback(() => {
    if (!currentItem) return;
    Share.share({ message: `${currentItem.name} — découvert sur KaytiPic` });
  }, [currentItem]);

  const handleToggleLike = useCallback(() => {
    if (!currentItem) return;
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(currentItem.id) ? next.delete(currentItem.id) : next.add(currentItem.id);
      return next;
    });
    // Persist to backend (spots only)
    if (activeTab === "spots") {
      toggleFavorite.mutate(currentItem.id);
    }
  }, [currentItem, activeTab, toggleFavorite]);

  const handleGoToActivites = useCallback(() => {
    navigate("/activites");
  }, []);

  const handleTourFinish = useCallback(() => {
    setShowTour(false);
    markSeen("discover");
  }, [markSeen]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0E0A24", "#080814"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <KaytiHeader
        showBack
        title="Découvrir"
        rightIcon={
          <TouchableOpacity
            onPress={handleGoToActivites}
            style={styles.activitiesButton}
          >
            <LinearGradient
              colors={["#E91E8C", "#C2185B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.activitiesButtonGradient}
            >
              <Icon name="calendar" size={14} color="#FFFFFF" />
              <Text style={styles.activitiesButtonText}>Mes activités</Text>
            </LinearGradient>
          </TouchableOpacity>
        }
      />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={styles.tabButton}
          activeOpacity={0.8}
          onPress={() => handleTabChange("spots")}
        >
          {activeTab === "spots" ? (
            <LinearGradient
              colors={Gradients.purpleBlue}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabGradient}
            >
              <Icon name="marker-pin" size={16} color="#FFFFFF" />
              <Text style={styles.tabTextActive}>Spots photo</Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabInactive}>
              <Icon name="marker-pin" size={16} color={Colors.textSecondary} />
              <Text style={styles.tabTextInactive}>Spots photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          activeOpacity={0.8}
          onPress={() => handleTabChange("events")}
        >
          {activeTab === "events" ? (
            <LinearGradient
              colors={Gradients.purpleBlue}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabGradient}
            >
              <Icon name="calendar" size={16} color="#FFFFFF" />
              <Text style={styles.tabTextActive}>Événements</Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabInactive}>
              <Icon name="calendar" size={16} color={Colors.textSecondary} />
              <Text style={styles.tabTextInactive}>Événements</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <TouchableOpacity
          style={styles.mapTypeBtn}
          onPress={handleToggleMapType}
        >
          <Icon name={mapType === "standard" ? "globe" : "map"} size={16} color="#FFFFFF" />
        </TouchableOpacity>

        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={INITIAL_REGION}
          mapType={mapType}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {currentData.map((item, index) => (
            <Marker
              key={item.id}
              coordinate={{ latitude: item.latitude, longitude: item.longitude }}
              onPress={() => handleMarkerPress(index)}
            >
              <View
                style={[
                  styles.markerContainer,
                  index === currentCardIndex && styles.markerContainerActive,
                ]}
              >
                <View
                  style={[
                    styles.markerDot,
                    activeTab === "spots" ? styles.markerDotSpot : styles.markerDotEvent,
                    index === currentCardIndex && styles.markerDotActive,
                  ]}
                >
                  <Icon
                    name={activeTab === "spots" ? "camera" : "calendar"}
                    size={12}
                    color="#FFFFFF"
                  />
                </View>
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Bottom Card */}
      {isLoading ? (
        <View style={styles.bottomCardContainer}>
          <View style={[styles.loadingCard]}>
            <ActivityIndicator color={Colors.accentPurple} />
            <Text style={styles.loadingText}>Chargement…</Text>
          </View>
        </View>
      ) : currentItem ? (
        <View style={styles.bottomCardContainer}>
          <View style={styles.navContainer}>
            <TouchableOpacity
              style={[styles.navArrow, styles.navArrowLeft]}
              onPress={goToPreviousCard}
            >
              <Text style={styles.navArrowText}>{"<"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navArrow, styles.navArrowRight]}
              onPress={goToNextCard}
            >
              <Text style={styles.navArrowText}>{">"}</Text>
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={Gradients.purpleBlue}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bottomCard}
          >
            <TouchableOpacity style={styles.closeBtn} onPress={goToNextCard}>
              <Icon name="x" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.cardContent}>
              <Image
                source={{ uri: currentItem.image }}
                style={styles.cardThumbnail}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {currentItem.name}
                </Text>

                {/* Date badge for events */}
                {currentItem.date && (
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeText}>{currentItem.date}</Text>
                  </View>
                )}

                <View style={styles.cardMeta}>
                  <Icon name="star" size={12} color="#FFB800" />
                  <Text style={styles.cardRatingText}>{currentItem.rating.toFixed(1)}</Text>
                  <View style={styles.metaDivider} />
                  <Icon name="navigation" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.cardDistance}>{currentItem.distance}</Text>
                </View>

                <Text style={styles.cardDescription} numberOfLines={2}>
                  {currentItem.description}
                </Text>

                <View style={styles.cardMeta}>
                  <Icon
                    name={activeTab === "spots" ? "eye" : "users"}
                    size={12}
                    color="rgba(255,255,255,0.7)"
                  />
                  <Text style={styles.cardViews}>{currentItem.views}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={handleViewItem}
              >
                <Text style={styles.viewButtonText}>Voir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={handleShareItem}
              >
                <Icon name="share" size={18} color="#D20942" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={handleToggleLike}
              >
                <Icon
                  name="heart"
                  size={18}
                  color={likedIds.has(currentItem.id) ? "#FF2D55" : "#D20942"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.paginationDots}>
              {currentData.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, index === currentCardIndex && styles.dotActive]}
                />
              ))}
            </View>
          </LinearGradient>
        </View>
      ) : (
        <View style={styles.bottomCardContainer}>
          <View style={styles.loadingCard}>
            <Icon name="marker-pin" size={28} color={Colors.textMuted} />
            <Text style={styles.loadingText}>Aucun résultat</Text>
          </View>
        </View>
      )}

      <BottomTabBar activeRoute="/(tabs)/discover" />

      <TourOverlay
        steps={TOUR_DISCOVER}
        tourTitle="Découvrir les spots"
        visible={showTour}
        onFinish={handleTourFinish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A14" },

  activitiesButton: { borderRadius: 10, overflow: "hidden" },
  activitiesButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  activitiesButtonText: { fontFamily: Fonts.semibold, fontSize: 12, color: "#FFFFFF" },

  tabContainer: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  tabButton: { flex: 1, borderRadius: 12, overflow: "hidden" },
  tabGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 8,
    borderRadius: 12,
  },
  tabInactive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  tabTextActive: { fontFamily: Fonts.semibold, fontSize: 14, color: "#FFFFFF" },
  tabTextInactive: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.textSecondary },

  mapContainer: { borderRadius: 20, flex: 1, overflow: "hidden" },
  map: { flex: 1 },
  mapTypeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  markerContainer: { padding: 4 },
  markerContainerActive: { transform: [{ scale: 1.3 }] },
  markerDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  markerDotSpot: { backgroundColor: "#3B7DDD" },
  markerDotEvent: { backgroundColor: "#E91E8C" },
  markerDotActive: { borderColor: "#FFFFFF", borderWidth: 3 },

  navContainer: { position: "relative" as const },
  bottomCardContainer: { paddingHorizontal: 36, marginTop: -100, marginBottom: 100 },
  loadingCard: {
    backgroundColor: "rgba(30,20,60,0.95)",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 120,
  },
  loadingText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },

  bottomCard: { borderRadius: 20, padding: 16, gap: 12 },
  closeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  cardContent: { flexDirection: "row", gap: 12 },
  cardThumbnail: { width: 90, height: 90, borderRadius: 12, backgroundColor: "#2A2A3E" },
  cardInfo: { flex: 1, gap: 4 },
  cardName: { fontFamily: Fonts.bold, fontSize: 16, color: "#FFFFFF" },
  dateBadge: {
    backgroundColor: "rgba(233,30,140,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  dateBadgeText: { fontFamily: Fonts.semibold, fontSize: 11, color: "#E91E8C" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardRatingText: { fontFamily: Fonts.semibold, fontSize: 12, color: "#FFB800" },
  cardDistance: { fontFamily: Fonts.regular, fontSize: 12, color: "rgba(255,255,255,0.8)" },
  metaDivider: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textMuted, marginHorizontal: 4 },
  cardDescription: { fontFamily: Fonts.regular, fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 17 },
  cardViews: { fontFamily: Fonts.regular, fontSize: 12, color: "rgba(255,255,255,0.8)" },

  cardActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  viewButton: { flex: 1, backgroundColor: "#050505", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  viewButtonText: { fontFamily: Fonts.semibold, fontSize: 15, color: "#FFFFFF" },
  actionIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },

  navArrow: {
    position: "absolute",
    top: 110,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  navArrowLeft: { left: -12 },
  navArrowRight: { right: -12 },
  navArrowText: { fontFamily: Fonts.bold, color: "#FFFFFF", fontSize: 18 },

  paginationDots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)" },
  dotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: "#7B2FBE" },
});
