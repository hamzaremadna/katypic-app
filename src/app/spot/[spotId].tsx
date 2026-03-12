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
  Alert,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";
import { Colors, Gradients } from "../../theme/colors";
import { KaytiHeader, BottomTabBar, GradientButton } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";

const { width } = Dimensions.get("window");
const PHOTO_THUMB_SIZE = (width - 40 - 30) / 4;

// ─── Mock Data ──────────────────────────────────────────
const SPOT_DATA = {
  name: "Pont Alexandre III",
  subtitle: "Architecture Belle Époque",
  rating: 4.3,
  reviewCount: 4,
  category: "architecture",
  description:
    "Un des plus beaux ponts de Paris, idéal pour la photographie avec ses lampadaires dorés et sa vue imprenable sur les Invalides et le Grand Palais.",
  photos: [
    { id: "1", uri: "" },
    { id: "2", uri: "" },
    { id: "3", uri: "" },
    { id: "4", uri: "" },
  ],
  reviews: [
    {
      id: "1",
      name: "Marie D.",
      date: "il y a 3 jours",
      rating: 5,
      text: "Endroit magnifique pour des photos au coucher du soleil. Les lampadaires dorés créent une lumière incroyable.",
      helpful: 12,
      avatarColor: "#E91E8C",
    },
    {
      id: "2",
      name: "Lucas B.",
      date: "il y a 1 semaine",
      rating: 4,
      text: "Très beau spot mais souvent bondé. Préférez tôt le matin pour éviter la foule.",
      helpful: 8,
      avatarColor: "#7B2FBE",
    },
    {
      id: "3",
      name: "Sophie T.",
      date: "il y a 2 semaines",
      rating: 4,
      text: "Parfait pour les portraits avec le fond des Invalides. La lumière dorée en fin de journée est sublime.",
      helpful: 5,
      avatarColor: "#4A90E2",
    },
  ],
  ratingBreakdown: {
    5: 0.5,
    4: 0.35,
    3: 0.1,
    2: 0.05,
    1: 0,
  },
};

// ─── Star Rating Component ──────────────────────────────
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Icon
        key={i}
        name="star"
        size={size}
        color={i <= Math.round(rating) ? "#FFD700" : Colors.textMuted}
      />
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
          style={[s.ratingBarFill, { width: `${percentage * 100}%` }]}
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
}: {
  review: (typeof SPOT_DATA.reviews)[0];
}) {
  const [isHelpful, setIsHelpful] = useState(false);

  return (
    <View style={s.reviewCard}>
      <View style={s.reviewHeader}>
        <View
          style={[s.reviewAvatar, { backgroundColor: review.avatarColor }]}
        >
          <Text style={s.reviewAvatarText}>{review.name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.reviewName}>{review.name}</Text>
          <Text style={s.reviewDate}>{review.date}</Text>
        </View>
        <StarRating rating={review.rating} size={12} />
      </View>
      <Text style={s.reviewText}>{review.text}</Text>
      <TouchableOpacity
        style={[s.helpfulBtn, isHelpful && s.helpfulBtnActive]}
        onPress={() => setIsHelpful(!isHelpful)}
      >
        <Text style={[s.helpfulText, isHelpful && s.helpfulTextActive]}>
          👍 Utile ({isHelpful ? review.helpful + 1 : review.helpful})
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────
export default function SpotDetailScreen() {
  const { spotId } = useLocalSearchParams();
  const spot = SPOT_DATA;
  const [saved, setSaved] = useState(false);

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
            <LinearGradient
              colors={["#2D1B69", "#1A1A2E"]}
              style={StyleSheet.absoluteFillObject}
            />
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
                  onPress={() => setSaved((prev) => !prev)}
                >
                  <Icon
                    name="heart"
                    size={18}
                    color={saved ? "#FF2D55" : Colors.textPrimary}
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
          <View style={s.spotLocationRow}>
            <Icon name="marker-pin" size={14} color={Colors.textSecondary} />
            <Text style={s.spotLocation}>{spot.subtitle}</Text>
          </View>
          <View style={s.ratingRow}>
            <StarRating rating={spot.rating} size={16} />
            <Text style={s.ratingText}>
              {spot.rating} ({spot.reviewCount} avis)
            </Text>
            <View style={s.categoryTag}>
              <Text style={s.categoryTagText}>{spot.category}</Text>
            </View>
          </View>
          <GradientButton
            label="Y aller"
            onPress={() =>
              Linking.openURL(
                `https://maps.google.com/maps?q=${spot.name.replace(/ /g, "+")}+Paris`
              )
            }
            arrow
            style={{ marginTop: 12 }}
          />
        </View>

        {/* Photos du spot */}
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
            {spot.photos.map((photo) => (
              <TouchableOpacity key={photo.id} style={s.photoThumb}>
                <LinearGradient
                  colors={["#2D1B69", "#1A1A2E"]}
                  style={StyleSheet.absoluteFillObject}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Avis section */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>
              Avis ({spot.reviewCount})
            </Text>
            <TouchableOpacity
              style={s.reviewBtn}
              onPress={() =>
                Alert.alert(
                  "Bientôt disponible",
                  "La publication d'avis sera disponible prochainement."
                )
              }
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
          <View style={s.breakdownCard}>
            <View style={s.breakdownLeft}>
              <Text style={s.breakdownBigNumber}>{spot.rating}</Text>
              <StarRating rating={spot.rating} size={18} />
              <Text style={s.breakdownCount}>
                {spot.reviewCount} avis
              </Text>
            </View>
            <View style={s.breakdownRight}>
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingBar
                  key={star}
                  stars={star}
                  percentage={
                    spot.ratingBreakdown[
                      star as keyof typeof spot.ratingBreakdown
                    ]
                  }
                />
              ))}
            </View>
          </View>

          {/* Review cards */}
          {spot.reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </View>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabBar activeRoute="/(tabs)/discover" />
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
  coverActionIcon: {
    color: Colors.textPrimary,
    fontSize: 18,
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
  locationIcon: { fontSize: 14 },
  spotLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
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
  ratingBarStar: {
    fontSize: 10,
    color: "#FFD700",
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
  helpfulBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  helpfulBtnActive: {
    backgroundColor: "rgba(123,47,190,0.2)",
    borderColor: "rgba(123,47,190,0.5)",
  },
  helpfulText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  helpfulTextActive: {
    color: Colors.accentPurple,
  },
});
