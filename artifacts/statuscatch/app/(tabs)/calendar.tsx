import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { fetchIncidents, getIncidentVendorName } from "@/lib/api";
import type { ApiIncident } from "@/lib/api";

const IMPACT_COLORS: Record<string, string> = {
  NONE: "#6B7280",
  MINOR: "#F59E0B",
  MAJOR: "#F97316",
  CRITICAL: "#EF4444",
};

const STATUS_COLOR_SCHEDULED = "#3B82F6";
const STATUS_COLOR_IN_PROGRESS = "#F59E0B";
const STATUS_COLOR_COMPLETED = "#22C55E";

function statusGroupColor(status: string): string {
  switch (status) {
    case "SCHEDULED":
      return STATUS_COLOR_SCHEDULED;
    case "RESOLVED":
    case "COMPLETED":
      return STATUS_COLOR_COMPLETED;
    default:
      return STATUS_COLOR_IN_PROGRESS;
  }
}

const STATUS_LABELS: Record<string, string> = {
  INVESTIGATING: "Investigating",
  IDENTIFIED: "Identified",
  MONITORING: "Monitoring",
  RESOLVED: "Resolved",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

interface CalendarCell {
  date: Date;
  inCurrentMonth: boolean;
}

function buildCalendarGrid(year: number, month: number): CalendarCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month, -startOffset + i + 1);
    cells.push({ date: d, inCurrentMonth: false });
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), inCurrentMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, inCurrentMonth: false });
  }

  return cells;
}

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const maintenanceQuery = useQuery({
    queryKey: ["calendar", "maintenance"],
    queryFn: () => fetchIncidents({ type: "MAINTENANCE", limit: 100 }),
    refetchInterval: 60000,
  });

  const allEvents: ApiIncident[] = useMemo(() => {
    return maintenanceQuery.data?.incidents ?? [];
  }, [maintenanceQuery.data]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ApiIncident[]>();
    for (const ev of allEvents) {
      const key = dateKey(new Date(ev.startedAt));
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [allEvents]);

  const cells = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const selectedKey = dateKey(selectedDate);
  const selectedEvents = (eventsByDay.get(selectedKey) ?? []).sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  const isLoading = maintenanceQuery.isLoading;

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function jumpToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(today);
  }

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
        <View style={styles.titleRow}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Calendar</Text>
          <Pressable
            onPress={jumpToToday}
            style={[styles.todayBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.todayBtnText, { color: colors.primary }]}>Today</Text>
          </Pressable>
        </View>

        <View style={styles.monthNav}>
          <Pressable onPress={goPrevMonth} hitSlop={12} style={styles.navBtn}>
            <Feather name="chevron-left" size={22} color={colors.primary} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: colors.foreground }]}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>
          <Pressable onPress={goNextMonth} hitSlop={12} style={styles.navBtn}>
            <Feather name="chevron-right" size={22} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}
      >
        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((d, idx) => (
              <Text
                key={idx}
                style={[styles.weekdayLabel, { color: colors.mutedForeground }]}
              >
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.legendRow}>
            {[
              { label: "Scheduled", color: STATUS_COLOR_SCHEDULED },
              { label: "In Progress", color: STATUS_COLOR_IN_PROGRESS },
              { label: "Completed", color: STATUS_COLOR_COMPLETED },
            ].map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((cell, idx) => {
              const key = dateKey(cell.date);
              const events = eventsByDay.get(key) ?? [];
              const isSelected = isSameDay(cell.date, selectedDate);
              const isToday = isSameDay(cell.date, today);
              const dotColors = Array.from(
                new Set(events.map((e) => statusGroupColor(e.status))),
              ).slice(0, 3);

              return (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedDate(cell.date)}
                  style={[
                    styles.cell,
                    isSelected && { backgroundColor: colors.primary },
                    !isSelected && isToday && { borderWidth: 1, borderColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.cellText,
                      {
                        color: isSelected
                          ? "#fff"
                          : cell.inCurrentMonth
                            ? colors.foreground
                            : colors.mutedForeground,
                        opacity: cell.inCurrentMonth || isSelected ? 1 : 0.4,
                        fontWeight: isToday || isSelected ? "700" : "500",
                      },
                    ]}
                  >
                    {cell.date.getDate()}
                  </Text>
                  <View style={styles.dotsRow}>
                    {dotColors.map((c, di) => (
                      <View
                        key={di}
                        style={[
                          styles.dot,
                          { backgroundColor: isSelected ? "#fff" : c },
                        ]}
                      />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.selectedHeader}>
          <Text style={[styles.selectedDateText, { color: colors.foreground }]}>
            {selectedDate.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <Text style={[styles.selectedCount, { color: colors.mutedForeground }]}>
            {selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : selectedEvents.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="calendar" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No events on this day
            </Text>
          </View>
        ) : (
          selectedEvents.map((event) => {
            const impactColor = IMPACT_COLORS[event.impact] ?? "#6B7280";
            return (
              <Pressable
                key={event.id}
                onPress={() => router.push(`/incident/${event.id}`)}
                style={({ pressed }) => [
                  styles.eventCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderLeftColor: impactColor,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View style={styles.eventHeader}>
                  <Text
                    style={[styles.eventVendor, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {getIncidentVendorName(event)}
                  </Text>
                  <Text style={[styles.eventTime, { color: colors.mutedForeground }]}>
                    {formatTime(event.startedAt)}
                  </Text>
                </View>
                <Text
                  style={[styles.eventTitle, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {event.title}
                </Text>
                <View style={styles.eventFooter}>
                  <View style={[styles.badge, { backgroundColor: impactColor + "22" }]}>
                    <Text style={[styles.badgeText, { color: impactColor }]}>
                      {event.impact}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.badgeText, { color: colors.foreground }]}>
                      {STATUS_LABELS[event.status] ?? event.status}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerArea: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", letterSpacing: -0.5 },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  todayBtnText: { fontSize: 13, fontWeight: "600" },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: { padding: 4 },
  monthLabel: { fontSize: 17, fontWeight: "700" },
  scroll: { padding: 14 },
  calendarCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 18,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginBottom: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: "600" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  cellText: { fontSize: 15 },
  dotsRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
    height: 4,
  },
  dot: { width: 4, height: 4, borderRadius: 2 },
  selectedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  selectedDateText: { fontSize: 16, fontWeight: "700" },
  selectedCount: { fontSize: 13 },
  centered: { padding: 40, alignItems: "center" },
  empty: {
    padding: 30,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  emptyText: { fontSize: 14 },
  eventCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: 10,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  eventVendor: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    flex: 1,
    marginRight: 8,
  },
  eventTime: { fontSize: 12 },
  eventTitle: { fontSize: 15, fontWeight: "600", lineHeight: 21, marginBottom: 10 },
  eventFooter: { flexDirection: "row", gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
});
