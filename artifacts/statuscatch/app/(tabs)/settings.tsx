import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

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
  const { subscriptions, alertRules } = useApp();
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: insets.bottom + 110,
          paddingTop: Platform.OS === "web" ? 67 : 20,
        },
      ]}
    >
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.profileAvatar, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="user" size={30} color={colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>IT Operations</Text>
          <Text style={[styles.profileOrg, { color: colors.mutedForeground }]}>Default Organization</Text>
        </View>
        <View style={[styles.planBadge, { backgroundColor: colors.muted }]}>
          <Text style={[styles.planLabel, { color: colors.mutedForeground }]}>FREE</Text>
        </View>
      </View>

      <Section title="MONITORING">
        <SettingRow label="Subscribed Vendors" value={`${subscriptions.length} vendors`} />
        <SettingRow label="Alert Rules" value={`${alertRules.length} rules`} />
        <SettingRow label="Poll Interval" value="5 min" isLast />
      </Section>

      <Section title="NOTIFICATIONS">
        <View style={[styles.row, { borderBottomWidth: 1, borderColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>Email Notifications</Text>
          <Switch
            value={emailEnabled}
            onValueChange={setEmailEnabled}
            trackColor={{ false: colors.muted, true: colors.primary + "88" }}
            thumbColor={emailEnabled ? colors.primary : colors.mutedForeground}
          />
        </View>
        <View style={[styles.row, { borderBottomWidth: 1, borderColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>In-App Alerts</Text>
          <Switch
            value={inAppEnabled}
            onValueChange={setInAppEnabled}
            trackColor={{ false: colors.muted, true: colors.primary + "88" }}
            thumbColor={inAppEnabled ? colors.primary : colors.mutedForeground}
          />
        </View>
        <SettingRow label="Email Digest" value="Immediate" isLast />
      </Section>

      <Section title="FEED SOURCES">
        <SettingRow label="RSS / ATOM Feeds" value="Enabled" />
        <SettingRow label="Webhook Support" value="Configured" isLast />
      </Section>

      <Section title="ABOUT">
        <SettingRow label="Version" value="1.0.0" />
        <SettingRow label="StatusCatch Web" value="statuscatch.io" />
        <SettingRow label="Support" value="help@statuscatch.io" isLast />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: "700" },
  profileOrg: { fontSize: 13, marginTop: 2 },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
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
});
