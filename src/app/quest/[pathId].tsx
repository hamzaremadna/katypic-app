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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Gradients } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { KaytiHeader, BottomTabBar } from "../../components/ui";
import { Icon, IconName } from "../../components/ui/Icon";

const { width } = Dimensions.get("window");

// ─── Types ───────────────────────────────────────────────
type QuestStatus = "completed" | "in_progress" | "locked";

interface Quest {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  xp: number;
  status: QuestStatus;
  progress?: string;
  progressPercent?: number;
  icon: IconName;
  isFinal?: boolean;
}

interface PathConfig {
  title: string;
  headerColor: string;
  accentColor: string;
  bgGradient: readonly [string, string];
  completedCount: number;
  totalCount: number;
  quests: Quest[];
}

// ─── Data by path ────────────────────────────────────────
const PATH_DATA: Record<string, PathConfig> = {
  debutant: {
    title: "Quêtes Débutant",
    headerColor: "#4A90E2",
    accentColor: "#4A90E2",
    bgGradient: ["rgba(74,144,226,0.15)", "transparent"],
    completedCount: 2,
    totalCount: 6,
    quests: [
      {
        id: "d1",
        category: "DÉCOUVERTE",
        title: "Premiers pas",
        subtitle: "Découvre l'application",
        xp: 10,
        status: "completed",
        icon: "compass",
      },
      {
        id: "d2",
        category: "INTERFACE",
        title: "L'interface",
        subtitle: "Maîtrise les outils",
        xp: 15,
        status: "completed",
        icon: "sliders",
      },
      {
        id: "d3",
        category: "PHOTO",
        title: "Prise de photo",
        subtitle: "Capture 5 photos",
        xp: 20,
        status: "in_progress",
        progress: "3/5",
        progressPercent: 60,
        icon: "camera",
      },
      {
        id: "d4",
        category: "RETOUCHE",
        title: "Retouche basique",
        subtitle: "Retouche ta première photo",
        xp: 25,
        status: "locked",
        icon: "image",
      },
      {
        id: "d5",
        category: "IA",
        title: "Assistant IA",
        subtitle: "Utilise l'analyse IA",
        xp: 30,
        status: "locked",
        icon: "sparkles",
      },
      {
        id: "d-final",
        category: "MISSION FINALE",
        title: "Maîtrise app",
        subtitle: "Termine toutes les étapes",
        xp: 50,
        status: "locked",
        icon: "trophy",
        isFinal: true,
      },
    ],
  },
  creatif: {
    title: "Quêtes Créatif",
    headerColor: "#9B59B6",
    accentColor: "#9B59B6",
    bgGradient: ["rgba(155,89,182,0.2)", "transparent"],
    completedCount: 1,
    totalCount: 6,
    quests: [
      {
        id: "c1",
        category: "COMPOSITION",
        title: "Règle des Tiers",
        subtitle: "Divise ton image",
        xp: 25,
        status: "completed",
        icon: "grid",
      },
      {
        id: "c2",
        category: "LUMIÈRE",
        title: "Jeu Lumière",
        subtitle: "Maîtrise l'éclairage",
        xp: 30,
        status: "in_progress",
        progress: "2/5",
        progressPercent: 40,
        icon: "sun",
      },
      {
        id: "c3",
        category: "TIMING",
        title: "Golden Hour",
        subtitle: "Heure dorée",
        xp: 35,
        status: "locked",
        icon: "clock",
      },
      {
        id: "c4",
        category: "PORTRAIT",
        title: "Portrait Créatif",
        subtitle: "3 angles différents",
        xp: 40,
        status: "locked",
        icon: "user",
      },
      {
        id: "c5",
        category: "COULEUR",
        title: "Couleurs Vibrantes",
        subtitle: "Série colorée",
        xp: 40,
        status: "locked",
        icon: "sparkles",
      },
      {
        id: "c-final",
        category: "FINALE",
        title: "Artiste Accompli",
        subtitle: "Complète toutes les quêtes",
        xp: 100,
        status: "locked",
        icon: "trophy",
        isFinal: true,
      },
    ],
  },
  explorateur: {
    title: "Quêtes Explorateur",
    headerColor: "#E91E8C",
    accentColor: "#E91E8C",
    bgGradient: ["rgba(233,30,140,0.15)", "transparent"],
    completedCount: 1,
    totalCount: 6,
    quests: [
      {
        id: "e1",
        category: "DÉCOUVERTE",
        title: "Premier Spot",
        subtitle: "Visite un spot photo",
        xp: 15,
        status: "completed",
        icon: "marker-pin",
      },
      {
        id: "e2",
        category: "ÉVÉNEMENT",
        title: "Premier Event",
        subtitle: "Participe à un événement",
        xp: 25,
        status: "in_progress",
        progress: "0/1",
        progressPercent: 0,
        icon: "calendar",
      },
      {
        id: "e3",
        category: "COMMUNAUTÉ",
        title: "Photographe Social",
        subtitle: "Ajoute 3 amis",
        xp: 20,
        status: "locked",
        icon: "users",
      },
      {
        id: "e4",
        category: "PARTAGE",
        title: "Partage & Inspire",
        subtitle: "Partage 5 photos",
        xp: 30,
        status: "locked",
        icon: "share",
      },
      {
        id: "e5",
        category: "VOYAGE",
        title: "Globe-trotter",
        subtitle: "Visite 5 spots différents",
        xp: 40,
        status: "locked",
        icon: "globe",
      },
      {
        id: "e-final",
        category: "MISSION FINALE",
        title: "Grand Explorateur",
        subtitle: "Termine toutes les étapes",
        xp: 75,
        status: "locked",
        icon: "trophy",
        isFinal: true,
      },
    ],
  },
};

// ─── Quest Card ──────────────────────────────────────────
function QuestCard({
  quest,
  accentColor,
  onPress,
}: {
  quest: Quest;
  accentColor: string;
  onPress: () => void;
}) {
  const isCompleted = quest.status === "completed";
  const isInProgress = quest.status === "in_progress";
  const isLocked = quest.status === "locked";

  return (
    <TouchableOpacity
      style={[
        qc.card,
        isInProgress && { borderColor: accentColor, borderWidth: 1.5 },
        isLocked && qc.cardLocked,
        quest.isFinal && { borderColor: "#FFB800", borderWidth: 1.5 },
      ]}
      activeOpacity={isLocked ? 1 : 0.85}
      disabled={isLocked}
      onPress={onPress}
    >
      {/* Completed overlay */}
      {isCompleted && (
        <LinearGradient
          colors={["rgba(255,255,255,0.04)", "rgba(255,255,255,0.02)"]}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* In progress background */}
      {isInProgress && (
        <LinearGradient
          colors={[`${accentColor}15`, "rgba(26,26,46,0.95)"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {/* Final quest background */}
      {quest.isFinal && (
        <LinearGradient
          colors={["rgba(255,184,0,0.08)", "rgba(26,26,46,0.95)"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      <View style={qc.content}>
        {/* Left side: icon or checkmark */}
        <View style={qc.leftSide}>
          {isCompleted ? (
            <View style={[qc.checkCircle, { backgroundColor: `${accentColor}30` }]}>
              <Icon name="check" size={20} color={accentColor} />
            </View>
          ) : isLocked ? (
            <View style={qc.lockCircle}>
              <Icon name="lock" size={18} color={Colors.textMuted} />
            </View>
          ) : (
            <View style={[qc.iconCircle, { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }]}>
              <Icon name={quest.icon} size={20} color={accentColor} />
            </View>
          )}
        </View>

        {/* Center: title + subtitle */}
        <View style={qc.center}>
          {quest.isFinal && (
            <View style={qc.finalTag}>
              <Icon name="trophy" size={12} color="#FFB800" />
              <Text style={qc.finalTagText}>{quest.category}</Text>
            </View>
          )}
          <Text
            style={[
              qc.title,
              isLocked && qc.titleLocked,
              quest.isFinal && { color: Colors.textPrimary },
            ]}
          >
            {quest.title}
          </Text>
          <Text style={[qc.subtitle, isLocked && qc.subtitleLocked]}>
            {quest.subtitle}
          </Text>

          {/* XP */}
          <View style={qc.xpRow}>
            {isCompleted ? (
              <>
                <Icon name="check" size={12} color={Colors.accentGreen} />
                <Text style={[qc.xpText, { color: Colors.accentGreen }]}>
                  {quest.xp} XP
                </Text>
              </>
            ) : (
              <>
                <Icon name="zap" size={12} color="#FF8C00" />
                <Text style={[qc.xpText, { color: "#FF8C00" }]}>
                  {quest.xp} XP
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Right side: status badge or EN COURS + progress */}
        <View style={qc.rightSide}>
          {isInProgress && (
            <>
              <View style={[qc.enCoursBadge, { backgroundColor: accentColor }]}>
                <Text style={qc.enCoursText}>EN COURS</Text>
              </View>
              <Text style={[qc.progressText, { color: accentColor }]}>
                {quest.progress}
              </Text>
            </>
          )}
          {isInProgress && quest.progressPercent != null && (
            <Text style={[qc.percentText, { color: accentColor }]}>
              {quest.progressPercent}%
            </Text>
          )}
          {quest.isFinal && isLocked && (
            <View style={qc.finalLock}>
              <Icon name="lock" size={16} color={Colors.textMuted} />
            </View>
          )}
          {isInProgress && (
            <Icon name="chevron-right" size={18} color={Colors.textMuted} />
          )}
        </View>
      </View>

      {/* Progress bar for in-progress quests */}
      {isInProgress && quest.progressPercent != null && (
        <View style={qc.progressBarWrap}>
          <View style={qc.progressBarTrack}>
            <View
              style={[
                qc.progressBarFill,
                {
                  width: `${quest.progressPercent}%`,
                  backgroundColor: accentColor,
                },
              ]}
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const qc = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardLocked: { opacity: 0.5 },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  leftSide: {},
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  lockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  center: { flex: 1, gap: 3 },
  finalTag: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 },
  finalTagText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: "#FFB800",
    letterSpacing: 1,
  },
  title: { fontSize: 16, fontFamily: Fonts.bold, color: Colors.textPrimary },
  titleLocked: { color: Colors.textMuted },
  subtitle: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textSecondary },
  subtitleLocked: { color: Colors.textMuted },
  xpRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  xpText: { fontSize: 13, fontFamily: Fonts.bold },
  rightSide: { alignItems: "flex-end", gap: 4 },
  enCoursBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  enCoursText: { fontSize: 9, fontFamily: Fonts.bold, color: "#fff", letterSpacing: 0.5 },
  progressText: { fontSize: 13, fontFamily: Fonts.bold },
  percentText: { fontSize: 12, fontFamily: Fonts.semibold },
  finalLock: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarWrap: { paddingHorizontal: 16, paddingBottom: 14 },
  progressBarTrack: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 3 },
});

// ─── Main Screen ─────────────────────────────────────────
export default function QuestPathScreen() {
  const router = useRouter();
  const { pathId } = useLocalSearchParams<{ pathId: string }>();

  const config = PATH_DATA[pathId ?? "debutant"] ?? PATH_DATA.debutant;
  const progress = config.completedCount / config.totalCount;

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header gradient */}
      <LinearGradient
        colors={config.bgGradient as [string, string]}
        style={s.headerGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        <KaytiHeader
          showBack
          title={config.title}
          rightIcon={
            <Icon name="star" size={20} color={config.accentColor} />
          }
        />

        {/* Level progress */}
        <View style={s.levelCard}>
          <View style={s.levelRow}>
            <Text style={s.levelText}>
              Niveau {config.completedCount + 1} sur {config.totalCount}
            </Text>
            <View style={s.levelCount}>
              <Text style={s.levelCountText}>
                {config.completedCount}/{config.totalCount}
              </Text>
              {config.completedCount > 0 && (
                <Icon name="check" size={12} color={Colors.accentGreen} />
              )}
            </View>
          </View>
          <View style={s.levelBarTrack}>
            <View
              style={[
                s.levelBarFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: config.accentColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Quest list */}
        <View style={s.questList}>
          {config.quests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              accentColor={config.accentColor}
              onPress={() => {
                if (quest.status === "in_progress") {
                  router.push({
                    pathname: "/quest/challenge/[challengeId]",
                    params: {
                      challengeId: quest.id,
                      title: quest.title,
                      category: quest.category,
                      subtitle: quest.subtitle,
                      progress: quest.progress ?? "",
                      xp: String(quest.xp),
                      color: config.accentColor,
                      icon: quest.icon,
                    },
                  });
                }
              }}
            />
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
  headerGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },

  levelCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
  },
  levelCount: { flexDirection: "row", alignItems: "center", gap: 6 },
  levelCountText: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: Colors.textSecondary,
  },
  levelBarTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 4,
    overflow: "hidden",
  },
  levelBarFill: { height: "100%", borderRadius: 4 },

  questList: { paddingHorizontal: 20, marginTop: 20, gap: 12 },
});
