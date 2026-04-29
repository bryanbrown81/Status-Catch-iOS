import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import type { ApiIncident } from "@/lib/api";

const STORAGE_KEY = "notif_read_v1";

type ReadMap = Record<string, string>;

function getNotifTimestamp(incident: ApiIncident): string {
  const latest = incident.updates?.[0]?.publishedAt;
  return latest ?? incident.startedAt;
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

  const visible = hydrated
    ? incidents
        .filter((inc) => {
          const lastRead = readMap[inc.id];
          if (!lastRead) return true;
          return new Date(getNotifTimestamp(inc)).getTime() > new Date(lastRead).getTime();
        })
        .sort(
          (a, b) =>
            new Date(getNotifTimestamp(b)).getTime() -
            new Date(getNotifTimestamp(a)).getTime(),
        )
    : [];

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
