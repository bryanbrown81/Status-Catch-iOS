import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { fetchIncidents, getIncidentVendorName } from "@/lib/api";
import type { ApiIncident } from "@/lib/api";

type IncidentType = "INCIDENT" | "MAINTENANCE";

const TYPE_OPTIONS: { key: IncidentType; label: string }[] = [
  { key: "INCIDENT", label: "Incidents" },
  { key: "MAINTENANCE", label: "Maintenance" },
];

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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function IncidentCard({ incident }: { incident: ApiIncident }) {
  const colors = useColors();
  const impactColor = IMPACT_COLORS[incident.impact] ?? "#6B7280";
  const vendorName = getIncidentVendorName(incident);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: impactColor },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardVendor, { color: colors.mutedForeground }]} numberOfLines={1}>
          {vendorName}
        </Text>
        <View style={[styles.impactBadge, { backgroundColor: impactColor + "22" }]}>
          <Text style={[styles.impactText, { color: impactColor }]}>
            {incident.impact}
          </Text>
        </View>
      </View>
      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
        {incident.title}
      </Text>
      {incident.updates?.[0] && (
        <Text style={[styles.cardBody, { color: colors.mutedForeground }]} numberOfLines={2}>
          {incident.updates[0].body}
        </Text>
      )}
      <View style={styles.cardFooter}>
        <Text style={[styles.cardStatus, { color: colors.mutedForeground }]}>
          {STATUS_LABELS[incident.status] ?? incident.status}
        </Text>
        <Text style={[styles.cardTime, { color: colors.mutedForeground }]}>
          {timeAgo(incident.startedAt)}
        </Text>
      </View>
    </View>
  );
}

export default function IncidentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string; activeOnly?: string }>();
  const [type, setType] = useState<IncidentType>("INCIDENT");
  const [activeOnly, setActiveOnly] = useState(false);

  useEffect(() => {
    if (params.type === "INCIDENT" || params.type === "MAINTENANCE") {
      setType(params.type);
    }
    if (params.activeOnly === "true") {
      setActiveOnly(true);
    }
  }, [params.type, params.activeOnly]);

  const queryParams = {
    limit: 50,
    type,
    ...(activeOnly ? { active: true } : {}),
  };

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["incidents", type, activeOnly],
    queryFn: () => fetchIncidents(queryParams),
    refetchInterval: 30000,
  });

  const incidents = data?.incidents ?? [];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.headerArea,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Incidents</Text>
        <View style={styles.filterRow}>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map((t) => (
              <Pressable
                key={t.key}
                style={[
                  styles.filterPill,
                  { backgroundColor: type === t.key ? colors.primary : colors.muted },
                ]}
                onPress={() => setType(t.key)}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    { color: type === t.key ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={[
              styles.activeToggle,
              {
                backgroundColor: activeOnly ? colors.primary : colors.muted,
                borderColor: activeOnly ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setActiveOnly((v) => !v)}
          >
            <Text
              style={[
                styles.activeToggleText,
                { color: activeOnly ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              Active Only
            </Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={36} color={colors.mutedForeground} />
          <Text style={[styles.errorText, { color: colors.foreground }]}>Connection Error</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <IncidentCard incident={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="check-circle" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {type === "MAINTENANCE"
                  ? activeOnly ? "No active maintenance" : "No maintenance found"
                  : activeOnly ? "No active incidents" : "No incidents found"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerArea: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", letterSpacing: -0.5, marginBottom: 12 },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterPill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  filterLabel: { fontSize: 14, fontWeight: "600" },
  activeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeToggleText: { fontSize: 12, fontWeight: "600" },
  list: { padding: 14 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  card: { padding: 14, borderRadius: 12, borderWidth: 1, borderLeftWidth: 3, marginBottom: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardVendor: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6, flex: 1, marginRight: 8 },
  impactBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  impactText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  cardTitle: { fontSize: 15, fontWeight: "600", lineHeight: 21, marginBottom: 6 },
  cardBody: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  cardStatus: { fontSize: 12 },
  cardTime: { fontSize: 12 },
  empty: { padding: 60, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 15 },
  errorText: { fontSize: 16, fontWeight: "600" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
