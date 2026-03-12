import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Colors, Gradients } from "../../../theme/colors";
import {
  KaytiHeader,
  GradientButton,
  FeatureList,
  UserBadge,
} from "../../../components/ui";

const { width } = Dimensions.get("window");

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.statPill}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

interface EventCardProps {
  title: string;
  tag: string;
  tagColor: string;
  location: string;
  time: string;
  memberCount: number;
  delay: number;
  bgColors: readonly [string, string];
}

function EventCard({
  title,
  tag,
  tagColor,
  location,
  time,
  memberCount,
  delay,
  bgColors,
}: EventCardProps) {
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
        s.eventCard,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      <LinearGradient colors={bgColors} style={s.eventCardBg} />
      <LinearGradient
        colors={["transparent", "rgba(8,8,20,0.8)"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Tag */}
      <View style={[s.eventTag, { backgroundColor: tagColor }]}>
        <Text style={s.eventTagText}>{tag}</Text>
      </View>

      {/* Bottom info */}
      <View style={s.eventInfo}>
        <Text style={s.eventTitle}>{title}</Text>
        <Text style={s.eventMeta}>
          {location} · {time}
        </Text>
        {/* Member avatars */}
        <View style={s.eventMembers}>
          {["#E91E8C", "#7B2FBE", "#00C851"].map((c, i) => (
            <View
              key={i}
              style={[
                s.memberDot,
                { backgroundColor: c, marginLeft: i > 0 ? -6 : 0 },
              ]}
            />
          ))}
          <Text style={s.memberCount}>+{memberCount} inscrits</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function CommunityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ answers: string }>();

  const headerFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);

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
        <KaytiHeader />

        {/* Hero text */}
        <Animated.View style={[s.hero, { opacity: headerFade }]}>
          <Text style={s.heroTitle}>Rejoignez la{"\n"}communauté</Text>
          <Text style={s.heroSubtitle}>
            Partagez vos photos, participez aux{"\n"}événements, progressez
            ensemble
          </Text>
        </Animated.View>

        {/* Stats banner */}
        <Animated.View style={[s.statsBanner, { opacity: headerFade }]}>
          <LinearGradient
            colors={Gradients.purpleBlue}
            style={s.statsBannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <StatPill value="12K+" label="Membres" />
            <View style={s.statsDivider} />
            <StatPill value="450" label="Événements" />
            <View style={s.statsDivider} />
            <StatPill value="89K" label="Photos" />
          </LinearGradient>
        </Animated.View>

        {/* Events section */}
        <View style={s.eventsSection}>
          <Text style={s.sectionTitle}>Événements à venir</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.eventsRow}
          >
            <EventCard
              title="Sortie Golden Hour"
              tag="Demain"
              tagColor="#E91E8C"
              location="Parc de la Tête d'Or"
              time="18h30"
              memberCount={24}
              delay={200}
              bgColors={["#2D1060", "#1A0A40"]}
            />
            <EventCard
              title="Sortie Urbaine"
              tag="Samedi"
              tagColor="#7B2FBE"
              location="Centre-ville"
              time="10h00"
              memberCount={12}
              delay={350}
              bgColors={["#1A2060", "#0A1040"]}
            />
          </ScrollView>
        </View>

        {/* Feature list */}
        <FeatureList
          items={[
            "Événements chaque semaine",
            "Défis & concours réguliers",
            "Partagez & apprenez ensemble",
          ]}
        />

        {/* CTA */}
        <GradientButton
          label="Suivant"
          onPress={() =>
            router.push({
              pathname: "/(auth)/onboarding/questionnaire",
              params: { step: "3", answers: params.answers },
            })
          }
          style={s.cta}
        />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 50, gap: 20 },

  hero: { paddingHorizontal: 20 },
  heroTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: Colors.textPrimary,
    lineHeight: 38,
    marginBottom: 8,
  },
  heroSubtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },

  statsBanner: { marginHorizontal: 20, borderRadius: 16, overflow: "hidden" },
  statsBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statPill: { alignItems: "center", gap: 4 },
  statValue: { fontSize: 26, fontWeight: "900", color: Colors.textPrimary },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
  },
  statsDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  eventsSection: { gap: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    paddingHorizontal: 20,
  },
  eventsRow: { paddingHorizontal: 20, gap: 12 },

  eventCard: {
    width: width * 0.62,
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
  },
  eventCardBg: { ...StyleSheet.absoluteFillObject },
  eventTag: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 2,
  },
  eventTagText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  eventInfo: { padding: 14, gap: 4, zIndex: 2 },
  eventTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary },
  eventMeta: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  eventMembers: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  memberDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.bgDeep,
  },
  memberCount: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginLeft: 8 },

  cta: { marginHorizontal: 20 },
});
