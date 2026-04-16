import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const WEB_APP_URL = process.env.EXPO_PUBLIC_API_URL || "https://statuscatch.up.railway.app";

function SettingRow({
  label,
  value,
  onPress,
  isLast,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      style={[styles.row, { borderBottomWidth: isLast ? 0 : 1, borderColor: colors.border }]}
      onPress={onPress}
    >
      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>}
        {onPress && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
      </View>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { alertRules } = useApp();

  function confirmLogout() {
    Alert.alert("Disconnect", "Remove your API token and disconnect from StatusCatch?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          logout();
        },
      },
    ]);
  }

  function openWebApp() {
    Linking.openURL(`${WEB_APP_URL}/dashboard/settings`);
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 110, paddingTop: Platform.OS === "web" ? 67 : insets.top + 20 },
      ]}
    >
      <View style={[styles.connectedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.statusDot, { backgroundColor: "#22C55E" }]} />
        <View style={styles.connectedInfo}>
          <Text style={[styles.connectedLabel, { color: colors.foreground }]}>Connected</Text>
          <Text style={[styles.connectedUrl, { color: colors.mutedForeground }]}>
            statuscatch.up.railway.app
          </Text>
        </View>
        <Pressable
          style={[styles.manageBtn, { backgroundColor: colors.muted }]}
          onPress={openWebApp}
        >
          <Feather name="external-link" size={14} color={colors.primary} />
        </Pressable>
      </View>

      <Section title="LOCAL SETTINGS">
        <SettingRow label="Alert Rules" value={`${alertRules.length} rules`} />
        <SettingRow label="Data Refresh" value="30 seconds" isLast />
      </Section>

      <Section title="ACCOUNT">
        <SettingRow label="Manage Account" onPress={openWebApp} />
        <SettingRow label="Manage Vendors" onPress={() => Linking.openURL(`${WEB_APP_URL}/dashboard/vendors`)} />
        <SettingRow label="Web Dashboard" onPress={() => Linking.openURL(`${WEB_APP_URL}/dashboard`)} isLast />
      </Section>

      <Section title="ABOUT">
        <SettingRow label="Version" value="1.0.0" />
        <SettingRow label="Platform" value={Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : "Web"} />
        <SettingRow label="StatusCatch Web" value="statuscatch.up.railway.app" isLast />
      </Section>

      <Pressable
        style={[styles.logoutBtn, { borderColor: colors.destructive }]}
        onPress={confirmLogout}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Disconnect</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16 },
  connectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  connectedInfo: { flex: 1 },
  connectedLabel: { fontSize: 16, fontWeight: "700" },
  connectedUrl: { fontSize: 12, marginTop: 2 },
  manageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: "uppercase",
  },
  sectionBody: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  rowLabel: { fontSize: 15, flex: 1 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowValue: { fontSize: 14 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "600" },
});
