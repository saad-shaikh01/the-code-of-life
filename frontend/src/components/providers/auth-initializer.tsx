"use client";

import * as React from "react";
import { apiClient } from "@/api/client";
import { useAuthStore } from "@/stores";

export function AuthInitializer() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const setAuthReady = useAuthStore((state) => state.setAuthReady);
  const hasInitializedRef = React.useRef(false);

  React.useEffect(() => {
    if (!hasHydrated || isAuthReady || hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;
    let isActive = true;

    const initializeAuth = async () => {
      apiClient.syncSessionCookie();

      if (!apiClient.hasStoredSession()) {
        if (isActive) {
          setAuthReady(true);
        }
        return;
      }

      try {
        await refreshUser();
      } finally {
        if (isActive) {
          setAuthReady(true);
        }
      }
    };

    void initializeAuth();

    return () => {
      isActive = false;
    };
  }, [hasHydrated, isAuthReady, refreshUser, setAuthReady]);

  return null;
}
