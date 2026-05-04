import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { fetchIncidentDetail, getIncidentVendorName } from "@/lib/api";

const IMPACT_COLORS: Record<string, string> = {
  NONE: "#6B7280",
  MINOR: "#F59E0B",
  MAJOR: "#F97316",
  CRITICAL: "#EF4444",
};

const STATUS_LABELS: Record<string, string> = {
  INVESTIGATING: "Investigating",
  IDENTIFIED: "Identified",
  MONITORING: "Monitoring",
  RESOLVED: "Resolved",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function durationBetween(startIso: string, endIso: string | null): string {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const diffMs = end - start;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) return `${hrs}h ${remMins}m`;
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return `${days}d ${remHrs}h`;
}

export default function IncidentDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["incident", id],
    queryFn: () => fetchIncidentDetail(id),
    enabled: !!id,
  });

  const incident = data?.incident;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, flex: 1 }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isError || !incident) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, flex: 1, paddingTop: insets.top + 60 }]}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>Incident not found</Text>
        <Pressable
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const impactColor = IMPACT_COLORS[incident.impact] ?? "#6B7280";
  const vendorName = getIncidentVendorName(incident);
  const isResolved = incident.status === "RESOLVED" || incident.status === "COMPLETED";
  const updates = [...(incident.updates ?? [])].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Feather name="chevron-left" size={26} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {incident.externalUrl ? (
          <Pressable
            style={styles.vendorRow}
            onPress={() => incident.externalUrl && Linking.openURL(incident.externalUrl)}
            hitSlop={8}
          >
            <Text style={[styles.vendorLabel, { color: colors.mutedForeground }]}>{vendorName}</Text>
            <Feather name="external-link" size={13} color={colors.mutedForeground} style={styles.vendorLinkIcon} />
          </Pressable>
        ) : (
          <Text style={[styles.vendorLabel, { color: colors.mutedForeground }]}>{vendorName}</Text>
        )}
        <Text style={[styles.title, { color: colors.foreground }]}>{incident.title}</Text>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: impactColor + "22" }]}>
            <Text style={[styles.badgeText, { color: impactColor }]}>{incident.impact}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.badgeText, { color: colors.foreground }]}>
              {STATUS_LABELS[incident.status] ?? incident.status}
            </Text>
          </View>
        </View>

        <View style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Started</Text>
            <Text style={[styles.metaValue, { color: colors.foreground }]}>
              {formatDateTime(incident.startedAt)}
            </Text>
          </View>
          {incident.resolvedAt && (
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Resolved</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>
                {formatDateTime(incident.resolvedAt)}
              </Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
              {isResolved ? "Duration" : "Ongoing"}
            </Text>
            <Text style={[styles.metaValue, { color: colors.foreground }]}>
              {durationBetween(incident.startedAt, incident.resolvedAt)}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Updates ({updates.length})
        </Text>

        {updates.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No updates yet</Text>
          </View>
        ) : (
          updates.map((update, idx) => (
            <View
              key={update.id}
              style={[
                styles.updateCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.updateHeader}>
                <View style={styles.updateStatusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: idx === 0 ? impactColor : colors.mutedForeground },
                    ]}
                  />
                  <Text style={[styles.updateStatus, { color: colors.foreground }]}>
                    {STATUS_LABELS[update.status] ?? update.status}
                  </Text>
                </View>
                <Text style={[styles.updateTime, { color: colors.mutedForeground }]}>
                  {formatDateTime(update.publishedAt)}
                </Text>
              </View>
              <Text style={[styles.updateBody, { color: colors.foreground }]}>{update.body}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center", gap: 12, padding: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  backText: { fontSize: 17, marginLeft: -2 },
  scroll: { padding: 18, paddingBottom: 40 },
  vendorRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  vendorLabel: { fontSize: 13, fontWeight: "600", letterSpacing: 0.4 },
  vendorLinkIcon: { marginTop: 1 },
  title: { fontSize: 22, fontWeight: "700", lineHeight: 28, marginBottom: 14 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  metaCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 22,
    gap: 8,
  },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metaLabel: { fontSize: 13 },
  metaValue: { fontSize: 13, fontWeight: "600" },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 10 },
  emptyState: { padding: 24, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  emptyText: { fontSize: 14 },
  updateCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  updateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  updateStatusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  updateStatus: { fontSize: 14, fontWeight: "600" },
  updateTime: { fontSize: 12 },
  updateBody: { fontSize: 14, lineHeight: 20 },
  errorText: { fontSize: 18, fontWeight: "600" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  retryBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
