import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "@components/ui/Icon";
import { Colors, Gradients } from "@theme/colors";
import { Fonts } from "@theme/typography";
import type { ChatMessage } from "@services/api/ai.api";

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

// ── Animated typing indicator (3 bouncing dots) ──────────────────────────────
function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Each dot has the same 1500ms cycle but starts at a different offset,
    // producing a staggered wave effect.
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -6,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.delay(1000 - delay), // pad to keep cycle = 1560ms
        ])
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 200);
    const a3 = animate(dot3, 400);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  return (
    <View style={td.row}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[td.dot, { transform: [{ translateY: dot }] }]}
        />
      ))}
    </View>
  );
}

const td = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary,
  },
});

// ── Chat bubble list ─────────────────────────────────────────────────────────
export function ChatBubbleList({
  messages,
  isLoading,
}: {
  messages: ChatMessage[];
  isLoading: boolean;
}) {
  return (
    <>
      {messages.map((message) => {
        const isUser = message.role === "USER";
        return (
          <View
            key={message.id}
            style={[s.messageRow, isUser ? s.messageRowUser : s.messageRowAI]}
          >
            {!isUser && (
              <View style={s.aiAvatar}>
                <LinearGradient
                  colors={Gradients.purpleBlue}
                  style={s.aiAvatarGradient}
                >
                  <Icon name="sparkles" size={14} color="#FFFFFF" />
                </LinearGradient>
              </View>
            )}
            <View
              style={[
                s.messageBubbleWrapper,
                isUser ? s.messageBubbleWrapperUser : s.messageBubbleWrapperAI,
              ]}
            >
              {isUser ? (
                <LinearGradient
                  colors={["#5B2FBE", "#3B1F9E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.messageBubbleUser}
                >
                  <Text style={s.messageText}>{message.content}</Text>
                  <Text style={s.messageTimestamp}>
                    {formatTime(message.createdAt)}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={s.messageBubbleAI}>
                  <Text style={s.messageText}>{message.content}</Text>
                  <Text style={s.messageTimestamp}>
                    {formatTime(message.createdAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}

      {/* Typing indicator while waiting for AI response */}
      {isLoading && (
        <View style={[s.messageRow, s.messageRowAI]}>
          <View style={s.aiAvatar}>
            <LinearGradient
              colors={Gradients.purpleBlue}
              style={s.aiAvatarGradient}
            >
              <Icon name="sparkles" size={14} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <View style={s.messageBubbleAI}>
            <TypingDots />
          </View>
        </View>
      )}
    </>
  );
}

const s = StyleSheet.create({
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAI: {
    justifyContent: "flex-start",
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 2,
  },
  aiAvatarGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  messageBubbleWrapper: {
    maxWidth: "78%",
  },
  messageBubbleWrapperUser: {
    alignItems: "flex-end",
  },
  messageBubbleWrapperAI: {
    alignItems: "flex-start",
  },
  messageBubbleUser: {
    borderRadius: 18,
    borderBottomRightRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  messageBubbleAI: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  messageText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  messageTimestamp: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    marginTop: 6,
    alignSelf: "flex-end",
  },
});
