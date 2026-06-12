import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import '@/lib/i18n';
import { ensureAnonymousSession } from '@/features/auth';
import { prefetchUpcomingDailies } from '@/features/daily';
import { initGameRecorder } from '@/features/history';
import { initSync } from '@/features/sync';
import { useThemeColors } from '@/theme/tokens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60_000,
      networkMode: 'offlineFirst',
    },
  },
});

export default function RootLayout() {
  const colors = useThemeColors();

  useEffect(() => {
    const unsubscribeRecorder = initGameRecorder();
    let unsubscribeSync: (() => void) | null = null;
    void ensureAnonymousSession().then(() => {
      unsubscribeSync = initSync();
      void prefetchUpcomingDailies();
    });
    return () => {
      unsubscribeRecorder();
      unsubscribeSync?.();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
