import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Share,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";
import { Colors, Gradients } from "../../theme/colors";
import { KaytiHeader, GradientButton } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";
import { useSpot, useSpotReviews, useToggleFavorite, useAddSpotReview } from "@/hooks/useSpots";
import type { SpotReview } from "@/services/api/spot.api";

const { width } = Dimensions.get("window");
const PHOTO_THUMB_SIZE = (width - 40 - 30) / 4;

const AVATAR_COLORS = ["#E91E8C", "#7B2FBE", "#4A90E2", "#27AE60", "#FF8C00", "#E74C3C"];

function formatTimeAgo(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return "il y a 1 jour";
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  if (diffDays < 14) return "il y a 1 semaine";
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} semaines`;
  if (diffDays < 60) return "il y a 1 mois";
  return `il y a ${Math.floor(diffDays / 30)} mois`;
}

// ─── Star Rating Component ──────────────────────────────
function StarRating({
  rating,
  size = 14,
  interactive = false,
  onSelect,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onSelect?: (star: number) => void;
}) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <TouchableOpacity
        key={i}
        onPress={interactive && onSelect ? () => onSelect(i) : undefined}
        disabled={!interactive}
        activeOpacity={interactive ? 0.7 : 1}
      >
        <Icon
          name="star"
          size={size}
          color={i <= Math.round(rating) ? "#FFD700" : Colors.textMuted}
        />
      </TouchableOpacity>
    );
  }
  return <View style={{ flexDirection: "row", gap: 2 }}>{stars}</View>;
}

// ─── Rating Bar Component ───────────────────────────────
function RatingBar({ stars, percentage }: { stars: number; percentage: number }) {
  return (
    <View style={s.ratingBarRow}>
      <Text style={s.ratingBarLabel}>{stars}</Text>
      <Icon name="star" size={10} color="#FFD700" />
      <View style={s.ratingBarTrack}>
        <LinearGradient
          colors={stars >= 4 ? ["#FFD700", "#FFA500"] : ["#FFA500", "#FF8C00"]}
          style={[s.ratingBarFill, { width: `${Math.min(percentage * 100, 100)}%` as `${number}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
    </View>
  );
}

// ─── Review Card Component ──────────────────────────────
function ReviewCard({
  review,
  index,
}: {
  review: SpotReview;
  index: number;
}) {
  const displayName = review.user.profile?.displayName ?? review.user.username;
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <View style={s.reviewCard}>
      <View style={s.reviewHeader}>
        {review.user.profile?.avatarUrl ? (
          <Image
            source={{ uri: review.user.profile.avatarUrl }}
            style={s.reviewAvatar}
          />
        ) : (
          <View style={[s.reviewAvatar, { backgroundColor: avatarColor }]}>
            <Text style={s.reviewAvatarText}>
              {displayName[0].toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.reviewName}>{displayName}</Text>
          <Text style={s.reviewDate}>{formatTimeAgo(review.createdAt)}</Text>
        </View>
        <StarRating rating={review.rating} size={12} />
      </View>
      {review.comment ? (
        <Text style={s.reviewText}>{review.comment}</Text>
      ) : null}
    </View>
  );
}

// ─── Review Modal ───────────────────────────────────────
function ReviewModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => void;
  isSubmitting: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const canSubmit = rating > 0 && !isSubmitting;

  const handleClose = () => {
    setRating(0);
    setComment("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={s.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={handleClose} activeOpacity={1} />
        <View style={s.modalSheet}>
          <LinearGradient
            colors={["#1A1040", "#0E0A24"]}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Handle */}
          <View style={s.modalHandle} />

          <Text style={s.modalTitle}>Donner mon avis</Text>
          <Text style={s.modalSubtitle}>Comment évaluez-vous ce spot ?</Text>

          {/* Star selector */}
          <View style={s.modalStarRow}>
            <StarRating rating={rating} size={36} interactive onSelect={setRating} />
          </View>
          {rating > 0 && (
            <Text style={s.modalRatingLabel}>
              {["", "Mauvais", "Décevant", "Correct", "Bien", "Excellent !"][rating]}
            </Text>
          )}

          {/* Comment */}
          <View style={s.modalTextAreaWrapper}>
            <TextInput
              style={s.modalTextArea}
              value={comment}
              onChangeText={(t) => t.length <= 300 && setComment(t)}
              placeholder="Partagez votre expérience (facultatif)..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
            <Text style={s.charCounter}>{comment.length}/300</Text>
          </View>

          {/* Buttons */}
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={handleClose} disabled={isSubmitting}>
              <Text style={s.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalSubmitBtn, !canSubmit && s.modalSubmitDisabled]}
              onPress={canSubmit ? () => onSubmit(rating, comment || undefined) : undefined}
              activeOpacity={canSubmit ? 0.85 : 1}
            >
              <LinearGradient
                colors={canSubmit ? (["#E91E8C", "#7B2FBE"] as [string, string]) : (["#333", "#333"] as [string, string])}
                style={s.modalSubmitGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.modalSubmitText}>Publier l'avis</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ────────────────────────────────────────
export default function SpotDetailScreen() {
  const { spotId } = useLocalSearchParams<{ spotId: string }>();
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const { data: spot, isLoading: spotLoading } = useSpot(spotId ?? "");
  const { data: reviewsData, isLoading: reviewsLoading } = useSpotReviews(spotId ?? "");
  const toggleFavorite = useToggleFavorite();
  const addReview = useAddSpotReview();

  const isFavorited = spot?.isFavorited ?? false;

  const handleToggleFavorite = () => {
    if (!spotId) return;
    toggleFavorite.mutate(spotId);
  };

  const handleAddReview = async (rating: number, comment?: string) => {
    if (!spotId) return;
    try {
      await addReview.mutateAsync({ spotId, rating, comment });
      setReviewModalVisible(false);
    } catch {
      Alert.alert("Erreur", "Impossible de publier votre avis. Réessayez.");
    }
  };

  const handleGoThere = () => {
    if (!spot) return;
    const url = Platform.OS === "ios"
      ? `maps://?q=${spot.latitude},${spot.longitude}`
      : `geo:${spot.latitude},${spot.longitude}?q=${spot.latitude},${spot.longitude}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(
        `https://maps.google.com/maps?q=${spot.latitude},${spot.longitude}`
      );
    });
  };

  if (spotLoading) {
    return (
      <View style={[s.container, s.centered]}>
        <StatusBar style="light" />
        <LinearGradient colors={["#0E0A24", "#080814"]} style={StyleSheet.absoluteFillObject} />
        <KaytiHeader showBack title="Détail spot" />
        <ActivityIndicator size="large" color={Colors.accentPurple} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (!spot) {
    return (
      <View style={[s.container, s.centered]}>
        <StatusBar style="light" />
        <LinearGradient colors={["#0E0A24", "#080814"]} style={StyleSheet.absoluteFillObject} />
        <KaytiHeader showBack title="Détail spot" />
        <Text style={s.emptyText}>Spot introuvable.</Text>
      </View>
    );
  }

  const stats = reviewsData?.stats;
  const reviews = reviewsData?.reviews ?? [];
  const avgRating = stats?.average ?? spot.averageRating ?? 0;
  const totalReviews = stats?.total ?? 0;
  const histogram = stats?.histogram ?? {};

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
        <KaytiHeader showBack title="Détail spot" />

        {/* Cover Image */}
        <View style={s.coverWrapper}>
          <View style={s.coverImage}>
            {spot.thumbnailUrl ? (
              <Image
                source={{ uri: spot.thumbnailUrl }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={["#2D1B69", "#1A1A2E"]}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <LinearGradient
              colors={["transparent", "rgba(10,10,20,0.6)"]}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Overlay buttons */}
            <View style={s.coverOverlay}>
              <View style={{ flex: 1 }} />
              <View style={s.coverActions}>
                <TouchableOpacity
                  style={s.coverActionBtn}
                  onPress={() =>
                    Share.share({ message: `${spot.name} — découvert sur KaytiPic !` })
                  }
                >
                  <Icon name="share" size={18} color={Colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.coverActionBtn}
                  onPress={handleToggleFavorite}
                  disabled={toggleFavorite.isPending}
                >
                  <Icon
                    name="heart"
                    size={18}
                    color={isFavorited ? "#FF2D55" : Colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={s.infoCard}>
          <LinearGradient
            colors={["#2D1B69", "#1A1040"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={s.spotName}>{spot.name}</Text>
          {spot.address ? (
            <View style={s.spotLocationRow}>
              <Icon name="marker-pin" size={14} color={Colors.textSecondary} />
              <Text style={s.spotLocation}>{spot.address}</Text>
            </View>
          ) : null}
          <View style={s.ratingRow}>
            <StarRating rating={avgRating} size={16} />
            <Text style={s.ratingText}>
              {avgRating > 0 ? avgRating.toFixed(1) : "—"} ({totalReviews} avis)
            </Text>
            <View style={s.categoryTag}>
              <Text style={s.categoryTagText}>{spot.category}</Text>
            </View>
          </View>
          <GradientButton
            label="Y aller"
            onPress={handleGoThere}
            arrow
            style={{ marginTop: 12 }}
          />
        </View>

        {/* Photos du spot */}
        {spot.photos && spot.photos.length > 0 ? (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Photos du spot</Text>
              <TouchableOpacity>
                <Text style={s.sectionLink}>
                  Voir tout ({spot.photos.length})
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.photosRow}
            >
              {spot.photos.map((item) => (
                <TouchableOpacity key={item.id} style={s.photoThumb}>
                  {item.photo.thumbnailUrl || item.photo.url ? (
                    <Image
                      source={{ uri: item.photo.thumbnailUrl ?? item.photo.url }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={["#2D1B69", "#1A1A2E"]}
                      style={StyleSheet.absoluteFillObject}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Avis section */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>
              Avis ({totalReviews})
            </Text>
            <TouchableOpacity
              style={s.reviewBtn}
              onPress={() => setReviewModalVisible(true)}
            >
              <LinearGradient
                colors={Gradients.brand}
                style={s.reviewBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={s.reviewBtnText}>Donner mon avis</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Rating breakdown card */}
          {totalReviews > 0 ? (
            <View style={s.breakdownCard}>
              <View style={s.breakdownLeft}>
                <Text style={s.breakdownBigNumber}>
                  {avgRating.toFixed(1)}
                </Text>
                <StarRating rating={avgRating} size={18} />
                <Text style={s.breakdownCount}>{totalReviews} avis</Text>
              </View>
              <View style={s.breakdownRight}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <RatingBar
                    key={star}
                    stars={star}
                    percentage={
                      totalReviews > 0
                        ? (histogram[star] ?? 0) / totalReviews
                        : 0
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* Review cards */}
          {reviewsLoading ? (
            <ActivityIndicator color={Colors.accentPurple} style={{ marginTop: 16 }} />
          ) : reviews.length === 0 ? (
            <View style={s.emptyReviews}>
              <Icon name="star" size={32} color={Colors.textMuted} />
              <Text style={s.emptyReviewsText}>
                Aucun avis pour le moment. Soyez le premier !
              </Text>
            </View>
          ) : (
            reviews.map((review, idx) => (
              <ReviewCard key={review.id} review={review} index={idx} />
            ))
          )}
        </View>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Review Modal */}
      <ReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        onSubmit={handleAddReview}
        isSubmitting={addReview.isPending}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  centered: { alignItems: "center" },
  scroll: { paddingBottom: 20 },

  emptyText: {
    marginTop: 40,
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: "center",
  },

  // Cover
  coverWrapper: { paddingHorizontal: 20, marginTop: 8 },
  coverImage: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: "space-between",
  },
  coverActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
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
  spotName: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  spotLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  spotLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  ratingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  categoryTag: {
    backgroundColor: "rgba(123,47,190,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(123,47,190,0.5)",
  },
  categoryTagText: {
    fontSize: 12,
    color: Colors.accentPurple,
    fontWeight: "600",
  },

  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  sectionLink: {
    fontSize: 14,
    color: Colors.accentPink,
    fontWeight: "600",
  },

  // Photo thumbnails
  photosRow: { gap: 10 },
  photoThumb: {
    width: PHOTO_THUMB_SIZE,
    height: PHOTO_THUMB_SIZE,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: Colors.bgCard,
  },

  // Review button
  reviewBtn: {
    borderRadius: 20,
    overflow: "hidden",
  },
  reviewBtnGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  reviewBtnText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "700",
  },

  // Rating breakdown
  breakdownCard: {
    flexDirection: "row",
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
    gap: 20,
  },
  breakdownLeft: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minWidth: 70,
  },
  breakdownBigNumber: {
    fontSize: 40,
    fontWeight: "900",
    color: Colors.textPrimary,
  },
  breakdownCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  breakdownRight: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },

  // Rating bars
  ratingBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingBarLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
    width: 10,
    textAlign: "right",
  },
  ratingBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  ratingBarFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Review cards
  reviewCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  reviewName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  reviewText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Empty reviews
  emptyReviews: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyReviewsText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },

  // ── Review Modal ─────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    paddingTop: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  modalStarRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
    gap: 8,
  },
  modalRatingLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 20,
  },
  modalTextAreaWrapper: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    gap: 8,
    marginBottom: 20,
  },
  modalTextArea: {
    fontSize: 15,
    color: Colors.textPrimary,
    minHeight: 90,
    textAlignVertical: "top",
  },
  charCounter: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "right",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  modalSubmitBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: "hidden",
  },
  modalSubmitDisabled: { opacity: 0.4 },
  modalSubmitGrad: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
