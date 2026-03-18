import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import { Colors, Gradients } from "../../theme/colors";
import { KaytiHeader, InputField } from "../../components/ui";
import { Icon } from "../../components/ui/Icon";
import { GoogleIcon } from "../../components/ui/GoogleIcon";
import { useAuthStore } from "../../stores/authStore";
import { hapticLight, hapticSuccess, hapticError } from "../../utils/haptics";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

function translateError(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.includes("Invalid credentials")) return "Email ou mot de passe incorrect.";
  if (raw.includes("Email already in use")) return "Cet email est déjà utilisé.";
  if (raw.includes("Username already taken")) return "Ce nom d'utilisateur est déjà pris.";
  if (raw.includes("Network Error") || raw.includes("Network error")) return "Impossible de joindre le serveur. Vérifiez votre connexion.";
  if (raw.includes("timeout") || raw.toLowerCase().includes("timeout")) return "La requête a expiré. Réessayez.";
  if (raw.includes("Invalid Google token") || raw.includes("Google")) return "Connexion Google échouée. Réessayez.";
  if (raw.includes("Invalid Apple token") || raw.includes("Apple")) return "Connexion Apple échouée. Réessayez.";
  return "Une erreur est survenue. Réessayez.";
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={eb.container}>
      <View style={eb.iconWrap}>
        <Icon name="x" size={13} color="#FF6B6B" strokeWidth={2.5} />
      </View>
      <Text style={eb.text}>{message}</Text>
    </View>
  );
}

// Isolated so the hook only mounts when the client ID is available
function GoogleSignInButton({ onSuccess, disabled }: { onSuccess: (idToken: string) => void; disabled: boolean }) {
  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID!,
  });

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const idToken = googleResponse.params?.id_token;
      if (idToken) onSuccess(idToken);
    }
  }, [googleResponse]);

  return (
    <TouchableOpacity style={s.socialCardBtn} activeOpacity={0.85} onPress={() => googlePromptAsync()} disabled={disabled}>
      <GoogleIcon size={20} />
      <Text style={s.socialBtnText}>Continuer avec Google</Text>
    </TouchableOpacity>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const loginWithApple = useAuthStore((s) => s.loginWithApple);
  const storeError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  // Clear any leftover error from a previous screen (e.g. coming from register)
  useEffect(() => { clearError(); }, []);

  const handleGoogleSuccess = (idToken: string) => {
    setIsLoading(true);
    loginWithGoogle(idToken)
      .then(() => router.replace("/(tabs)/home"))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  const isSubmitting = useRef(false);

  const handleLogin = async () => {
    if (isSubmitting.current) return;
    setValidationError(null);
    clearError();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) { hapticError(); setValidationError("Veuillez entrer votre email"); return; }
    if (!password) { hapticError(); setValidationError("Veuillez entrer votre mot de passe"); return; }
    hapticLight();
    isSubmitting.current = true;
    setIsLoading(true);
    try {
      await login(trimmedEmail, password);
      hapticSuccess();
      router.replace("/(tabs)/home");
    } catch { hapticError(); } finally { setIsLoading(false); isSubmitting.current = false; }
  };

  const handleAppleLogin = async () => {
    clearError();
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error("No identity token");
      setIsLoading(true);
      await loginWithApple(
        credential.identityToken,
        credential.fullName?.givenName ?? undefined
      );
      router.replace("/(tabs)/home");
    } catch (e: unknown) {
      if ((e as { code?: string }).code !== "ERR_REQUEST_CANCELED") {
        hapticError();
      }
    } finally { setIsLoading(false); }
  };

  const displayError = translateError(validationError || storeError);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.container}>
        <StatusBar style="light" />
        <LinearGradient colors={["#0E0824", "#080814"]} style={StyleSheet.absoluteFillObject} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <KaytiHeader />

          <View style={s.content}>
            <Text style={s.title}>Se connecter</Text>
            <Text style={s.subtitle}>Connectez-vous pour continuer</Text>

            <View style={s.form}>
              <InputField label="Email" placeholder="vous@email.com" value={email} onChangeText={setEmail} icon="mail" keyboardType="email-address" />
              <View style={s.passwordBlock}>
                <InputField label="Mot de passe" placeholder="········" value={password} onChangeText={setPassword} icon="lock" secureTextEntry showPasswordToggle />
                <TouchableOpacity style={s.forgotBtn} onPress={() => router.push("/(auth)/forgot-password")}>
                  <Text style={s.forgotText}>Mot de passe oublié ?</Text>
                </TouchableOpacity>
              </View>
            </View>

            {displayError ? <ErrorBanner message={displayError} /> : null}

            {/* Login button */}
            <TouchableOpacity style={[s.mainBtn, isLoading && { opacity: 0.7 }]} onPress={handleLogin} activeOpacity={0.85} disabled={isLoading}>
              <LinearGradient colors={Gradients.purpleBlue} style={s.mainBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {isLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                  <><Text style={s.mainBtnText}>Se connecter</Text><Icon name="arrow-right" size={18} color="#fff" /></>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>Ou continuer avec</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Google — hook only runs when client ID is configured */}
            {GOOGLE_IOS_CLIENT_ID ? (
              <GoogleSignInButton onSuccess={handleGoogleSuccess} disabled={isLoading} />
            ) : (
              <TouchableOpacity style={s.socialCardBtn} activeOpacity={0.85} disabled={isLoading}
                onPress={() => Alert.alert("Non configuré", "Ajoutez EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID dans .env pour activer Google Sign-In.")}>
                <GoogleIcon size={20} />
                <Text style={s.socialBtnText}>Continuer avec Google</Text>
              </TouchableOpacity>
            )}

            {/* Apple (iOS only) — disabled in beta builds (ASC API Key can't configure capability identifier) */}
            {Platform.OS === "ios" && process.env.EXPO_PUBLIC_DISABLE_APPLE_AUTH !== "true" && (
              <TouchableOpacity style={s.socialCardBtn} activeOpacity={0.85} onPress={handleAppleLogin} disabled={isLoading}>
                <Icon name="apple" size={20} color="#fff" />
                <Text style={s.socialBtnText}>Continuer avec Apple</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => router.replace("/(auth)/register")} style={s.switchLink}>
              <Text style={s.switchText}>Pas encore de compte ?{" "}<Text style={s.switchBold}>S'inscrire</Text></Text>
            </TouchableOpacity>
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

  title: { fontSize: 30, fontWeight: "900", color: Colors.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 12, color: Colors.textPrimary, lineHeight: 22, marginTop: -15, textAlign: "center" },

  form: { gap: 14 },
  passwordBlock: { gap: 6 },
  forgotBtn: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13, color: Colors.textSecondary, fontWeight: "600" },

  mainBtn: {
    borderRadius: 50, overflow: "hidden",
    shadowColor: Colors.gradientPurple, shadowOpacity: 0.5, shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 }, elevation: 10, marginTop: 4,
  },
  mainBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 17, gap: 10 },
  mainBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerText: { fontSize: 13, color: Colors.textMuted },

  socialCardBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 15, gap: 10,
    backgroundColor: Colors.bgCardAlt, borderRadius: 50,
    borderWidth: 1, borderColor: Colors.inputBorder,
  },
  socialBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  switchLink: { alignItems: "center", paddingVertical: 4 },
  switchText: { color: Colors.textSecondary, fontSize: 15 },
  switchBold: { color: Colors.textPrimary, fontWeight: "700" },

});

const eb = StyleSheet.create({
  container: {
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
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  text: {
    flex: 1,
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
});
