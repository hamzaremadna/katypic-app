import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { KaytiHeader, BottomTabBar } from "../../components/ui";
import { Icon, IconName } from "../../components/ui/Icon";

const { width } = Dimensions.get("window");

// ─── Types & Data ────────────────────────────────────────
interface StatRing {
  label: string;
  value: string;
  color: string;
  progress: number; // 0–1
  icon: IconName;
}

interface QuestPath {
  id: string;
  tag: string;
  tagColor: string;
  borderColor: string;
  bgColors: readonly [string, string];
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  icon: IconName;
  iconColor: string;
}

interface Badge {
  id: string;
  icon: IconName;
  color: string;
  unlocked: boolean;
}

const STATS: StatRing[] = [
  { label: "JOURS", value: "5", color: "#E91E8C", progress: 0.7, icon: "clock" },
  { label: "NIVEAU", value: "3", color: "#4A90E2", progress: 0.5, icon: "zap" },
  { label: "BADGES", value: "3/6", color: "#FFB800", progress: 0.5, icon: "trophy" },
];

const PATHS: QuestPath[] = [
  {
    id: "debutant",
    tag: "LES BASES",
    tagColor: "#4A90E2",
    borderColor: "#4A90E2",
    bgColors: ["rgba(74,144,226,0.15)", "rgba(26,26,46,0.95)"],
    title: "Débutant",
    subtitle: "Apprends les fondamentaux de la photo",
    completedCount: 2,
    totalCount: 6,
    icon: "target",
    iconColor: "#4A90E2",
  },
  {
    id: "creatif",
    tag: "MODE ARTISTIQUE",
    tagColor: "#9B59B6",
    borderColor: "#9B59B6",
    bgColors: ["rgba(155,89,182,0.15)", "rgba(26,26,46,0.95)"],
    title: "Créatif",
    subtitle: "Développe ton style unique et ta vision",
    completedCount: 1,
    totalCount: 6,
    icon: "sparkles",
    iconColor: "#9B59B6",
  },
  {
    id: "explorateur",
    tag: "MONDE OUVERT",
    tagColor: "#E91E8C",
    borderColor: "#E91E8C",
    bgColors: ["rgba(233,30,140,0.15)", "rgba(26,26,46,0.95)"],
    title: "Explorateur",
    subtitle: "Découvre les meilleurs spots urbains",
    completedCount: 1,
    totalCount: 6,
    icon: "map",
    iconColor: "#E91E8C",
  },
];

const BADGES: Badge[] = [
  { id: "1", icon: "camera", color: "#4A90E2", unlocked: true },
  { id: "2", icon: "sun", color: "#E91E8C", unlocked: true },
  { id: "3", icon: "target", color: "#00C851", unlocked: true },
  { id: "4", icon: "sparkles", color: "#9B59B6", unlocked: false },
  { id: "5", icon: "map", color: "#4A90E2", unlocked: false },
  { id: "6", icon: "trophy", color: "#FFB800", unlocked: false },
  { id: "7", icon: "zap", color: "#E91E8C", unlocked: false },
  { id: "8", icon: "star", color: "#9B59B6", unlocked: false },
];

// ─── Stat Ring Component ─────────────────────────────────
const RING_SIZE = 80;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function StatRingItem({ stat }: { stat: StatRing }) {
  const strokeDashoffset =
    RING_CIRCUMFERENCE - stat.progress * RING_CIRCUMFERENCE;

  return (
    <View style={srStyles.item}>
      <View style={srStyles.ringWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={RING_STROKE}
            fill="transparent"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={stat.color}
            strokeWidth={RING_STROKE}
            fill="transparent"
            strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={srStyles.iconOverlay}>
          <Icon name={stat.icon} size={22} color={stat.color} />
        </View>
      </View>
      <Text style={[srStyles.value, { color: stat.color }]}>{stat.value}</Text>
      <Text style={srStyles.label}>{stat.label}</Text>
    </View>
  );
}

const srStyles = StyleSheet.create({
  item: { alignItems: "center", gap: 4 },
  ringWrap: { position: "relative", width: RING_SIZE, height: RING_SIZE },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { fontSize: 18, fontFamily: Fonts.extrabold },
  label: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
});

// ─── Path Card Component ─────────────────────────────────
function PathCard({ path, onPress }: { path: QuestPath; onPress: () => void }) {
  const progress = path.completedCount / path.totalCount;
  const percentage = Math.round(progress * 100);

  return (
    <TouchableOpacity
      style={[pcStyles.card, { borderColor: path.borderColor }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <LinearGradient
        colors={path.bgColors as [string, string]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={pcStyles.topRow}>
        <View style={[pcStyles.tag, { backgroundColor: path.tagColor }]}>
          <Text style={pcStyles.tagText}>{path.tag}</Text>
        </View>
        <Text style={pcStyles.count}>
          {path.completedCount}/{path.totalCount}
        </Text>
      </View>

      <View style={pcStyles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={pcStyles.title}>{path.title}</Text>
          <Text style={pcStyles.subtitle} numberOfLines={2}>
            {path.subtitle}
          </Text>
        </View>
        <View style={[pcStyles.iconCircle, { borderColor: `${path.iconColor}40` }]}>
          <Icon name={path.icon} size={24} color={path.iconColor} />
        </View>
      </View>

      <View style={pcStyles.progressSection}>
        <Text style={pcStyles.progressLabel}>Progression</Text>
        <Text style={[pcStyles.progressPercent, { color: path.tagColor }]}>
          {percentage}%
        </Text>
      </View>
      <View style={pcStyles.barTrack}>
        <View
          style={[
            pcStyles.barFill,
            { width: `${percentage}%`, backgroundColor: path.tagColor },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const pcStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    padding: 18,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: "#fff",
    letterSpacing: 0.8,
  },
  count: { fontSize: 13, fontFamily: Fonts.semibold, color: Colors.textSecondary },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 22, fontFamily: Fonts.extrabold, color: Colors.textPrimary },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  progressSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: { fontSize: 12, fontFamily: Fonts.semibold, color: Colors.textMuted },
  progressPercent: { fontSize: 14, fontFamily: Fonts.bold },
  barTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
});

// ─── Badge Item ──────────────────────────────────────────
function BadgeItem({ badge }: { badge: Badge }) {
  return (
    <View style={!badge.unlocked ? biStyles.locked : undefined}>
      <View
        style={[
          biStyles.circle,
          { borderColor: badge.unlocked ? badge.color : Colors.cardBorder },
        ]}
      >
        <Icon
          name={badge.icon}
          size={22}
          color={badge.unlocked ? badge.color : Colors.textMuted}
        />
      </View>
    </View>
  );
}

const biStyles = StyleSheet.create({
  locked: { opacity: 0.35 },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});

// ─── Main Screen ─────────────────────────────────────────
export default function QuestsScreen() {
  const router = useRouter();

  const totalXp = 340;
  const nextLevelXp = 500;
  const currentLevel = 3;
  const xpProgress = totalXp / nextLevelXp;

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
        <KaytiHeader showBack title="Quêtes & Progression" />

        {/* Stat Rings */}
        <View style={s.statsRow}>
          {STATS.map((stat) => (
            <StatRingItem key={stat.label} stat={stat} />
          ))}
        </View>

        {/* XP Progress */}
        <View style={s.xpCard}>
          <View style={s.xpHeader}>
            <View style={s.xpBadge}>
              <Text style={s.xpBadgeText}>XP</Text>
            </View>
            <Text style={s.xpTitle}>
              Niveau {currentLevel} → {currentLevel + 1}
            </Text>
            <Text style={s.xpCount}>
              {totalXp} / {nextLevelXp}
            </Text>
          </View>
          <View style={s.xpBarTrack}>
            <LinearGradient
              colors={["#4A90E2", "#7B2FBE"]}
              style={[s.xpBarFill, { width: `${xpProgress * 100}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>

        {/* Parcours disponibles */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Parcours disponibles</Text>
          <Text style={s.sectionSubtitle}>
            Choisis ton aventure et progresse à ton rythme
          </Text>
        </View>

        <View style={s.pathsList}>
          {PATHS.map((path) => (
            <PathCard
              key={path.id}
              path={path}
              onPress={() =>
                router.push({
                  pathname: "/quest/[pathId]",
                  params: { pathId: path.id },
                })
              }
            />
          ))}
        </View>

        {/* Mes badges */}
        <View style={s.section}>
          <View style={s.badgesHeader}>
            <Text style={s.sectionTitle}>Mes badges</Text>
            <TouchableOpacity>
              <Text style={s.seeAllLink}>Voir tout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.badgesGrid}>
          {BADGES.map((badge) => (
            <BadgeItem key={badge.id} badge={badge} />
          ))}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      <BottomTabBar activeRoute="/(tabs)/quests" />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20 },

  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },

  xpCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  xpHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  xpBadge: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  xpBadgeText: { fontSize: 11, fontFamily: Fonts.bold, color: "#fff" },
  xpTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
  },
  xpCount: { fontSize: 14, fontFamily: Fonts.semibold, color: Colors.textSecondary },
  xpBarTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 4,
    overflow: "hidden",
  },
  xpBarFill: { height: "100%", borderRadius: 4 },

  section: { paddingHorizontal: 20, marginTop: 28, gap: 6 },
  sectionTitle: { fontSize: 18, fontFamily: Fonts.extrabold, color: Colors.textPrimary },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },

  pathsList: { paddingHorizontal: 20, marginTop: 16, gap: 14 },

  badgesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAllLink: { fontSize: 13, fontFamily: Fonts.semibold, color: "#4A90E2" },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    marginTop: 14,
    gap: 14,
  },
});
