import { Redirect } from 'expo-router';

import { DebugScreen, debugMenuEnabled } from '@/features/debug';

export default function DebugRoute() {
  if (!debugMenuEnabled) return <Redirect href="/" />;
  return <DebugScreen />;
}
