import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";
import { CATEGORY_LABELS, VENDOR_CATALOG, Vendor, VendorCategory } from "@/constants/vendors";
import { useColors } from "@/hooks/useColors";

const CATEGORIES: { key: VendorCategory | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "COMMUNICATION", label: "Communication" },
  { key: "CLOUD", label: "Cloud" },
  { key: "PAYMENTS", label: "Payments" },
  { key: "SECURITY", label: "Security" },
  { key: "OBSERVABILITY", label: "Observability" },
  { key: "PRODUCTIVITY", label: "Productivity" },
  { key: "DEVELOPER_TOOLS", label: "Dev Tools" },
  { key: "OTHER", label: "Other" },
];

function VendorRow({ vendor }: { vendor: Vendor }) {
  const colors = useColors();
  const { isSubscribed, subscribe, unsubscribe } = useApp();
  const subscribed = isSubscribed(vendor.id);

  function toggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (subscribed) {
      unsubscribe(vendor.id);
    } else {
      subscribe(vendor.id);
    }
  }

  return (
    <View style={[styles.vendorRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: vendor.logoColor + "22", borderColor: vendor.logoColor + "44" },
        ]}
      >
        <Text style={[styles.avatarText, { color: vendor.logoColor }]}>{vendor.logoChar}</Text>
      </View>
      <View style={styles.vendorInfo}>
        <Text style={[styles.vendorName, { color: colors.foreground }]}>{vendor.name}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.category, { color: colors.mutedForeground }]}>
            {CATEGORY_LABELS[vendor.category]}
          </Text>
          <Text style={[styles.dot, { color: colors.mutedForeground }]}> · </Text>
          <StatusBadge status={vendor.status} />
        </View>
      </View>
      <Pressable
        testID={`subscribe-${vendor.id}`}
        style={[
          styles.subscribeBtn,
          {
            backgroundColor: subscribed ? colors.primary + "22" : colors.muted,
            borderColor: subscribed ? colors.primary : colors.border,
          },
        ]}
        onPress={toggle}
      >
        {subscribed ? (
          <Feather name="check" size={15} color={colors.primary} />
        ) : (
          <Feather name="plus" size={15} color={colors.mutedForeground} />
        )}
      </Pressable>
    </View>
  );
}

export default function VendorsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<VendorCategory | "ALL">("ALL");

  const filtered = useMemo(
    () =>
      VENDOR_CATALOG.filter((v) => {
        const matchSearch = v.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = category === "ALL" || v.category === category;
        return matchSearch && matchCat;
      }),
    [search, category]
  );

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
        <View style={[styles.searchBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search vendors..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.key}
              style={[
                styles.catPill,
                { backgroundColor: category === cat.key ? colors.primary : colors.muted },
              ]}
              onPress={() => setCategory(cat.key)}
            >
              <Text
                style={[
                  styles.catLabel,
                  {
                    color:
                      category === cat.key ? colors.primaryForeground : colors.mutedForeground,
                  },
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VendorRow vendor={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
        scrollEnabled={filtered.length > 0}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No vendors found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    borderBottomWidth: 1,
    paddingBottom: 0,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  catScroll: { paddingHorizontal: 12, paddingBottom: 12, gap: 6 },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 4,
  },
  catLabel: { fontSize: 13, fontWeight: "600" },
  list: { padding: 12 },
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
  subscribeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { padding: 60, alignItems: "center" },
  emptyText: { fontSize: 15 },
});
