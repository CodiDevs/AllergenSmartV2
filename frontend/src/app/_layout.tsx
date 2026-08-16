/**
 * Root Layout — Loads fonts and manages navigation stack & Supabase session routing
 */
import React, { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAppStore } from '@/store/appStore';
import { ErrorBoundary } from '@/components/error-boundary';
import { OfflineBanner } from '@/components/offline-banner';

// Prevent the splash screen from auto-hiding before asset loading is complete (solo en móvil)
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const { session, loading, initialize } = useAuthStore();
  const { hasSeenOnboarding, _hasHydrated } = useAppStore();

  // Inicializar auth una sola vez al montar
  useEffect(() => {
    initialize();
  }, []);

  // Ocultar SplashScreen UNA SOLA VEZ cuando las fuentes estén listas.
  const splashHidden = useRef(false);
  useEffect(() => {
    if (fontsLoaded && !splashHidden.current) {
      splashHidden.current = true;
      if (Platform.OS !== 'web') {
        SplashScreen.hideAsync().catch(() => {});
      }
    }
  }, [fontsLoaded]);

  // Gestión de navegación: redirige según el estado de sesión y onboarding.
  useEffect(() => {
    if (loading) return;

    // Check if the user is currently inside the (auth) directory
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    // 1. Mostrar Onboarding primero si no lo ha visto
    if (!hasSeenOnboarding) {
      if (!inOnboarding) {
        router.replace('/onboarding');
      }
      return;
    }

    // 2. Si ya vio el onboarding, manejar sesión
    if (!session && !inAuthGroup && !inOnboarding) {
      router.replace('/(auth)/login');
    } else if (session && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)');

      const { notifications, generateWelcomeNotification } = useNotificationStore.getState();
      const hasWelcome = notifications.some((n) => n.type === 'welcome');
      if (!hasWelcome) {
        const name = session.user?.user_metadata?.full_name || 'usuario';
        generateWelcomeNotification(name);
      }
    }
  }, [session, loading, segments, hasSeenOnboarding]);

  return (
    <ErrorBoundary>
      <StatusBar style="dark" />
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FAFBFF' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="result" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="processing" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="warning" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="summary" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
    </ErrorBoundary>
  );
}
