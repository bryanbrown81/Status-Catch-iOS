import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { useAuth } from "@/context/AuthContext";
import { registerForPushNotifications, sendTokenToBackend } from "@/lib/push";

function handleResponse(response: Notifications.NotificationResponse, navigate: (id: string) => void) {
  const data = response.notification.request.content.data as { incidentId?: string } | undefined;
  if (data?.incidentId) {
    navigate(data.incidentId);
  }
}

export function usePushRegistration() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const registeredRef = useRef(false);
  const coldStartHandledRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || registeredRef.current) return;
    registeredRef.current = true;
    (async () => {
      const token = await registerForPushNotifications();
      if (token) {
        await sendTokenToBackend(token);
      }
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || coldStartHandledRef.current) return;
    coldStartHandledRef.current = true;
    (async () => {
      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) {
        handleResponse(last, (id) => router.push(`/incident/${id}`));
      }
    })();
  }, [isAuthenticated, router]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleResponse(response, (id) => router.push(`/incident/${id}`));
    });
    return () => sub.remove();
  }, [router]);
}
