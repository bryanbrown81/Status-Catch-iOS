import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import { AlertRule, DEFAULT_SUBSCRIPTIONS, IncidentImpact } from "@/constants/vendors";

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

interface AppContextType {
  subscriptions: string[];
  alertRules: AlertRule[];
  isLoaded: boolean;
  subscribe: (vendorId: string) => void;
  unsubscribe: (vendorId: string) => void;
  isSubscribed: (vendorId: string) => boolean;
  addAlertRule: (rule: { name: string; vendorIds: string[]; impactLevel: IncidentImpact; isEnabled: boolean }) => void;
  updateAlertRule: (id: string, updates: Partial<AlertRule>) => void;
  deleteAlertRule: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_RULES: AlertRule[] = [
  {
    id: "default-critical",
    name: "Critical Incidents",
    vendorIds: [],
    impactLevel: "CRITICAL",
    isEnabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-major",
    name: "Major Disruptions",
    vendorIds: [],
    impactLevel: "MAJOR",
    isEnabled: true,
    createdAt: new Date().toISOString(),
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [subsStr, rulesStr] = await Promise.all([
          AsyncStorage.getItem("subscriptions"),
          AsyncStorage.getItem("alertRules"),
        ]);
        setSubscriptions(subsStr ? (JSON.parse(subsStr) as string[]) : DEFAULT_SUBSCRIPTIONS);
        setAlertRules(rulesStr ? (JSON.parse(rulesStr) as AlertRule[]) : DEFAULT_RULES);
      } catch {
        setSubscriptions(DEFAULT_SUBSCRIPTIONS);
        setAlertRules(DEFAULT_RULES);
      } finally {
        setIsLoaded(true);
      }
    }
    load();
  }, []);

  async function persist(key: string, value: unknown) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function subscribe(vendorId: string) {
    const next = [...subscriptions, vendorId];
    setSubscriptions(next);
    persist("subscriptions", next);
  }

  function unsubscribe(vendorId: string) {
    const next = subscriptions.filter((id) => id !== vendorId);
    setSubscriptions(next);
    persist("subscriptions", next);
  }

  function isSubscribed(vendorId: string) {
    return subscriptions.includes(vendorId);
  }

  function addAlertRule(rule: { name: string; vendorIds: string[]; impactLevel: IncidentImpact; isEnabled: boolean }) {
    const newRule: AlertRule = { ...rule, id: genId(), createdAt: new Date().toISOString() };
    const next = [...alertRules, newRule];
    setAlertRules(next);
    persist("alertRules", next);
  }

  function updateAlertRule(id: string, updates: Partial<AlertRule>) {
    const next = alertRules.map((r) => (r.id === id ? { ...r, ...updates } : r));
    setAlertRules(next);
    persist("alertRules", next);
  }

  function deleteAlertRule(id: string) {
    const next = alertRules.filter((r) => r.id !== id);
    setAlertRules(next);
    persist("alertRules", next);
  }

  return (
    <AppContext.Provider
      value={{ subscriptions, alertRules, isLoaded, subscribe, unsubscribe, isSubscribed, addAlertRule, updateAlertRule, deleteAlertRule }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
