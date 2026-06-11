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

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

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

  // Inicializar auth una sola vez al montar
  useEffect(() => {
    initialize();
  }, []);

  // Ocultar SplashScreen UNA SOLA VEZ cuando las fuentes estén listas.
  // Separado del efecto de navegación para evitar llamadas múltiples.
  const splashHidden = useRef(false);
  useEffect(() => {
    if (fontsLoaded && !splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hideAsync().catch(() => {
        // Ignorar el error de iOS "No native splash screen registered"
        // que ocurre si hideAsync se llama más de una vez o fuera de contexto.
      });
    }
  }, [fontsLoaded]);

  // Gestión de navegación: redirige según el estado de sesión.
  // Este efecto puede ejecutarse varias veces — NO llama a hideAsync.
  useEffect(() => {
    if (loading || !fontsLoaded) return;

    // Check if the user is currently inside the (auth) directory
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to login if there is no session
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirect to main tabs if session exists
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FAFBFF' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="result" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="processing" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="warning" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
    </>
  );
}
