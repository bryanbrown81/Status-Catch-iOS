import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ApiIncident } from "@/lib/api";

const STORAGE_KEY = "notif_read_v1";

type ReadMap = Record<string, string>;

function getNotifTimestamp(incident: ApiIncident): string {
  const latest = incident.updates?.[0]?.publishedAt;
  return latest ?? incident.startedAt ?? new Date(0).toISOString();
}

function safeTime(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function useNotifications(incidents: ApiIncident[]) {
  const [readMap, setReadMap] = useState<ReadMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setReadMap(JSON.parse(raw));
      } catch {
        // ignore
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: ReadMap) => {
    setReadMap(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const visible = useMemo(() => {
    if (!hydrated) return [];
    return incidents
      .filter((inc) => {
        const lastRead = readMap[inc.id];
        if (!lastRead) return true;
        return safeTime(getNotifTimestamp(inc)) > safeTime(lastRead);
      })
      .sort((a, b) => safeTime(getNotifTimestamp(b)) - safeTime(getNotifTimestamp(a)));
  }, [incidents, readMap, hydrated]);

  const markRead = useCallback(
    (incident: ApiIncident) => {
      const next = { ...readMap, [incident.id]: getNotifTimestamp(incident) };
      void persist(next);
    },
    [readMap, persist],
  );

  const markAllRead = useCallback(() => {
    const next = { ...readMap };
    for (const inc of incidents) {
      next[inc.id] = getNotifTimestamp(inc);
    }
    void persist(next);
  }, [incidents, readMap, persist]);

  return { visible, markRead, markAllRead, unreadCount: visible.length };
}
