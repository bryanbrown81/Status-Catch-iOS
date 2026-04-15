import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IMPACT_COLORS, IMPACT_LABELS, INCIDENT_STATUS_LABELS, Incident } from "@/constants/vendors";
import { useColors } from "@/hooks/useColors";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  incident: Incident;
  onPress?: () => void;
}

export function IncidentCard({ incident, onPress }: Props) {
  const colors = useColors();
  const impactColor = IMPACT_COLORS[incident.impact];

  return (
    <Pressable
      testID={`incident-card-${incident.id}`}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: impactColor,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={[styles.vendor, { color: colors.mutedForeground }]} numberOfLines={1}>
          {incident.vendorName}
        </Text>
        <View style={[styles.impactBadge, { backgroundColor: impactColor + "22" }]}>
          <Text style={[styles.impactText, { color: impactColor }]}>
            {IMPACT_LABELS[incident.impact].toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
        {incident.title}
      </Text>
      <View style={styles.footer}>
        <Text style={[styles.status, { color: colors.mutedForeground }]}>
          {INCIDENT_STATUS_LABELS[incident.status]}
        </Text>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>
          {timeAgo(incident.updatedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  vendor: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    flex: 1,
    marginRight: 8,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  impactText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  status: { fontSize: 12 },
  time: { fontSize: 12 },
});
