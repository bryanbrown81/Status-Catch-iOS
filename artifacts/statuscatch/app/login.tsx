import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Redirect } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const WEB_APP_URL = process.env.EXPO_PUBLIC_API_URL || "https://statuscatch.up.railway.app";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, login } = useAuth();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Redirect href="/" />;

  async function handleLogin() {
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

  function openWebApp() {
    Linking.openURL(`${WEB_APP_URL}/dashboard/settings`);
  }

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top + (Platform.OS === "web" ? 80 : 60) },
      ]}
    >
      <View style={styles.logoSection}>
        <Text style={[styles.title, { color: colors.primary }]}>StatusCatch</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          IT Ops Monitoring Dashboard
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.instructions, { color: colors.foreground }]}>
          Connect your account
        </Text>
        <Text style={[styles.instructionsSub, { color: colors.mutedForeground }]}>
          Generate an API token from the StatusCatch web app, then paste it below.
        </Text>

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
          onPress={handleLogin}
          disabled={!token.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.connectBtnText}>Connect</Text>
          )}
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Pressable style={styles.helpRow} onPress={openWebApp}>
          <Feather name="external-link" size={16} color={colors.primary} />
          <Text style={[styles.helpLink, { color: colors.primary }]}>
            Generate token on web app
          </Text>
        </Pressable>

        <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
          Sign into statuscatch.up.railway.app, navigate to Settings, and create a mobile API token.
          The token is shown once — copy it before closing.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  logoSection: { alignItems: "center", marginBottom: 48 },
  title: { fontSize: 32, fontWeight: "700", letterSpacing: -1 },
  subtitle: { fontSize: 15, marginTop: 6 },
  form: {},
  instructions: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  instructionsSub: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
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
  divider: { height: 1, marginVertical: 28 },
  helpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  helpLink: { fontSize: 15, fontWeight: "600" },
  helpText: { fontSize: 13, lineHeight: 19 },
});
