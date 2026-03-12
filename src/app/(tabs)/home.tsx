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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { KaytiHeader, BottomTabBar, UserBadge } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";
import { useRouter } from "expo-router";
import { navigate } from "@/utils/navigation";
import { useAuthStore } from "../../stores/authStore";
import { usePhotos } from "../../hooks/usePhotos";

// Card background images
const CARD_IMAGES = {
  analyze: require("../../assets/images/card-analyze.jpg"),
  quests: require("../../assets/images/card-quests.jpg"),
  spots: require("../../assets/images/card-spots.jpg"),
  assistant: require("../../assets/images/card-assistant.jpg"),
};

const { width, height } = Dimensions.get("window");

// Menu card with photo background
interface MenuCardProps {
  title: string;
  image: ImageSourcePropType;
  route: string;
  delay: number;
}

function MenuCard({ title, image, route, delay }: MenuCardProps) {
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
      style={[
        mc.wrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity
        onPress={() => navigate(route)}
        activeOpacity={0.85}
        style={[mc.card]}
      >
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

// Conseil du jour modal
interface ConseilModalProps {
  visible: boolean;
  onClose: () => void;
  onTry: () => void;
}

function ConseilModal({ visible, onClose, onTry }: ConseilModalProps) {
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
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[cm.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
        />
        <Animated.View
          style={[cm.card, { transform: [{ translateY: slideAnim }] }]}
        >
          <LinearGradient colors={["#5F2097", "#1F63DA"]} style={cm.cardBg} />
          <TouchableOpacity style={cm.closeBtn} onPress={onClose}>
            <Icon name="x" size={16} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={cm.title}>Conseil du jour</Text>
          <Text style={cm.body}>
            Utilisez la règle des tiers pour des{"\n"}compositions plus
            dynamiques
          </Text>
          <TouchableOpacity
            style={cm.tryBtn}
            activeOpacity={0.85}
            onPress={onTry}
          >
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

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const displayName = useMemo(
    () =>
      user?.username
        ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
        : "Photographe",
    [user?.username],
  );
  const [showConseil, setShowConseil] = useState(false);
  const headerFade = useRef(new Animated.Value(0)).current;

  // ── Dynamic quest progress from real photo data ──
  const { data: photosData } = usePhotos();
  const totalPhotos = photosData?.total ?? 0;
  const analyzedPhotos = useMemo(
    () =>
      photosData?.photos?.filter((p) => (p.analyses?.length ?? 0) > 0).length ?? 0,
    [photosData?.photos],
  );
  // Quest milestones: photo-based progression
  const QUEST_TOTAL = 12;
  const questCompleted = Math.min(analyzedPhotos, QUEST_TOTAL);
  const questPercent =
    QUEST_TOTAL > 0 ? Math.round((questCompleted / QUEST_TOTAL) * 100) : 0;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

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
      {
        title: "Assistant\nConseil IA",
        image: CARD_IMAGES.assistant,
        route: "/(tabs)/assistant",
      },
    ],
    [],
  );

  const handleOpenConseil = useCallback(() => setShowConseil(true), []);
  const handleCloseConseil = useCallback(() => setShowConseil(false), []);
  const handleTryConseil = useCallback(() => {
    setShowConseil(false);
    router.push("/(tabs)/assistant");
  }, [router]);
  const handleGoToGallery = useCallback(
    () => router.push("/(tabs)/gallery"),
    [router],
  );

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
        <KaytiHeader showSettings />

        {/* Profile header */}
        <Animated.View style={[s.profileHeader, { opacity: headerFade }]}>
          <TouchableOpacity
            style={s.galleryShortcut}
            onPress={handleGoToGallery}
          >
            <LinearGradient
              colors={Gradients.purpleBlue}
              style={s.shortcutIcon}
            >
              <Icon name="image" size={18} color="#FFFFFF" />
            </LinearGradient>
            <Text style={s.shortcutLabel}>Ma Galerie</Text>
          </TouchableOpacity>

          <View style={s.avatarCenter}>
            <View style={s.avatarRing}>
              <View style={s.avatarPhoto}>
                <LinearGradient
                  colors={["#2D1060", "#4D2090"]}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
            <Text style={s.greeting}>
              Hello, <Text style={s.greetingName}>{displayName}</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={s.conseilShortcut}
            onPress={handleOpenConseil}
          >
            <LinearGradient colors={Gradients.redPink} style={s.shortcutIcon}>
              <Icon name="lightbulb" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={s.shortcutLabel}>Conseil{"\n"}du jour</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Menu cards */}
        <View style={s.menuCards}>
          {MENU_CARDS.map((card, i) => (
            <MenuCard key={card.route + i} {...card} delay={200 + i * 100} />
          ))}
        </View>

        {/* Progression des quêtes */}
        <Animated.View style={[s.questCard, { opacity: headerFade }]}>
          <Text style={s.questTitle}>Progression des quêtes</Text>
          <Text style={s.questSub}>
            {questCompleted} sur {QUEST_TOTAL} complétées
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
                : analyzedPhotos < QUEST_TOTAL
                ? "Analysez plus de photos pour progresser"
                : "Toutes les quêtes sont complétées !"}
            </Text>
            <TouchableOpacity
              style={s.voirBtn}
              onPress={() => navigate("/(tabs)/quests")}
            >
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
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20, gap: 20 },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 35,
    paddingBottom: 8,
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
