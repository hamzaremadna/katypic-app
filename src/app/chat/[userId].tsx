import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { navigate } from "@/utils/navigation";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors, Gradients } from "../../theme/colors";
import { BottomTabBar } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";
import { messageApi, DirectMessage } from "../../services/api/message.api";
import { useAuthStore } from "../../stores/authStore";

// Only call the real API if the ID is a proper UUID (not a mock numeric ID)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isRealId(id: string) { return UUID_REGEX.test(id); }
const extractMessageKey = (item: DirectMessage) => item.id;

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({
  message,
  myId,
}: {
  message: DirectMessage;
  myId?: string;
}) {
  const isMe = myId ? message.sender_id === myId : false;
  return (
    <View style={[s.bubbleRow, isMe && s.bubbleRowMe]}>
      <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleOther]}>
        {isMe ? (
          <LinearGradient
            colors={["#3D2E9E", "#5B3EC4"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        ) : null}
        <Text style={s.bubbleText}>{message.content}</Text>
      </View>
      <Text style={[s.time, isMe && s.timeMe]}>
        {formatTime(message.created_at)}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const myId = useAuthStore((s) => s.user?.id);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Only query the real API when the userId is a valid UUID
  const realConversation = isRealId(userId ?? "");

  const { data, isLoading } = useQuery({
    queryKey: ["messages", userId],
    queryFn: () => messageApi.getMessages(userId).then((r) => r.data),
    enabled: !!userId && realConversation,
    refetchInterval: realConversation ? 5000 : false,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => {
      if (!realConversation) {
        return Promise.reject(new Error("Cannot message a non-existent user"));
      }
      return messageApi.sendMessage(userId, content).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", userId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const messages = data?.messages ?? [];
  const partnerName = data?.partner?.username ?? name ?? "Conversation";

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMutation.mutate(text);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
  }, [messages.length]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={["#0E0A24", "#080814"]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Header */}
        <View style={s.header}>
          <LinearGradient
            colors={Gradients.brand}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <View style={s.headerAvatar}>
              <LinearGradient
                colors={["#4D2090", "#2D1060"]}
                style={{ flex: 1 }}
              />
            </View>
            <Text style={s.headerName}>{partnerName}</Text>
          </View>
          <TouchableOpacity
            style={s.settingsBtn}
            onPress={() => navigate("/(tabs)/settings")}
          >
            <Icon name="settings" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {isLoading && realConversation ? (
          <View style={s.loadingWrapper}>
            <ActivityIndicator color={Colors.accentPurple} />
          </View>
        ) : messages.length === 0 ? (
          <View style={s.emptyWrapper}>
            <Icon name="message-chat" size={40} color={Colors.textMuted} />
            <Text style={s.emptyTitle}>Aucun message</Text>
            <Text style={s.emptySubtitle}>Commencez la conversation !</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={extractMessageKey}
            renderItem={({ item }) => (
              <MessageBubble message={item} myId={myId} />
            )}
            contentContainerStyle={s.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            maxToRenderPerBatch={20}
            windowSize={7}
            removeClippedSubviews={Platform.OS === "android"}
          />
        )}

        {/* Input bar */}
        <View style={s.inputBar}>
          <TouchableOpacity
            style={s.inputIcon}
            onPress={() => navigate("/analyse/import")}
          >
            <LinearGradient colors={Gradients.brand} style={s.inputIconGrad}>
              <Icon name="camera" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.inputIconPlain}
            onPress={() =>
              Alert.alert(
                "Bientôt disponible",
                "L'envoi d'images dans le chat sera disponible prochainement."
              )
            }
          >
            <Icon name="image" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={s.textInputWrap}>
            <TextInput
              style={s.textInput}
              placeholder="Message..."
              placeholderTextColor={Colors.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
          </View>
          <TouchableOpacity onPress={handleSend} style={s.sendBtn}>
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.accentPink} />
            ) : (
              <Icon name="send" size={20} color={Colors.accentPink} />
            )}
          </TouchableOpacity>
        </View>

        <BottomTabBar activeRoute="/(tabs)/profile" />
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: 14,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, overflow: "hidden" },
  headerName: { fontSize: 17, fontWeight: "700", color: "#fff" },
  settingsBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingWrapper: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },

  messagesList: { padding: 16, paddingBottom: 100, gap: 8 },
  bubbleRow: { alignItems: "flex-start", marginBottom: 4 },
  bubbleRowMe: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: "hidden",
  },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleOther: {
    backgroundColor: Colors.bgCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  bubbleText: { fontSize: 15, color: "#fff", lineHeight: 21 },
  time: { fontSize: 11, color: Colors.textMuted, marginTop: 4, marginLeft: 8 },
  timeMe: { marginRight: 8, marginLeft: 0 },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    marginBottom: 80,
  },
  inputIcon: { borderRadius: 20, overflow: "hidden" },
  inputIconGrad: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  inputIconPlain: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  textInputWrap: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  textInput: { fontSize: 15, color: "#fff" },
  sendBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
