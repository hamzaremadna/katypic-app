import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Modal,
  ImageBackground,
  ImageSourcePropType,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { KaytiHeader, BottomTabBar, UserBadge } from "../../components/ui";
import { Icon, IconName } from "../../components/ui/Icon";
import { useRouter } from "expo-router";
import { navigate } from "@/utils/navigation";
import { useAuthStore } from "../../stores/authStore";
import { usePhotos } from "../../hooks/usePhotos";
import { useQuestPaths } from "../../hooks/useQuestPaths";
import { useDailyTip } from "../../hooks/useDailyTip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "../../services/api/notification.api";
import { hapticLight, hapticMedium } from "../../utils/haptics";

// Card background images
const CARD_IMAGES = {
  analyze: require("../../assets/images/card-analyze.jpg"),
  quests: require("../../assets/images/card-quests.jpg"),
  spots: require("../../assets/images/card-spots.jpg"),
  // assistant: require("../../assets/images/card-assistant.jpg"),
};

const { width, height } = Dimensions.get("window");

// Menu card with photo background
interface MenuCardProps {
  title: string;
  image: ImageSourcePropType;
  route: string;
  delay: number;
  isPrimary?: boolean;
}

function MenuCard({ title, image, route, delay, isPrimary }: MenuCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 70,
        friction: 10,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[mc.wrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <TouchableOpacity onPress={() => { hapticLight(); navigate(route); }} activeOpacity={0.85} style={[mc.card, isPrimary && mc.cardPrimary]}>
        <ImageBackground
          source={image}
          style={mc.imageBg}
          imageStyle={mc.imageStyle}
          resizeMode="cover"
        >
          {/* Left-to-right fade: fully opaque on left, transparent on right */}
          <LinearGradient
            colors={[
              "rgba(10,10,20,1)",
              "rgba(10,10,20,0.95)",
              "rgba(10,10,20,0.7)",
              "rgba(10,10,20,0)",
            ]}
            locations={[0, 0.25, 0.45, 0.7]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={mc.title}>{title}</Text>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
}

const mc = StyleSheet.create({
  wrapper: { width: "100%" },
  card: {
    height: 90,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardPrimary: {
    borderColor: "#E91E8C",
    borderWidth: 2,
  },
  imageBg: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  imageStyle: {
    borderRadius: 14,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.textPrimary,
    lineHeight: 24,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

// ─── Plans section ────────────────────────────────────────────────────────────

const HOME_PLANS: {
  id: string;
  name: string;
  icon: IconName;
  price: string;
  sub: string;
  features: string[];
  highlighted: boolean;
  isPro: boolean;
}[] = [
  {
    id: "premium",
    name: "Premium",
    icon: "sparkles",
    price: "8,33€",
    sub: "/mois",
    features: ["Analyses illimitées", "Coach IA", "Économisez 17%"],
    highlighted: true,
    isPro: false,
  },
  {
    id: "pro",
    name: "Pro",
    icon: "award",
    price: "20,83€",
    sub: "/mois",
    features: ["Tout Premium inclus", "Coaching 1-to-1"],
    highlighted: false,
    isPro: true,
  },
];

function PlansSection() {
  return (
    <View style={pl.wrapper}>
      <View style={pl.header}>
        <Icon name="sparkles" size={13} color={Colors.accentPink} />
        <Text style={pl.headerTitle}>Passez au niveau supérieur</Text>
        <TouchableOpacity onPress={() => { hapticLight(); navigate("/paywall/plans"); }}>
          <Text style={pl.headerLink}>Voir tout →</Text>
        </TouchableOpacity>
      </View>
      <View style={pl.row}>
        {HOME_PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[pl.card, plan.highlighted && pl.cardHL, plan.isPro && pl.cardPro]}
            onPress={() => { hapticLight(); navigate("/paywall/plans"); }}
            activeOpacity={0.85}
          >
            {/* Premium: colourful paywall gradient */}
            {plan.highlighted && (
              <LinearGradient
                colors={Gradients.paywall}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
              />
            )}
            {/* Pro: dark prestige gradient */}
            {plan.isPro && (
              <LinearGradient
                colors={["#1C1030", "#0D0618", "#140820"]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            {plan.highlighted && (
              <View style={pl.badge}>
                <Text style={pl.badgeText}>⭐ POPULAIRE</Text>
              </View>
            )}
            {plan.isPro && (
              <View style={pl.badgePro}>
                <Text style={pl.badgeProText}>👑 ÉLITE</Text>
              </View>
            )}
            <View style={[pl.iconBubble, (plan.highlighted || plan.isPro) && pl.iconBubbleHL]}>
              <Icon
                name={plan.icon}
                size={16}
                color={plan.highlighted ? "#F6339A" : "#FFD700"}
              />
            </View>
            <Text style={[pl.planName, pl.textWhite]}>{plan.name}</Text>
            <Text style={[pl.planPrice, pl.textWhite]}>
              {plan.price}<Text style={[pl.planSub, pl.textWhite70]}> {plan.sub}</Text>
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Category labels for display
const CATEGORY_LABELS: Record<string, string> = {
  composition: "Composition",
  lumiere: "Lumière",
  couleur: "Couleur",
  technique: "Technique",
  creativite: "Créativité",
};

// Conseil du jour modal
interface ConseilModalProps {
  visible: boolean;
  onClose: () => void;
  onTry: () => void;
  tip?: string;
  category?: string;
  isLoading?: boolean;
}

function ConseilModal({ visible, onClose, onTry, tip, category, isLoading }: ConseilModalProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[cm.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <Animated.View style={[cm.card, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={["#5F2097", "#1F63DA"]} style={cm.cardBg} />
          <TouchableOpacity style={cm.closeBtn} onPress={() => { hapticLight(); onClose(); }}>
            <Icon name="x" size={16} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={cm.title}>Conseil du jour</Text>
          {category && CATEGORY_LABELS[category] && (
            <View style={cm.categoryBadge}>
              <Text style={cm.categoryText}>{CATEGORY_LABELS[category]}</Text>
            </View>
          )}
          {isLoading ? (
            <View style={cm.loadingWrap}>
              <View style={cm.shimmerLine} />
              <View style={[cm.shimmerLine, { width: "60%" }]} />
            </View>
          ) : (
            <Text style={cm.body}>
              {tip || "Utilisez la règle des tiers pour des compositions plus dynamiques."}
            </Text>
          )}
          <TouchableOpacity style={cm.tryBtn} activeOpacity={0.85} onPress={() => { hapticMedium(); onTry(); }}>
            <View style={cm.tryBtnInner}>
              <Text style={cm.tryBtnText}>Essayer</Text>
              <Icon name="chevron-right" size={16} color="#D00A45" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const cm = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,8,20,0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    padding: 28,
    alignItems: "center",
    gap: 16,
    shadowColor: Colors.gradientPurple,
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  cardBg: { ...StyleSheet.absoluteFillObject, borderRadius: 24 },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: Fonts.black,
    fontSize: 26,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  categoryBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingWrap: {
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  shimmerLine: {
    width: "80%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 24,
  },
  tryBtn: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    marginTop: 4,
  },
  tryBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 32,
    gap: 8,
  },
  tryBtnText: {
    fontFamily: Fonts.bold,
    color: "#000000",
    fontSize: 16,
  },
});

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const displayName = useMemo(
    () =>
      user?.username
        ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
        : "Photographe",
    [user?.username],
  );
  const greeting = useMemo(() => getTimeGreeting(), []);
  const [showConseil, setShowConseil] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { data: dailyTip, isLoading: tipLoading } = useDailyTip();
  const headerFade = useRef(new Animated.Value(0)).current;

  // ── Dynamic quest progress from real photo data ──
  const { data: photosData } = usePhotos();
  const totalPhotos = photosData?.total ?? 0;
  const analyzedPhotos = useMemo(
    () => photosData?.photos?.filter((p) => (p.analyses?.length ?? 0) > 0).length ?? 0,
    [photosData?.photos],
  );
  // Quest progress from real backend data
  const { data: questPaths } = useQuestPaths();
  const questTotal = useMemo(
    () => questPaths?.reduce((sum, p) => sum + (p.totalCount ?? 0), 0) ?? 0,
    [questPaths],
  );
  const questCompleted = useMemo(
    () => questPaths?.reduce((sum, p) => sum + (p.completedCount ?? 0), 0) ?? 0,
    [questPaths],
  );
  const questPercent = questTotal > 0 ? Math.round((questCompleted / questTotal) * 100) : 0;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const { data: notifData } = useQuery({
    queryKey: ["notifUnread"],
    queryFn: () => notificationApi.getUnreadCount().then((r) => r.data),
    refetchInterval: 30000,
  });
  const unreadNotifCount = notifData?.count ?? 0;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["photos"] }),
      queryClient.invalidateQueries({ queryKey: ["questPaths"] }),
      queryClient.invalidateQueries({ queryKey: ["dailyTip"] }),
      queryClient.invalidateQueries({ queryKey: ["notifUnread"] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const MENU_CARDS = useMemo(
    () => [
      {
        title: "Analyser\nune Photo",
        image: CARD_IMAGES.analyze,
        route: "/analyse/import",
      },
      {
        title: "Quêtes et\nProgression",
        image: CARD_IMAGES.quests,
        route: "/(tabs)/quests",
      },
      {
        title: "Découvrir\nles spots",
        image: CARD_IMAGES.spots,
        route: "/(tabs)/discover",
      },
      // {
      //   title: "Assistant\nConseil IA",
      //   image: CARD_IMAGES.assistant,
      //   route: "/(tabs)/assistant",
      // },
    ],
    [],
  );

  const handleOpenConseil = useCallback(() => { hapticLight(); setShowConseil(true); }, []);
  const handleCloseConseil = useCallback(() => setShowConseil(false), []);
  const handleTryConseil = useCallback(() => {
    setShowConseil(false);
    router.push("/(tabs)/camera");
  }, [router]);
  const handleGoToGallery = useCallback(() => { hapticLight(); router.push("/(tabs)/gallery"); }, [router]);

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
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.accentPurple}
            colors={[Colors.accentPurple]}
          />
        }
      >
        <KaytiHeader
          leftIcon={
            <TouchableOpacity
              style={hs.headerBtn}
              onPress={() => { hapticLight(); navigate("/(tabs)/settings"); }}
            >
              <Icon name="settings" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          }
          rightIcon={
            <TouchableOpacity
              style={hs.headerBtn}
              onPress={() => { hapticLight(); navigate("/notifications"); }}
            >
              <Icon name="bell" size={20} color={Colors.textPrimary} />
              {unreadNotifCount > 0 && (
                <View style={hs.badge}>
                  <Text style={hs.badgeText}>
                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          }
        />

        {/* Profile header */}
        <Animated.View style={[s.profileHeader, { opacity: headerFade }]}>
          <TouchableOpacity style={s.galleryShortcut} onPress={handleGoToGallery}>
            <LinearGradient colors={Gradients.purpleBlue} style={s.shortcutIcon}>
              <Icon name="image" size={18} color="#FFFFFF" />
            </LinearGradient>
            <Text style={s.shortcutLabel}>Ma Galerie</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.avatarCenter}
            onPress={() => { hapticLight(); navigate("/(tabs)/profile"); }}
            activeOpacity={0.8}
          >
            <View style={s.avatarRing}>
              <View style={s.avatarPhoto}>
                <LinearGradient
                  colors={["#2D1060", "#4D2090"]}
                  style={[{ flex: 1 }, s.avatarInner]}
                >
                  <Text style={s.avatarInitial}>{(user?.username ?? "?")[0].toUpperCase()}</Text>
                </LinearGradient>
              </View>
            </View>
            <Text style={s.greeting}>
              {greeting}, <Text style={s.greetingName}>{displayName}</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.conseilShortcut} onPress={handleOpenConseil}>
            <LinearGradient colors={Gradients.redPink} style={s.shortcutIcon}>
              <Icon name="lightbulb" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={s.shortcutLabel}>Conseil{"\n"}du jour</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Plans section */}
        <PlansSection />

        {/* Menu cards */}
        <View style={s.menuCards}>
          {MENU_CARDS.map((card, i) => (
            <MenuCard key={card.route + i} {...card} delay={200 + i * 100} isPrimary={i === 0} />
          ))}
        </View>

        {/* Progression des quêtes */}
        <Animated.View style={[s.questCard, { opacity: headerFade }]}>
          <Text style={s.questTitle}>Progression des quêtes</Text>
          <Text style={s.questSub}>
            {questCompleted} sur {questTotal} complétées
          </Text>
          <View style={s.questBar}>
            <LinearGradient
              colors={Gradients.brand}
              style={[s.questFill, { width: `${questPercent}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <View style={s.questRow}>
            <View style={s.questDot} />
            <Text style={s.questHint}>
              {totalPhotos === 0
                ? "Prenez votre première photo !"
                : analyzedPhotos < questTotal
                  ? "Analysez plus de photos pour progresser"
                  : "Toutes les quêtes sont complétées !"}
            </Text>
            <TouchableOpacity style={s.voirBtn} onPress={() => { hapticLight(); navigate("/(tabs)/quests"); }}>
              <Text style={s.voirBtnText}>Voir</Text>
              <Icon name="chevron-right" size={16} color="#B70E46" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Bottom spacer for tab bar */}
        <View style={s.bottomSpacer} />
      </ScrollView>

      <BottomTabBar activeRoute="/(tabs)/home" />
      <ConseilModal
        visible={showConseil}
        onClose={handleCloseConseil}
        onTry={handleTryConseil}
        tip={dailyTip?.tip}
        category={dailyTip?.category}
        isLoading={tipLoading}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20, gap: 12 },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 35,
    paddingBottom: 8,
    marginTop: -8,
  },
  galleryShortcut: { alignItems: "center", gap: 6, width: 70 },
  conseilShortcut: { alignItems: "center", gap: 6, width: 70 },
  shortcutIcon: {
    width: 34,
    height: 34,
    borderRadius: 50,
    borderStyle: "dashed",
    borderColor: "white",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    color: Colors.textPrimary,
    textAlign: "center",
  },

  avatarCenter: { alignItems: "center", gap: 10 },
  avatarRing: { width: 110, height: 110, position: "relative" },
  avatarPhoto: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 55,
    overflow: "hidden",
  },
  avatarInner: { alignItems: "center", justifyContent: "center" },
  avatarInitial: {
    fontFamily: Fonts.bold,
    fontSize: 38,
    color: "#fff",
    includeFontPadding: false,
  },

  greeting: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  greetingName: { fontFamily: Fonts.bold, color: Colors.textPrimary },

  menuCards: { paddingHorizontal: 20, gap: 10 },

  questCard: {
    marginHorizontal: 30,
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  questTitle: {
    fontFamily: Fonts.extrabold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  questSub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  questBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  questFill: { height: "100%", borderRadius: 2 },
  questRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  questDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentPink,
  },
  questHint: {
    fontFamily: Fonts.regular,
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  voirBtn: {
    borderRadius: 20,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    gap: 4,
  },

  voirBtnText: { fontFamily: Fonts.bold, color: "#000", fontSize: 13 },
  bottomSpacer: { height: 100 },
});

// ─── Plans section styles ─────────────────────────────────────────────────────
const pl = StyleSheet.create({
  wrapper: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  headerTitle: { flex: 1, fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  headerLink: { fontFamily: Fonts.semibold, fontSize: 12, color: Colors.textMuted },
  row: { flexDirection: "row", gap: 10 },
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
    overflow: "hidden",
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardHL: { borderWidth: 0 },
  cardPro: { borderColor: "rgba(255,215,0,0.35)", borderWidth: 1.5 },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: { fontFamily: Fonts.bold, fontSize: 8, color: "#fff", letterSpacing: 0.3 },
  badgePro: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,215,0,0.18)",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.4)",
  },
  badgeProText: { fontFamily: Fonts.bold, fontSize: 8, color: "#FFD700", letterSpacing: 0.3 },
  iconBubble: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBubbleHL: { backgroundColor: "rgba(255,255,255,0.2)" },
  planName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  planPrice: { fontFamily: Fonts.extrabold, fontSize: 17, color: Colors.textPrimary },
  planSub: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  textWhite: { color: "#fff" },
  textWhite70: { color: "rgba(255,255,255,0.7)" },
  textWhite85: { color: "rgba(255,255,255,0.85)" },
});

// Header button styles (settings left / bell right)
const hs = StyleSheet.create({
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accentPink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: Fonts.extrabold,
    fontSize: 9,
    color: "#fff",
    includeFontPadding: false,
  },
});
