import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BraveThemeProvider } from '@/ui/braveline';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <BraveThemeProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </BraveThemeProvider>
    </SafeAreaProvider>
  );
}
