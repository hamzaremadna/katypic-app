import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";
import { navigate } from "@/utils/navigation";
import { Colors, Gradients } from "../../theme/colors";
import { KaytiHeader, BottomTabBar, ReviewModal } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";

const { width } = Dimensions.get("window");

// ─── Mock Data ──────────────────────────────────────────
const EVENT_DATA = {
  id: "1",
  title: "Golden hour au parc",
  level: "Débutant",
  levelColor: "#00C851",
  date: "Dim 16 mars 18h30",
  location: "Jardin du Luxembourg",
  participantsCount: 5,
  participantsMax: 10,
  organizer: "Thomas L.",
  rating: 4.7,
  reviewCount: 3,
  isPrivate: false, // toggle to true to see private variant
  description:
    "Rejoignez-nous pour une session photo pendant la golden hour au Jardin du Luxembourg. Nous explorerons les meilleures compositions avec la lumière dorée du coucher de soleil. Apportez votre appareil et votre créativité !",
  participants: [
    {
      id: "1",
      name: "Thomas L.",
      isOrganizer: true,
      bio: "Photographe passionné | Paysages & portraits",
      avatarColor: "#7B2FBE",
    },
    {
      id: "2",
      name: "Marie D.",
      isOrganizer: false,
      bio: "Amateur de street photography",
      avatarColor: "#E91E8C",
    },
    {
      id: "3",
      name: "Lucas B.",
      isOrganizer: false,
      bio: "Débutant enthousiaste",
      avatarColor: "#4A90E2",
    },
    {
      id: "4",
      name: "Sophie T.",
      isOrganizer: false,
      bio: "Photographe nature & macro",
      avatarColor: "#00C851",
    },
    {
      id: "5",
      name: "Antoine R.",
      isOrganizer: false,
      bio: "Portrait et mode",
      avatarColor: "#FF8C00",
    },
  ],
};

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
  participant: (typeof EVENT_DATA.participants)[0];
}) {
  return (
    <View style={s.participantCard}>
      <View style={s.participantLeft}>
        <View
          style={[
            s.participantAvatar,
            { backgroundColor: participant.avatarColor },
          ]}
        >
          <Text style={s.participantAvatarText}>{participant.name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.participantNameRow}>
            <Text style={s.participantName}>{participant.name}</Text>
            {participant.isOrganizer && (
              <View style={s.orgBadge}>
                <Text style={s.orgBadgeText}>ORG</Text>
              </View>
            )}
          </View>
          <Text style={s.participantBio} numberOfLines={1}>
            {participant.bio}
          </Text>
        </View>
      </View>
      {!participant.isOrganizer && (
        <TouchableOpacity
          style={s.messageBtn}
          onPress={() =>
            navigate(
              `/chat/${participant.id}?name=${encodeURIComponent(participant.name)}`
            )
          }
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
        Cet événement est sur invitation uniquement ou requiert une demande de
        participation.
      </Text>
      <TouchableOpacity
        style={s.requestPrivateBtn}
        onPress={onRequest}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#E91E8C", "#7B2FBE"] as [string, string]}
          style={s.requestPrivateBtnGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Icon name="send" size={16} color="#fff" />
          <Text style={s.requestPrivateBtnText}>
            Faire une demande pour participer
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────
export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams();
  const [saved, setSaved] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const event = EVENT_DATA;

  const handleParticipate = () => {
    navigate(
      `/event/request?eventId=${event.id}&title=${encodeURIComponent(event.title)}`
    );
  };

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
        <KaytiHeader showBack title="Détail événement" />

        {/* ── Cover Image ── */}
        <View style={s.coverWrapper}>
          <View style={s.coverImage}>
            <LinearGradient
              colors={["#3D1B69", "#1A1040"]}
              style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
              colors={["transparent", "rgba(10,10,20,0.65)"]}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Private blur overlay */}
            {event.isPrivate && (
              <View style={s.coverPrivateBlur}>
                <Icon name="lock" size={28} color="rgba(255,255,255,0.5)" />
              </View>
            )}

            {/* Level badge + actions */}
            <View style={s.coverOverlay}>
              <View
                style={[
                  s.levelBadge,
                  { borderColor: event.levelColor + "80" },
                ]}
              >
                <Text style={[s.levelBadgeText, { color: event.levelColor }]}>
                  {event.level}
                </Text>
              </View>
              <View style={s.coverActions}>
                <TouchableOpacity style={s.coverActionBtn}>
                  <Icon name="share" size={18} color={Colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.coverActionBtn, saved && s.coverActionBtnActive]}
                  onPress={() => setSaved(!saved)}
                >
                  <Icon
                    name="heart"
                    size={18}
                    color={saved ? "#E91E8C" : Colors.textPrimary}
                  />
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
            <InfoRow icon="calendar" text={event.date} />
            <InfoRow icon="marker-pin" text={event.location} />
            <InfoRow
              icon="users"
              text={`${event.participantsCount}/${event.participantsMax} participants`}
            />
            <InfoRow icon="user" text={`Organisé par ${event.organizer}`} />
            <TouchableOpacity
              style={s.infoRow}
              onPress={() => setReviewVisible(true)}
              activeOpacity={0.7}
            >
              <View style={{ width: 24, alignItems: "center" }}>
                <Icon name="star" size={16} color="#FFD700" />
              </View>
              <Text style={s.infoText}>
                {event.rating} ({event.reviewCount} avis)
              </Text>
              <Text style={s.reviewLink}>Laisser un avis</Text>
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={s.aboutSection}>
            <Text style={s.aboutTitle}>À propos</Text>
            <Text style={s.aboutText}>{event.description}</Text>
          </View>

          {/* Participer button */}
          {!event.isPrivate ? (
            <TouchableOpacity
              style={s.participateBtn}
              onPress={handleParticipate}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#E91E8C", "#7B2FBE"] as [string, string]}
                style={s.participateBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon name="users" size={18} color="#fff" />
                <Text style={s.participateBtnText}>Participer</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={s.participateBtn}
              onPress={handleParticipate}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#E91E8C", "#7B2FBE"] as [string, string]}
                style={s.participateBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon name="send" size={18} color="#fff" />
                <Text style={s.participateBtnText}>
                  Faire une demande pour participer
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Participants section ── */}
        {!event.isPrivate ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Participants ({event.participantsCount})
            </Text>
            <View style={s.participantsList}>
              {event.participants.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                />
              ))}
            </View>
          </View>
        ) : (
          /* Private event participants locked */
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Participants ({event.participantsCount})
            </Text>
            <View style={s.privateParticipants}>
              <LinearGradient
                colors={["rgba(8,8,20,0.0)", "rgba(8,8,20,0.98)"]}
                style={s.privateParticipantsGrad}
              />
              {/* Show first 2 blurred */}
              {event.participants.slice(0, 2).map((p) => (
                <View key={p.id} style={[s.participantCard, { opacity: 0.3 }]}>
                  <View style={s.participantLeft}>
                    <View
                      style={[
                        s.participantAvatar,
                        { backgroundColor: p.avatarColor },
                      ]}
                    >
                      <Text style={s.participantAvatarText}>{p.name[0]}</Text>
                    </View>
                    <View>
                      <Text style={s.participantName}>{p.name}</Text>
                      <Text style={s.participantBio}>{p.bio}</Text>
                    </View>
                  </View>
                </View>
              ))}
              {/* Lock overlay */}
              <PrivateEventOverlay onRequest={handleParticipate} />
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabBar activeRoute="/(tabs)/discover" />

      <ReviewModal
        visible={reviewVisible}
        spotName={event.title}
        onClose={() => setReviewVisible(false)}
        onSubmit={(rating, comment) => {
          setReviewVisible(false);
          Alert.alert("Merci !", `Votre avis (${rating}★) a été envoyé.`);
        }}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 20 },

  // Cover
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
  levelBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  coverActions: {
    flexDirection: "row",
    gap: 10,
  },
  coverActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverActionBtnActive: {
    backgroundColor: "rgba(233,30,140,0.2)",
  },

  // Info Card
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: "500",
    flex: 1,
  },
  reviewLink: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.accentPurple,
  },

  // About
  aboutSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: 8,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Participer button
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
  participateBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },

  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 14,
  },

  // Participants
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
  participantLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  participantAvatarText: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },
  participantNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  participantName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  orgBadge: {
    backgroundColor: "rgba(123,47,190,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(123,47,190,0.5)",
  },
  orgBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.accentPurple,
    letterSpacing: 0.5,
  },
  participantBio: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
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

  // Private participants
  privateParticipants: {
    gap: 10,
    position: "relative",
    minHeight: 160,
  },
  privateParticipantsGrad: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },

  // Private overlay
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
  privateTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
  },
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
  requestPrivateBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
