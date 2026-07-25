import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth.store";
import { getAccessToken } from "@/lib/axios";
import NetInfo from "@react-native-community/netinfo";
import { flushQueue } from "@/lib/offline-queue";
import { api } from "@/lib/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 min — serve cache without refetch
      gcTime: 1000 * 60 * 60 * 24, // 24h — keep in MMKV storage
    },
  },
});

export default function RootLayout() {
  const { setAuthenticated, setLoading } = useAuthStore();

  useEffect(() => {
    getAccessToken().then((token) => {
      setAuthenticated(!!token);
      setLoading(false);
    });
  }, []);
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        flushQueue(api, () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["sales"] });
        });
      }
    });
    return unsub;
  }, []);
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="index" />
        </Stack>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}
