import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Colors, Gradients } from "../../theme/colors";
import { KaytiHeader, InputField } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";
import { authApi } from "../../services/api/auth.api";
import { hapticError, hapticLight, hapticSuccess } from "../../utils/haptics";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) { hapticError(); setError("Veuillez entrer votre adresse email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { hapticError(); setError("L'adresse email n'est pas valide."); return; }

    hapticLight();
    setIsLoading(true);
    try {
      await authApi.requestPasswordReset(trimmed);
      hapticSuccess();
      setSent(true);
    } catch {
      hapticError();
      setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.container}>
        <StatusBar style="light" />
        <LinearGradient colors={["#0E0824", "#080814"]} style={StyleSheet.absoluteFillObject} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <KaytiHeader />

          <View style={s.content}>
            {/* Back button */}
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
              <Icon name="chevron-left" size={20} color={Colors.textSecondary} />
              <Text style={s.backText}>Retour</Text>
            </TouchableOpacity>

            {sent ? (
              /* ── Success state ── */
              <View style={s.successWrap}>
                <View style={s.successIcon}>
                  <LinearGradient colors={Gradients.purpleBlue} style={s.successIconGradient}>
                    <Icon name="mail" size={32} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={s.title}>Email envoyé !</Text>
                <Text style={s.successBody}>
                  Si un compte existe avec{" "}
                  <Text style={s.successEmail}>{email.trim()}</Text>
                  , vous recevrez un lien de réinitialisation dans quelques minutes.
                </Text>
                <Text style={s.successHint}>
                  Vérifiez également votre dossier spam.
                </Text>
                <TouchableOpacity
                  style={s.mainBtn}
                  onPress={() => router.replace("/(auth)/login")}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={Gradients.purpleBlue}
                    style={s.mainBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={s.mainBtnText}>Retour à la connexion</Text>
                    <Icon name="arrow-right" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              /* ── Form state ── */
              <>
                <Text style={s.title}>Mot de passe oublié ?</Text>
                <Text style={s.subtitle}>
                  Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </Text>

                <View style={s.form}>
                  <InputField
                    label="Email"
                    placeholder="vous@email.com"
                    value={email}
                    onChangeText={(t) => { setEmail(t); setError(null); }}
                    icon="mail"
                    keyboardType="email-address"
                  />
                </View>

                {error ? (
                  <View style={s.errorBanner}>
                    <View style={s.errorIcon}>
                      <Icon name="x" size={13} color="#FF6B6B" strokeWidth={2.5} />
                    </View>
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[s.mainBtn, isLoading && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  activeOpacity={0.85}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={Gradients.purpleBlue}
                    style={s.mainBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Text style={s.mainBtnText}>Envoyer le lien</Text>
                        <Icon name="arrow-right" size={18} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingBottom: 50 },
  content: { paddingHorizontal: 24, gap: 18 },

  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  backText: { fontSize: 14, color: Colors.textSecondary, fontWeight: "600" },

  title: { fontSize: 28, fontWeight: "900", color: Colors.textPrimary, textAlign: "center" },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: -8,
  },

  form: { gap: 14 },

  mainBtn: {
    borderRadius: 50,
    overflow: "hidden",
    shadowColor: Colors.gradientPurple,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    marginTop: 4,
  },
  mainBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    gap: 10,
  },
  mainBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255, 107, 107, 0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.25)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  errorText: { flex: 1, color: "#FF6B6B", fontSize: 14, fontWeight: "500", lineHeight: 20 },

  // ── Success ──
  successWrap: { alignItems: "center", gap: 18, marginTop: 16 },
  successIcon: {
    shadowColor: Colors.gradientPurple,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    marginBottom: 4,
  },
  successIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  successBody: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  successEmail: { color: Colors.textPrimary, fontWeight: "700" },
  successHint: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: -8,
  },
});
