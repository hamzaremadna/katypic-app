import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";
import { navigate } from "@/utils/navigation";
import { Colors, Gradients } from "../../theme/colors";
import { KaytiHeader, ReviewModal } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";
import { useEvent, useJoinEvent, useLeaveEvent } from "@/hooks/useEvents";
import { EVENT_LEVEL_LABELS, EventLevel } from "@/services/api/event.api";
import { useAuthStore } from "@/stores/authStore";

const LEVEL_COLORS: Record<EventLevel, string> = {
  BEGINNER: "#00C851",
  ALL_LEVELS: "#4A90E2",
  INTERMEDIATE: "#FF8C00",
  ADVANCED: "#E91E8C",
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─── Info Row ────────────────────────────────────────────
function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={s.infoRow}>
      <View style={{ width: 24, alignItems: "center" }}>
        <Icon name={icon as any} size={16} color={Colors.textSecondary} />
      </View>
      <Text style={s.infoText}>{text}</Text>
    </View>
  );
}

// ─── Participant Card ────────────────────────────────────
function ParticipantCard({
  participant,
}: {
  participant: { id: string; role: string; user: { id: string; username: string } };
}) {
  const isOrganizer = participant.role === "ORGANIZER";
  const name = participant.user.username;
  const avatarColors = ["#3D1B69", "#1A1040"] as [string, string];

  return (
    <View style={s.participantCard}>
      <View style={s.participantLeft}>
        <LinearGradient colors={avatarColors} style={s.participantAvatar}>
          <Text style={s.participantAvatarText}>{name[0].toUpperCase()}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <View style={s.participantNameRow}>
            <Text style={s.participantName}>{name}</Text>
            {isOrganizer && (
              <View style={s.orgBadge}>
                <Text style={s.orgBadgeText}>ORG</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      {!isOrganizer && (
        <TouchableOpacity
          style={s.messageBtn}
          onPress={() => navigate(`/chat/${participant.user.id}?name=${encodeURIComponent(name)}`)}
        >
          <Icon name="message-circle" size={16} color={Colors.textPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Private Event Overlay ───────────────────────────────
function PrivateEventOverlay({ onRequest }: { onRequest: () => void }) {
  return (
    <View style={s.privateOverlay}>
      <LinearGradient
        colors={["rgba(8,8,20,0.92)", "rgba(8,8,20,0.98)"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={s.lockIconWrap}>
        <LinearGradient
          colors={["rgba(93,36,167,0.3)", "rgba(50,20,100,0.5)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <Icon name="lock" size={32} color={Colors.accentPurple} />
      </View>
      <Text style={s.privateTitle}>Événement privé</Text>
      <Text style={s.privateSub}>
        Cet événement est sur invitation uniquement ou requiert une demande de participation.
      </Text>
      <TouchableOpacity style={s.requestPrivateBtn} onPress={onRequest} activeOpacity={0.85}>
        <LinearGradient
          colors={["#E91E8C", "#7B2FBE"] as [string, string]}
          style={s.requestPrivateBtnGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Icon name="send" size={16} color="#fff" />
          <Text style={s.requestPrivateBtnText}>Faire une demande pour participer</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────
export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [saved, setSaved] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);

  const { data: event, isLoading } = useEvent(eventId ?? "");
  const joinEvent = useJoinEvent();
  const leaveEvent = useLeaveEvent();
  const { user } = useAuthStore();

  if (isLoading || !event) {
    return (
      <View style={[s.container, { alignItems: "center", justifyContent: "center" }]}>
        <StatusBar style="light" />
        <LinearGradient colors={["#0E0A24", "#080814"]} style={StyleSheet.absoluteFillObject} />
        <KaytiHeader showBack title="Détail événement" />
        <ActivityIndicator color={Colors.accentPurple} size="large" />
      </View>
    );
  }

  const levelLabel = EVENT_LEVEL_LABELS[event.level] ?? "Tous niveaux";
  const levelColor = LEVEL_COLORS[event.level] ?? "#4A90E2";
  const memberCount = event._count?.members ?? event.members?.length ?? 0;
  const isPrivate = !event.isPublic;
  const isPast = event.status === "COMPLETED" || new Date(event.endsAt) < new Date();

  const myMembership = event.members?.find((m) => m.user.id === user?.id);
  const isMember = !!myMembership;
  const isOrganizer = myMembership?.role === "ORGANIZER";

  const handleJoin = async () => {
    try {
      await joinEvent.mutateAsync(event.id);
    } catch {
      Alert.alert("Erreur", "Impossible de rejoindre l'événement.");
    }
  };

  const handleLeave = () => {
    Alert.alert("Quitter l'événement", "Êtes-vous sûr ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Quitter",
        style: "destructive",
        onPress: async () => {
          try {
            await leaveEvent.mutateAsync(event.id);
          } catch {
            Alert.alert("Erreur", "Impossible de quitter l'événement.");
          }
        },
      },
    ]);
  };

  const handleRequest = () => {
    navigate(`/event/request?eventId=${event.id}&title=${encodeURIComponent(event.title)}&isPrivate=true`);
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0E0A24", "#080814"]} style={StyleSheet.absoluteFillObject} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <KaytiHeader showBack title="Détail événement" />

        {/* ── Cover Image ── */}
        <View style={s.coverWrapper}>
          <View style={s.coverImage}>
            <LinearGradient colors={["#3D1B69", "#1A1040"]} style={StyleSheet.absoluteFillObject} />
            <LinearGradient
              colors={["transparent", "rgba(10,10,20,0.65)"]}
              style={StyleSheet.absoluteFillObject}
            />
            {isPrivate && (
              <View style={s.coverPrivateBlur}>
                <Icon name="lock" size={28} color="rgba(255,255,255,0.5)" />
              </View>
            )}
            <View style={s.coverOverlay}>
              <View style={[s.levelBadge, { borderColor: levelColor + "80" }]}>
                <Text style={[s.levelBadgeText, { color: levelColor }]}>{levelLabel}</Text>
              </View>
              <View style={s.coverActions}>
                <TouchableOpacity
                  style={s.coverActionBtn}
                  onPress={() => Share.share({ message: `${event.title} — événement sur KaytiPic` })}
                >
                  <Icon name="share" size={18} color={Colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.coverActionBtn, saved && s.coverActionBtnActive]}
                  onPress={() => setSaved(!saved)}
                >
                  <Icon name="heart" size={18} color={saved ? "#E91E8C" : Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ── Event Info Card ── */}
        <View style={s.infoCard}>
          <LinearGradient
            colors={["#1E1560", "#1A1040"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={s.eventTitle}>{event.title}</Text>

          <View style={s.infoRows}>
            <InfoRow icon="calendar" text={formatDate(event.startsAt)} />
            {event.address ? <InfoRow icon="marker-pin" text={event.address} /> : null}
            <InfoRow
              icon="users"
              text={`${memberCount}${event.maxParticipants ? `/${event.maxParticipants}` : ""} participants`}
            />
            <InfoRow icon="user" text={`Organisé par ${event.createdBy.username}`} />
          </View>

          {event.description ? (
            <View style={s.aboutSection}>
              <Text style={s.aboutTitle}>À propos</Text>
              <Text style={s.aboutText}>{event.description}</Text>
            </View>
          ) : null}

          {/* Action button */}
          {isPast ? (
            <TouchableOpacity
              style={s.participateBtn}
              onPress={() => setReviewVisible(true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#7B2FBE", "#4A1B8E"] as [string, string]}
                style={s.participateBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon name="star" size={18} color="#fff" />
                <Text style={s.participateBtnText}>Laisser un avis</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : isOrganizer ? null : isMember ? (
            <TouchableOpacity style={s.leaveBtn} onPress={handleLeave} activeOpacity={0.85}>
              <Text style={s.leaveBtnText}>Quitter l'événement</Text>
            </TouchableOpacity>
          ) : isPrivate ? (
            <TouchableOpacity style={s.participateBtn} onPress={handleRequest} activeOpacity={0.85}>
              <LinearGradient
                colors={["#E91E8C", "#7B2FBE"] as [string, string]}
                style={s.participateBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon name="send" size={18} color="#fff" />
                <Text style={s.participateBtnText}>Faire une demande pour participer</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={s.participateBtn}
              onPress={handleJoin}
              disabled={joinEvent.isPending}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#E91E8C", "#7B2FBE"] as [string, string]}
                style={s.participateBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {joinEvent.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="users" size={18} color="#fff" />
                    <Text style={s.participateBtnText}>Participer</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Participants section ── */}
        {event.members && event.members.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Participants ({memberCount})</Text>
            {!isPrivate || isMember ? (
              <View style={s.participantsList}>
                {event.members.map((m) => (
                  <ParticipantCard key={m.id} participant={m} />
                ))}
              </View>
            ) : (
              <View style={s.privateParticipants}>
                <LinearGradient
                  colors={["rgba(8,8,20,0.0)", "rgba(8,8,20,0.98)"]}
                  style={s.privateParticipantsGrad}
                />
                {event.members.slice(0, 2).map((m) => (
                  <View key={m.id} style={[s.participantCard, { opacity: 0.3 }]}>
                    <View style={s.participantLeft}>
                      <LinearGradient colors={["#3D1B69", "#1A1040"]} style={s.participantAvatar}>
                        <Text style={s.participantAvatarText}>
                          {m.user.username[0].toUpperCase()}
                        </Text>
                      </LinearGradient>
                      <Text style={s.participantName}>{m.user.username}</Text>
                    </View>
                  </View>
                ))}
                <PrivateEventOverlay onRequest={handleRequest} />
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <ReviewModal
        visible={reviewVisible}
        spotName={event.title}
        onClose={() => setReviewVisible(false)}
        onSubmit={(_rating, _comment) => {
          setReviewVisible(false);
          Alert.alert("Merci !", "Votre avis a été enregistré.");
        }}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20 },

  coverWrapper: { paddingHorizontal: 20, marginTop: 8 },
  coverImage: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  coverPrivateBlur: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8,8,20,0.5)",
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
  },
  levelBadgeText: { fontSize: 12, fontWeight: "800" },
  coverActions: { flexDirection: "row", gap: 10 },
  coverActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverActionBtnActive: { backgroundColor: "rgba(233,30,140,0.2)" },

  infoCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  infoRows: { gap: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoText: { fontSize: 15, color: Colors.textSecondary, fontWeight: "500", flex: 1 },

  aboutSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: 8,
  },
  aboutTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  aboutText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  participateBtn: {
    marginTop: 20,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#E91E8C",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  participateBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  participateBtnText: { fontSize: 16, fontWeight: "700", color: "#fff", letterSpacing: 0.3 },
  leaveBtn: {
    marginTop: 20,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  leaveBtnText: { fontSize: 15, fontWeight: "600", color: Colors.textMuted },

  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary, marginBottom: 14 },

  participantsList: { gap: 10 },
  participantCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  participantLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  participantAvatarText: { color: Colors.textPrimary, fontSize: 17, fontWeight: "800" },
  participantNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  participantName: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  orgBadge: {
    backgroundColor: "rgba(123,47,190,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(123,47,190,0.5)",
  },
  orgBadgeText: { fontSize: 10, fontWeight: "800", color: Colors.accentPurple, letterSpacing: 0.5 },
  messageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  privateParticipants: { gap: 10, position: "relative", minHeight: 160 },
  privateParticipantsGrad: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },

  privateOverlay: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(93,36,167,0.25)",
    gap: 12,
    marginTop: 4,
  },
  lockIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(93,36,167,0.35)",
    marginBottom: 4,
  },
  privateTitle: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary, textAlign: "center" },
  privateSub: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 280,
  },
  requestPrivateBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
    alignSelf: "stretch",
    shadowColor: "#E91E8C",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  requestPrivateBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  requestPrivateBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
