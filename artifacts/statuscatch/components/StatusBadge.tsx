import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { STATUS_COLORS, STATUS_LABELS, VendorStatus } from "@/constants/vendors";

interface Props {
  status: VendorStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: Props) {
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];
  const isSmall = size === "sm";

  return (
    <View style={[styles.container, { backgroundColor: color + "22" }]}>
      <View
        style={[
          styles.dot,
          { backgroundColor: color },
          isSmall ? styles.dotSm : styles.dotMd,
        ]}
      />
      <Text
        style={[
          styles.label,
          { color },
          isSmall ? styles.labelSm : styles.labelMd,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 5,
    alignSelf: "flex-start",
  },
  dot: {
    borderRadius: 10,
  },
  dotSm: { width: 6, height: 6 },
  dotMd: { width: 8, height: 8 },
  label: { fontWeight: "600" },
  labelSm: { fontSize: 11 },
  labelMd: { fontSize: 13 },
});
