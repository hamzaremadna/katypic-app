import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors } from "../../theme/colors";
import { Fonts } from "../../theme/typography";
import { KaytiHeader } from "../../components/ui";
import { Icon, IconName } from "../../components/ui/Icon";
import { useQuestPath, useStartQuest } from "../../hooks/useQuestPaths";

// ─── Types ────────────────────────────────────────────────
type QuestStatus = "completed" | "in_progress" | "locked";

interface Quest {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  xp: number;
  status: QuestStatus;
  requiredPhotos: number;
  photosTaken: number;
  icon: IconName;
  isFinal: boolean;
  tips: string[];
}

// ─── Helpers ──────────────────────────────────────────────
const CATEGORY_ICON: Record<string, IconName> = {
  PHOTO:       "camera",
  "LUMIÈRE":   "sun",
  COMPOSITION: "grid",
  TECHNIQUE:   "sliders",
  "DÉCOUVERTE": "compass",
  "ÉVÉNEMENT": "calendar",
};

function mapStatus(status: string): QuestStatus {
  if (status === "COMPLETED")   return "completed";
  if (status === "IN_PROGRESS") return "in_progress";
  return "locked";
}

// ─── Quest Card ───────────────────────────────────────────
function QuestCard({
  quest,
  accentColor,
  onPress,
}: {
  quest: Quest;
  accentColor: string;
  onPress: () => void;
}) {
  const isCompleted  = quest.status === "completed";
  const isInProgress = quest.status === "in_progress";
  const isLocked     = quest.status === "locked";

  const progressPercent =
    quest.requiredPhotos > 0
      ? Math.round((quest.photosTaken / quest.requiredPhotos) * 100)
      : 0;
  const progressText = `${quest.photosTaken}/${quest.requiredPhotos}`;

  return (
    <TouchableOpacity
      style={[
        qc.card,
        isInProgress && { borderColor: accentColor, borderWidth: 1.5 },
        isLocked && qc.cardLocked,
        quest.isFinal && { borderColor: "#FFB800", borderWidth: 1.5 },
      ]}
      activeOpacity={isLocked || isCompleted ? 1 : 0.85}
      disabled={isLocked || isCompleted}
      onPress={onPress}
    >
      {/* Completed overlay */}
      {isCompleted && (
        <LinearGradient
          colors={["rgba(255,255,255,0.04)", "rgba(255,255,255,0.02)"]}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* In-progress background */}
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
        {/* Left: icon or status indicator */}
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
            <View
              style={[
                qc.iconCircle,
                { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` },
              ]}
            >
              <Icon name={quest.icon} size={20} color={accentColor} />
            </View>
          )}
        </View>

        {/* Center: title + subtitle + XP */}
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
                <Text style={[qc.xpText, { color: "#FF8C00" }]}>{quest.xp} XP</Text>
              </>
            )}
          </View>
        </View>

        {/* Right: badge + progress */}
        <View style={qc.rightSide}>
          {isInProgress && (
            <>
              <View style={[qc.enCoursBadge, { backgroundColor: accentColor }]}>
                <Text style={qc.enCoursText}>EN COURS</Text>
              </View>
              <Text style={[qc.progressText, { color: accentColor }]}>{progressText}</Text>
              <Text style={[qc.percentText, { color: accentColor }]}>{progressPercent}%</Text>
              <Icon name="chevron-right" size={18} color={Colors.textMuted} />
            </>
          )}
          {quest.isFinal && isLocked && (
            <View style={qc.finalLock}>
              <Icon name="lock" size={16} color={Colors.textMuted} />
            </View>
          )}
        </View>
      </View>

      {/* Progress bar for in-progress quests */}
      {isInProgress && (
        <View style={qc.progressBarWrap}>
          <View style={qc.progressBarTrack}>
            <View
              style={[
                qc.progressBarFill,
                { width: `${progressPercent}%`, backgroundColor: accentColor },
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

// ─── Main Screen ──────────────────────────────────────────
export default function QuestPathScreen() {
  const router = useRouter();
  const { pathId } = useLocalSearchParams<{ pathId: string }>();
  const { data, isLoading } = useQuestPath(pathId ?? "");
  const { mutate: doStartQuest } = useStartQuest();

  if (isLoading || !data) {
    return (
      <View style={[s.container, s.centered]}>
        <StatusBar style="light" />
        <LinearGradient
          colors={["#0E0A24", "#080814"]}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator color="#4A90E2" size="large" />
      </View>
    );
  }

  const { path, quests: apiQuests } = data;
  const accentColor = path.color;
  const bgGradient = [`${accentColor}20`, "transparent"] as readonly [string, string];
  const progress = path.totalCount > 0 ? path.completedCount / path.totalCount : 0;

  const quests: Quest[] = apiQuests.map((q) => ({
    id: q.id,
    category: q.category,
    title: q.title,
    subtitle: q.subtitle,
    xp: q.xp,
    status: mapStatus(q.status),
    requiredPhotos: q.requiredPhotos,
    photosTaken: q.photosTaken,
    icon: (CATEGORY_ICON[q.category] ?? "camera") as IconName,
    isFinal: q.isFinal,
    tips: q.tips,
  }));

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E0A24", "#080814"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header gradient glow */}
      <LinearGradient
        colors={bgGradient as [string, string]}
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
          title={`Quêtes ${path.title}`}
          rightIcon={<Icon name="star" size={20} color={accentColor} />}
        />

        {/* Level progress card */}
        <View style={s.levelCard}>
          <View style={s.levelRow}>
            <Text style={s.levelText}>
              Niveau {path.completedCount + 1} sur {path.totalCount}
            </Text>
            <View style={s.levelCount}>
              <Text style={s.levelCountText}>
                {path.completedCount}/{path.totalCount}
              </Text>
              {path.completedCount > 0 && (
                <Icon name="check" size={12} color={Colors.accentGreen} />
              )}
            </View>
          </View>
          <View style={s.levelBarTrack}>
            <View
              style={[
                s.levelBarFill,
                { width: `${progress * 100}%`, backgroundColor: accentColor },
              ]}
            />
          </View>
        </View>

        {/* Quest list */}
        <View style={s.questList}>
          {quests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              accentColor={accentColor}
              onPress={() => {
                if (quest.status === "in_progress") {
                  // Fire-and-forget: sets started_at if not already set
                  doStartQuest(quest.id);
                  router.push({
                    pathname: "/quest/challenge/[challengeId]",
                    params: {
                      challengeId: quest.id,
                      title: quest.title,
                      category: quest.category,
                      subtitle: quest.subtitle,
                      xp: String(quest.xp),
                      color: accentColor,
                      icon: quest.icon,
                      requiredPhotos: String(quest.requiredPhotos),
                      photosTaken: String(quest.photosTaken),
                      tips: JSON.stringify(quest.tips),
                    },
                  });
                }
              }}
            />
          ))}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  centered: { justifyContent: "center", alignItems: "center" },
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
