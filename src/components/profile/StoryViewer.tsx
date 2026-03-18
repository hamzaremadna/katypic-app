import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ViewToken,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@theme/colors";
import { Fonts } from "@theme/typography";
import { Icon } from "@components/ui/Icon";
import { Story } from "@services/api/story.api";

const { width, height } = Dimensions.get("window");

interface Props {
  story: Story | null;
  visible: boolean;
  onClose: () => void;
}

export function StoryViewer({ story, visible, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const photos = story?.photos ?? [];

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const goNext = useCallback(() => {
    const next = currentIndex + 1;
    if (next < photos.length) {
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      onClose();
    }
  }, [currentIndex, photos.length, onClose]);

  const goPrev = useCallback(() => {
    const prev = currentIndex - 1;
    if (prev >= 0) {
      flatListRef.current?.scrollToIndex({ index: prev, animated: true });
    }
  }, [currentIndex]);

  const handleClose = useCallback(() => {
    setCurrentIndex(0);
    onClose();
  }, [onClose]);

  if (!story) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={s.container}>
        <StatusBar hidden />

        {/* Photo pager */}
        <FlatList
          ref={flatListRef}
          data={photos}
          keyExtractor={(p) => p.photoId}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          renderItem={({ item }) => (
            <View style={s.page}>
              <Image
                source={{ uri: item.url }}
                style={s.photo}
                resizeMode="cover"
              />
            </View>
          )}
        />

        {/* Progress bars */}
        <View style={s.progressRow}>
          {photos.map((_, i) => (
            <View key={i} style={[s.progressBar, i < photos.length - 1 && s.progressBarGap]}>
              <View
                style={[
                  s.progressFill,
                  i < currentIndex && s.progressFillDone,
                  i === currentIndex && s.progressFillActive,
                ]}
              />
            </View>
          ))}
        </View>

        {/* Top overlay: title + close button */}
        <View style={s.topOverlay}>
          <Text style={s.storyTitle} numberOfLines={1}>
            {story.title}
          </Text>
          <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
            <Icon name="x" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bottom gradient overlay: photo counter */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)"]}
          style={s.bottomOverlay}
          pointerEvents="none"
        >
          <Text style={s.photoCounter}>
            {currentIndex + 1} / {photos.length}
          </Text>
        </LinearGradient>

        {/* Tap zones: prev (left 30%) and next (right 30%) */}
        <TouchableOpacity
          style={s.tapZoneLeft}
          onPress={goPrev}
          activeOpacity={1}
        />
        <TouchableOpacity
          style={s.tapZoneRight}
          onPress={goNext}
          activeOpacity={1}
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  page: {
    width,
    height,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  progressRow: {
    position: "absolute",
    top: 52,
    left: 12,
    right: 12,
    flexDirection: "row",
    gap: 3,
  },
  progressBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  progressBarGap: {
    marginRight: 0,
  },
  progressFill: {
    height: "100%",
    width: "0%",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 2,
  },
  progressFillDone: {
    width: "100%",
    backgroundColor: "#fff",
  },
  progressFillActive: {
    width: "100%",
    backgroundColor: "#fff",
  },
  topOverlay: {
    position: "absolute",
    top: 62,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  storyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: "#fff",
    flex: 1,
    marginRight: 12,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 36,
  },
  photoCounter: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  tapZoneLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width * 0.3,
    height: "100%",
  },
  tapZoneRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: width * 0.3,
    height: "100%",
  },
});
