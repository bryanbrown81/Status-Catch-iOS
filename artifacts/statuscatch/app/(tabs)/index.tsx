import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";

import { IncidentCard } from "@/components/IncidentCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";
import { CATEGORY_LABELS, MOCK_INCIDENTS, VENDOR_CATALOG } from "@/constants/vendors";
import { useColors } from "@/hooks/useColors";

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

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { subscriptions } = useApp();
  const [refreshing, setRefreshing] = React.useState(false);

  const activeIncidents = useMemo(
    () => MOCK_INCIDENTS.filter((i) => !["RESOLVED", "COMPLETED"].includes(i.status)),
    []
  );

  const subscribedVendors = useMemo(
    () => VENDOR_CATALOG.filter((v) => subscriptions.includes(v.id)),
    [subscriptions]
  );

  const operationalCount = VENDOR_CATALOG.filter((v) => v.status === "OPERATIONAL").length;

  const systemStatus = useMemo(() => {
    if (activeIncidents.some((i) => i.impact === "CRITICAL"))
      return { label: "Critical Incident Active", color: "#EF4444", bg: "#EF444418" };
    if (activeIncidents.some((i) => i.impact === "MAJOR"))
      return { label: "Service Disruption", color: "#F97316", bg: "#F9731618" };
    if (activeIncidents.some((i) => i.impact === "MINOR"))
      return { label: "Partial Disruption", color: "#F59E0B", bg: "#F59E0B18" };
    return { label: "All Systems Operational", color: "#22C55E", bg: "#22C55E18" };
  }, [activeIncidents]);

  function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
        <Pressable style={styles.bellBtn} testID="bell-button">
          {Platform.OS === "ios" ? (
            <SymbolView name="bell.badge" tintColor={colors.primary} size={22} />
          ) : (
            <Feather name="bell" size={22} color={colors.primary} />
          )}
          {activeIncidents.length > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{activeIncidents.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
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

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: "#22C55E" }]}>{operationalCount}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Operational</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: activeIncidents.length > 0 ? "#EF4444" : colors.foreground }]}>
              {activeIncidents.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active Incidents</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{subscriptions.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Subscribed</Text>
          </View>
        </View>

        {activeIncidents.length > 0 && (
          <>
            <SectionHeader title="Active Incidents" count={activeIncidents.length} />
            {activeIncidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </>
        )}

        <SectionHeader title="My Vendors" count={subscribedVendors.length} />
        {subscribedVendors.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="server" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No vendors subscribed</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Browse the Vendors tab to subscribe to status feeds
            </Text>
          </View>
        ) : (
          subscribedVendors.map((vendor) => (
            <View
              key={vendor.id}
              style={[styles.vendorRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.vendorAvatar, { backgroundColor: vendor.logoColor + "22", borderColor: vendor.logoColor + "44" }]}>
                <Text style={[styles.vendorAvatarText, { color: vendor.logoColor }]}>
                  {vendor.logoChar}
                </Text>
              </View>
              <View style={styles.vendorInfo}>
                <Text style={[styles.vendorName, { color: colors.foreground }]}>{vendor.name}</Text>
                <Text style={[styles.vendorCategory, { color: colors.mutedForeground }]}>
                  {CATEGORY_LABELS[vendor.category]}
                </Text>
              </View>
              <StatusBadge status={vendor.status} />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
  content: { padding: 16, gap: 0 },
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
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statNum: { fontSize: 26, fontWeight: "700" },
  statLabel: { fontSize: 10, marginTop: 3, textAlign: "center" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: { fontSize: 12, fontWeight: "600" },
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  vendorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  vendorAvatarText: { fontSize: 16, fontWeight: "700" },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  vendorCategory: { fontSize: 12 },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  emptySubtitle: { fontSize: 13, textAlign: "center", lineHeight: 18 },
});
