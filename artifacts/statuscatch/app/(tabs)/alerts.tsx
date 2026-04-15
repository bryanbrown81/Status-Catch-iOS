import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useApp } from "@/context/AppContext";
import { AlertRule, IMPACT_COLORS, IMPACT_LABELS, IncidentImpact } from "@/constants/vendors";
import { useColors } from "@/hooks/useColors";

const IMPACT_OPTIONS: IncidentImpact[] = ["MINOR", "MAJOR", "CRITICAL"];

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { alertRules, addAlertRule, updateAlertRule, deleteAlertRule } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newImpact, setNewImpact] = useState<IncidentImpact>("CRITICAL");

  function openModal() {
    setNewName("");
    setNewImpact("CRITICAL");
    setModalVisible(true);
  }

  function saveRule() {
    if (!newName.trim()) return;
    addAlertRule({ name: newName.trim(), vendorIds: [], impactLevel: newImpact, isEnabled: true });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert("Delete Rule", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteAlertRule(id) },
    ]);
  }

  function renderItem({ item }: { item: AlertRule }) {
    const impactColor = IMPACT_COLORS[item.impactLevel];
    return (
      <View style={[styles.ruleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.impactStripe, { backgroundColor: impactColor }]} />
        <View style={styles.ruleBody}>
          <View style={styles.ruleTop}>
            <Text style={[styles.ruleName, { color: colors.foreground }]}>{item.name}</Text>
            <Switch
              value={item.isEnabled}
              onValueChange={(v) => updateAlertRule(item.id, { isEnabled: v })}
              trackColor={{ false: colors.muted, true: colors.primary + "88" }}
              thumbColor={item.isEnabled ? colors.primary : colors.mutedForeground}
            />
          </View>
          <View style={styles.ruleBottom}>
            <View style={[styles.impactChip, { backgroundColor: impactColor + "22" }]}>
              <Text style={[styles.impactChipText, { color: impactColor }]}>
                {IMPACT_LABELS[item.impactLevel]}+ impact
              </Text>
            </View>
            <Pressable
              testID={`delete-rule-${item.id}`}
              onPress={() => confirmDelete(item.id, item.name)}
              style={styles.deleteBtn}
            >
              <Feather name="trash-2" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const fabBottom = Platform.OS === "web" ? 100 : insets.bottom + 100;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={alertRules}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: insets.bottom + 120,
            paddingTop: Platform.OS === "web" ? 67 : 16,
          },
        ]}
        scrollEnabled={alertRules.length > 0}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bell-off" size={44} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No alert rules</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Tap the + button to create your first rule
            </Text>
          </View>
        }
      />

      <Pressable
        testID="add-alert-btn"
        style={[styles.fab, { backgroundColor: colors.primary, bottom: fabBottom }]}
        onPress={openModal}
      >
        <Feather name="plus" size={26} color="#fff" />
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Alert Rule</Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>RULE NAME</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g. Critical Incidents"
              placeholderTextColor={colors.mutedForeground}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              MINIMUM IMPACT LEVEL
            </Text>
            <View style={styles.impactRow}>
              {IMPACT_OPTIONS.map((impact) => {
                const ic = IMPACT_COLORS[impact];
                const selected = newImpact === impact;
                return (
                  <Pressable
                    key={impact}
                    style={[
                      styles.impactOpt,
                      {
                        backgroundColor: selected ? ic + "28" : colors.muted,
                        borderColor: selected ? ic : colors.border,
                      },
                    ]}
                    onPress={() => setNewImpact(impact)}
                  >
                    <Text style={[styles.impactOptText, { color: selected ? ic : colors.mutedForeground }]}>
                      {IMPACT_LABELS[impact]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              testID="save-alert-btn"
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: newName.trim() ? 1 : 0.5 }]}
              onPress={saveRule}
            >
              <Text style={styles.saveBtnText}>Create Rule</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 16 },
  ruleCard: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  impactStripe: { width: 4 },
  ruleBody: { flex: 1, padding: 14 },
  ruleTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  ruleName: { fontSize: 16, fontWeight: "600", flex: 1, marginRight: 8 },
  ruleBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  impactChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  impactChipText: { fontSize: 12, fontWeight: "700" },
  deleteBtn: { padding: 6 },
  empty: { padding: 60, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: 8 },
  emptySub: { fontSize: 14, textAlign: "center" },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    padding: 24,
    paddingBottom: 44,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  impactRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  impactOpt: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  impactOptText: { fontSize: 13, fontWeight: "700" },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
