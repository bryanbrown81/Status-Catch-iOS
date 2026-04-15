import React, { useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IncidentCard } from "@/components/IncidentCard";
import { MOCK_INCIDENTS } from "@/constants/vendors";
import { useColors } from "@/hooks/useColors";

type Filter = "all" | "active" | "resolved";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "resolved", label: "Resolved" },
];

export default function IncidentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = MOCK_INCIDENTS.filter((i) => {
    if (filter === "active") return !["RESOLVED", "COMPLETED"].includes(i.status);
    if (filter === "resolved") return ["RESOLVED", "COMPLETED"].includes(i.status);
    return true;
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.filterBar,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: Platform.OS === "web" ? 67 : 12,
          },
        ]}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            testID={`filter-${f.key}`}
            style={[
              styles.filterPill,
              {
                backgroundColor: filter === f.key ? colors.primary : colors.muted,
              },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterLabel,
                {
                  color: filter === f.key ? colors.primaryForeground : colors.mutedForeground,
                },
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <IncidentCard incident={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
        scrollEnabled={filtered.length > 0}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No incidents found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  filterBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterLabel: { fontSize: 14, fontWeight: "600" },
  list: { padding: 14 },
  empty: { padding: 60, alignItems: "center" },
  emptyText: { fontSize: 15 },
});
