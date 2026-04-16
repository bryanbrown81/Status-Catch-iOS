import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { SymbolView } from "expo-symbols";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRouter } from "expo-router";

import { StatusBadge } from "@/components/StatusBadge";
import { CATEGORY_LABELS } from "@/constants/vendors";
import type { VendorStatus } from "@/constants/vendors";
import { useColors } from "@/hooks/useColors";
import {
  fetchDashboard,
  getIncidentVendorName,
  getVendorColor,
  getVendorInitial,
  getVendorName,
} from "@/lib/api";
import type { ApiIncident, ApiVendor } from "@/lib/api";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const IMPACT_COLORS: Record<string, string> = {
  NONE: "#6B7280",
  MINOR: "#F59E0B",
  MAJOR: "#F97316",
  CRITICAL: "#EF4444",
};

function SectionHeader({ title, count }: { title: string; count?: number }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {count !== undefined && (
        <View style={[styles.countPill, { backgroundColor: colors.muted }]}>
          <Text style={[styles.countText, { color: colors.mutedForeground }]}>{count}</Text>
        </View>
      )}
    </View>
  );
}

function IncidentRow({ incident }: { incident: ApiIncident }) {
  const colors = useColors();
  const impactColor = IMPACT_COLORS[incident.impact] ?? "#6B7280";
  const vendorName = getIncidentVendorName(incident);

  return (
    <View
      style={[
        styles.incidentCard,
        { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: impactColor },
      ]}
    >
      <View style={styles.incidentHeader}>
        <Text style={[styles.incidentVendor, { color: colors.mutedForeground }]} numberOfLines={1}>
          {vendorName}
        </Text>
        <View style={[styles.impactBadge, { backgroundColor: impactColor + "22" }]}>
          <Text style={[styles.impactText, { color: impactColor }]}>
            {incident.impact}
          </Text>
        </View>
      </View>
      <Text style={[styles.incidentTitle, { color: colors.foreground }]} numberOfLines={2}>
        {incident.title}
      </Text>
      <View style={styles.incidentFooter}>
        <Text style={[styles.incidentStatus, { color: colors.mutedForeground }]}>
          {incident.status.replace(/_/g, " ")}
        </Text>
        <Text style={[styles.incidentTime, { color: colors.mutedForeground }]}>
          {timeAgo(incident.startedAt)}
        </Text>
      </View>
    </View>
  );
}

function VendorRow({ vendor }: { vendor: ApiVendor }) {
  const colors = useColors();
  const name = getVendorName(vendor);
  const initial = getVendorInitial(vendor);
  const brandColor = getVendorColor(vendor);
  const category = vendor.vendorCatalog?.category ?? "OTHER";

  return (
    <View style={[styles.vendorRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.vendorAvatar, { backgroundColor: brandColor + "22", borderColor: brandColor + "44" }]}>
        <Text style={[styles.vendorAvatarText, { color: brandColor }]}>{initial}</Text>
      </View>
      <View style={styles.vendorInfo}>
        <Text style={[styles.vendorName, { color: colors.foreground }]}>{name}</Text>
        <Text style={[styles.vendorCategory, { color: colors.mutedForeground }]}>
          {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category}
        </Text>
      </View>
      <StatusBadge status={vendor.currentStatus as VendorStatus} />
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    refetchInterval: 30000,
  });

  const summary = data?.summary;
  const vendors = data?.vendors ?? [];
  const activeIncidents = data?.activeIncidents ?? [];

  const systemStatus = React.useMemo(() => {
    if (!summary)
      return { label: "Loading...", color: "#6B7280", bg: "#6B728018" };
    if (summary.criticalIncidentsCount > 0)
      return { label: "Critical Incident Active", color: "#EF4444", bg: "#EF444418" };
    if (summary.outageCount > 0)
      return { label: "Service Disruption", color: "#F97316", bg: "#F9731618" };
    if (summary.degradedCount > 0)
      return { label: "Partial Disruption", color: "#F59E0B", bg: "#F59E0B18" };
    return { label: "All Systems Operational", color: "#22C55E", bg: "#22C55E18" };
  }, [summary]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background }]}>
        <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>Connection Error</Text>
        <Text style={[styles.errorSub, { color: colors.mutedForeground }]}>
          Could not reach the StatusCatch server
        </Text>
        <Pressable style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.primary }]}>StatusCatch</Text>
        <Pressable style={styles.bellBtn}>
          {Platform.OS === "ios" ? (
            <SymbolView name="bell.badge" tintColor={colors.primary} size={22} />
          ) : (
            <Feather name="bell" size={22} color={colors.primary} />
          )}
          {(summary?.activeIncidentsCount ?? 0) > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{summary?.activeIncidentsCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
          />
        }
      >
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: systemStatus.bg, borderColor: systemStatus.color + "44" },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: systemStatus.color }]} />
          <Text style={[styles.statusLabel, { color: systemStatus.color }]}>
            {systemStatus.label}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <Pressable
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/vendors")}
            >
              <Text style={[styles.statNum, { color: "#22C55E" }]}>
                {summary?.operationalCount ?? 0}/{summary?.totalVendors ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Operational</Text>
            </Pressable>
            <Pressable
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/(tabs)/incidents", params: { type: "INCIDENT", activeOnly: "true" } })}
            >
              <Text
                style={[
                  styles.statNum,
                  { color: (summary?.activeIncidentsCount ?? 0) > 0 ? "#EF4444" : colors.foreground },
                ]}
              >
                {summary?.activeIncidentsCount ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active Incidents</Text>
            </Pressable>
          </View>
          <View style={styles.statsRow}>
            <Pressable
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/vendors")}
            >
              <Text
                style={[
                  styles.statNum,
                  { color: (summary?.outageCount ?? 0) > 0 ? "#F97316" : colors.foreground },
                ]}
              >
                {summary?.outageCount ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Outages</Text>
            </Pressable>
            <Pressable
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/(tabs)/incidents", params: { type: "MAINTENANCE", activeOnly: "true" } })}
            >
              <Text
                style={[
                  styles.statNum,
                  { color: (summary?.activeMaintenanceCount ?? 0) > 0 ? "#F59E0B" : colors.foreground },
                ]}
              >
                {summary?.activeMaintenanceCount ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Maintenance</Text>
            </Pressable>
          </View>
        </View>

        {activeIncidents.length > 0 && (
          <>
            <SectionHeader title="Active Incidents" count={activeIncidents.length} />
            {activeIncidents.map((incident) => (
              <IncidentRow key={incident.id} incident={incident} />
            ))}
          </>
        )}

        <SectionHeader title="My Vendors" count={vendors.length} />
        {vendors.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="server" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No vendors subscribed</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Add vendor subscriptions on the StatusCatch web app
            </Text>
          </View>
        ) : (
          vendors.map((vendor) => <VendorRow key={vendor.id} vendor={vendor} />)
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
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", letterSpacing: -0.5 },
  bellBtn: { padding: 4, position: "relative" },
  bellBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  scroll: { flex: 1 },
  content: { padding: 16 },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 14, fontWeight: "600" },
  statsGrid: { gap: 10, marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  statNum: { fontSize: 26, fontWeight: "700" },
  statLabel: { fontSize: 10, marginTop: 3, textAlign: "center" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 6 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  countPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 12, fontWeight: "600" },
  incidentCard: { padding: 14, borderRadius: 12, borderWidth: 1, borderLeftWidth: 3, marginBottom: 10 },
  incidentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  incidentVendor: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6, flex: 1, marginRight: 8 },
  impactBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  impactText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  incidentTitle: { fontSize: 15, fontWeight: "600", lineHeight: 21, marginBottom: 10 },
  incidentFooter: { flexDirection: "row", justifyContent: "space-between" },
  incidentStatus: { fontSize: 12, textTransform: "capitalize" },
  incidentTime: { fontSize: 12 },
  vendorRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  vendorAvatar: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  vendorAvatarText: { fontSize: 16, fontWeight: "700" },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  vendorCategory: { fontSize: 12 },
  emptyState: { padding: 32, borderRadius: 12, borderWidth: 1, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  emptySubtitle: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  errorText: { fontSize: 18, fontWeight: "600" },
  errorSub: { fontSize: 14, textAlign: "center" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  retryBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
