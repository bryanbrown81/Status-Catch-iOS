import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const WEB_APP_URL = process.env.EXPO_PUBLIC_API_URL || "https://statuscatch.up.railway.app";
const CALLBACK_SCHEME = "statuscatch";
const CALLBACK_PATH = "auth";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, login } = useAuth();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  if (isAuthenticated) return <Redirect href="/" />;

  async function handleWebLogin() {
    setLoading(true);
    try {
      const redirectUri = `${CALLBACK_SCHEME}://${CALLBACK_PATH}`;
      const loginUrl = `${WEB_APP_URL}/api/mobile/login?redirect=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(loginUrl, redirectUri);

      if (result.type === "cancel" || result.type === "dismiss") {
        return;
      }

      if (result.type !== "success" || !result.url) {
        Alert.alert("Sign-in Interrupted", "The sign-in session could not be completed. Please try again.");
        return;
      }

      const url = new URL(result.url);
      if (url.protocol !== `${CALLBACK_SCHEME}:` || url.host !== CALLBACK_PATH) {
        Alert.alert("Login Error", "Received an unexpected callback. Please try again.");
        return;
      }

      const rawToken = url.searchParams.get("token");
      if (!rawToken) {
        Alert.alert("Login Failed", "No token was received from the server. Please try again.");
        return;
      }

      const loginResult = await login(rawToken);
      if (loginResult === "valid") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (loginResult === "unauthorized") {
        Alert.alert("Authentication Failed", "The token received was invalid. Please try again.");
      } else {
        Alert.alert(
          "Server Unreachable",
          "Signed in successfully but could not verify the connection. The app will retry automatically.",
        );
      }
    } catch {
      Alert.alert("Login Error", "Something went wrong during sign-in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleManualLogin() {
    const trimmed = token.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const result = await login(trimmed);
      if (result === "valid") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result === "unauthorized") {
        Alert.alert(
          "Invalid Token",
          "The token you entered is invalid or expired. Please generate a new one from the web app.",
        );
      } else {
        Alert.alert(
          "Server Unreachable",
          "Could not reach the StatusCatch server. The token has been saved and will be verified when the server is available.",
        );
      }
    } catch {
      Alert.alert("Connection Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + (Platform.OS === "web" ? 80 : 60), paddingBottom: insets.bottom + 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoSection}>
        <Text style={[styles.title, { color: colors.primary }]}>StatusCatch</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          IT Ops Monitoring Dashboard
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.instructions, { color: colors.foreground }]}>
          Sign in to your account
        </Text>
        <Text style={[styles.instructionsSub, { color: colors.mutedForeground }]}>
          Sign in with your StatusCatch account to monitor your vendor statuses on the go.
        </Text>

        <Pressable
          style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleWebLogin}
          disabled={loading}
        >
          {loading && !showManualEntry ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="log-in" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Sign in with StatusCatch</Text>
            </>
          )}
        </Pressable>

        <View style={styles.orRow}>
          <View style={[styles.orLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.orText, { color: colors.mutedForeground }]}>or</Text>
          <View style={[styles.orLine, { backgroundColor: colors.border }]} />
        </View>

        <Pressable
          style={[styles.manualToggle, { borderColor: colors.border }]}
          onPress={() => setShowManualEntry(!showManualEntry)}
        >
          <Feather name="key" size={16} color={colors.mutedForeground} />
          <Text style={[styles.manualToggleText, { color: colors.foreground }]}>
            Enter API token manually
          </Text>
          <Feather
            name={showManualEntry ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.mutedForeground}
          />
        </Pressable>

        {showManualEntry && (
          <View style={styles.manualSection}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>API TOKEN</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Paste your API token here"
              placeholderTextColor={colors.mutedForeground}
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              editable={!loading}
            />
            <Pressable
              style={[
                styles.connectBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: token.trim() && !loading ? 1 : 0.5,
                },
              ]}
              onPress={handleManualLogin}
              disabled={!token.trim() || loading}
            >
              {loading && showManualEntry ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.connectBtnText}>Connect</Text>
              )}
            </Pressable>
            <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
              Generate a token from the StatusCatch web app Settings page. The token is shown once — copy it before closing.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: 24 },
  logoSection: { alignItems: "center", marginBottom: 48 },
  title: { fontSize: 32, fontWeight: "700", letterSpacing: -1 },
  subtitle: { fontSize: 15, marginTop: 6 },
  form: {},
  instructions: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  instructionsSub: { fontSize: 14, lineHeight: 20, marginBottom: 28 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 24,
  },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 13, fontWeight: "500" },
  manualToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  manualToggleText: { flex: 1, fontSize: 15, fontWeight: "600" },
  manualSection: { marginTop: 16 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  connectBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  connectBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  helpText: { fontSize: 13, lineHeight: 19, marginTop: 14 },
});
