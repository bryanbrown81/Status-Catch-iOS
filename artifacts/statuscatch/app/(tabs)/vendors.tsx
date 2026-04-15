import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StatusBadge } from "@/components/StatusBadge";
import { CATEGORY_LABELS } from "@/constants/vendors";
import type { VendorStatus } from "@/constants/vendors";
import { useColors } from "@/hooks/useColors";
import { fetchVendors, getVendorColor, getVendorInitial, getVendorName } from "@/lib/api";
import type { ApiVendor } from "@/lib/api";

const WEB_APP_URL = process.env.EXPO_PUBLIC_API_URL || "https://statuscatch.up.railway.app";

function VendorRow({ vendor }: { vendor: ApiVendor }) {
  const colors = useColors();
  const name = getVendorName(vendor);
  const initial = getVendorInitial(vendor);
  const brandColor = getVendorColor(vendor);
  const category = vendor.vendorCatalog?.category ?? "OTHER";
  const incidentCount = vendor._count?.incidents ?? 0;

  return (
    <View style={[styles.vendorRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View
        style={[styles.avatar, { backgroundColor: brandColor + "22", borderColor: brandColor + "44" }]}
      >
        <Text style={[styles.avatarText, { color: brandColor }]}>{initial}</Text>
      </View>
      <View style={styles.vendorInfo}>
        <Text style={[styles.vendorName, { color: colors.foreground }]}>{name}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.category, { color: colors.mutedForeground }]}>
            {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category}
          </Text>
          {incidentCount > 0 && (
            <>
              <Text style={[styles.dot, { color: colors.mutedForeground }]}> · </Text>
              <Text style={[styles.incidentCount, { color: colors.mutedForeground }]}>
                {incidentCount} incident{incidentCount !== 1 ? "s" : ""}
              </Text>
            </>
          )}
        </View>
      </View>
      <StatusBadge status={vendor.currentStatus as VendorStatus} />
    </View>
  );
}

export default function VendorsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
    refetchInterval: 30000,
  });

  const vendors = data?.vendors ?? [];

  function openWebApp() {
    Linking.openURL(`${WEB_APP_URL}/dashboard/vendors`);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: Platform.OS === "web" ? 67 : 12,
          },
        ]}
      >
        <Text style={[styles.topBarInfo, { color: colors.mutedForeground }]}>
          {vendors.length} vendor subscription{vendors.length !== 1 ? "s" : ""}
        </Text>
        <Pressable style={styles.manageBtn} onPress={openWebApp}>
          <Feather name="external-link" size={14} color={colors.primary} />
          <Text style={[styles.manageBtnText, { color: colors.primary }]}>Manage</Text>
        </Pressable>
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
          data={vendors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VendorRow vendor={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="server" size={44} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No vendors yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Add vendor subscriptions from the StatusCatch web app
              </Text>
              <Pressable style={[styles.webBtn, { backgroundColor: colors.primary }]} onPress={openWebApp}>
                <Feather name="external-link" size={16} color="#fff" />
                <Text style={styles.webBtnText}>Open Web App</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topBarInfo: { fontSize: 13 },
  manageBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  manageBtnText: { fontSize: 14, fontWeight: "600" },
  list: { padding: 12 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 17, fontWeight: "700" },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  category: { fontSize: 12 },
  dot: { fontSize: 12 },
  incidentCount: { fontSize: 12 },
  empty: { padding: 60, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: 8 },
  emptyText: { fontSize: 14, textAlign: "center" },
  webBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  webBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  errorText: { fontSize: 16, fontWeight: "600" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
