import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from '@/components/ui/symbol-view';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/appStore';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    title: 'Bienvenido a\nSmartAllergen',
    description: 'Tu asistente de alimentación segura. Descubre exactamente qué contiene lo que comes.',
    icon: 'shield.checkerboard' as any,
    colors: ['#4F46E5', '#3b82f6'] as const,
  },
  {
    id: 2,
    title: 'Escaneo\nInteligente',
    description: 'Detecta alérgenos en segundos escaneando códigos de barras o leyendo ingredientes con OCR.',
    icon: 'barcode.viewfinder' as any,
    colors: ['#3b82f6', '#0ea5e9'] as const,
  },
  {
    id: 3,
    title: 'Control\nPersonalizado',
    description: 'Configura tus alergias y recibe alertas claras cuando un producto sea un riesgo para ti.',
    icon: 'person.crop.circle.badge.plus' as any,
    colors: ['#0ea5e9', '#10b981'] as const,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const router = useRouter();

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      completeOnboarding();
      // El _layout interceptará el cambio de estado y redirigirá al login
      router.replace('/(auth)/login');
    }
  };

  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Animated.View 
        key={`bg-${currentIndex}`}
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(500)}
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient
          colors={currentSlide.colors}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.topSection}>
          <Animated.View
            key={`icon-${currentIndex}`}
            entering={FadeIn.duration(600)}
            exiting={FadeOut.duration(300)}
            style={styles.iconContainer}
          >
            <View style={styles.iconGlass}>
              <SymbolView name={currentSlide.icon} size={100} tintColor="#ffffff" />
            </View>
          </Animated.View>
        </View>

        <View style={styles.bottomSection}>
          <Animated.View
            key={`text-${currentIndex}`}
            entering={FadeIn.duration(600).delay(100)}
            exiting={FadeOut.duration(300)}
          >
            <ThemedText style={styles.title}>{currentSlide.title}</ThemedText>
            <ThemedText style={styles.description}>{currentSlide.description}</ThemedText>
          </Animated.View>

          <View style={styles.footer}>
            <View style={styles.pagination}>
              {SLIDES.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
              <ThemedText style={styles.buttonText}>
                {currentIndex === SLIDES.length - 1 ? 'Comenzar' : 'Siguiente'}
              </ThemedText>
              <SymbolView name="arrow.right" size={20} tintColor="#4F46E5" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  topSection: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlass: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  bottomSection: {
    flex: 2,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 48,
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 28,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#ffffff',
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  button: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 99,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  buttonText: {
    color: '#4F46E5',
    fontSize: 18,
    fontWeight: '700',
  },
});
