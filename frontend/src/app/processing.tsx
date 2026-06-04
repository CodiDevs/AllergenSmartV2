import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { useAppStore } from '@/store/appStore';
import { AlergiMascot } from '@/components/ui/AlergiMascot';

export default function ProcessingScreen() {
  const router = useRouter();
  const { activeScan } = useAppStore();
  const [progress, setProgress] = useState(0.2);
  const [step, setStep] = useState(1); // 1: Image, 2: OCR, 3: Analysis, 4: Match

  useEffect(() => {
    // Stage 1: OCR Extraction active (start at 65%)
    const timer1 = setTimeout(() => {
      setProgress(0.65);
      setStep(2);
    }, 600);

    // Stage 2: Allergen Analysis active (progress to 80%)
    const timer2 = setTimeout(() => {
      setProgress(0.8);
      setStep(3);
    }, 1500);

    // Stage 3: Profile Cross-referencing active (progress to 95%)
    const timer3 = setTimeout(() => {
      setProgress(0.95);
      setStep(4);
    }, 2400);

    // Final Stage: Complete (100% and navigate)
    const timer4 = setTimeout(() => {
      setProgress(1.0);
      if (activeScan) {
        if (activeScan.status === 'warning') {
          router.replace('/warning');
        } else {
          router.replace('/result');
        }
      } else {
        // Fallback
        router.replace('/(tabs)');
      }
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [activeScan]);

  const handleCancel = () => {
    router.replace('/(tabs)/scanner');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancel}
          activeOpacity={0.8}
        >
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analizando...</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Mascot container */}
        <View style={styles.mascotCard}>
          <AlergiMascot state="blue" size={70} />
        </View>

        {/* Caption */}
        <View style={styles.textCenter}>
          <Text style={styles.title}>Alergi está trabajando</Text>
          <Text style={styles.subtitle}>
            Procesando {activeScan?.rawIngredients.length ?? 312} caracteres detectados
          </Text>
        </View>

        {/* Steps box */}
        <View style={styles.stepsList}>
          {/* Step 1: Capture */}
          <View style={[styles.stepRow, step > 1 && styles.stepRowDone]}>
            <View style={[styles.stepDot, step > 1 ? styles.dotDone : styles.dotActive]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Captura de imagen</Text>
              <Text style={styles.stepDesc}>1 foto · 2.1 MP</Text>
            </View>
            {step > 1 && (
              <Svg style={styles.checkIcon} width="12" height="12" viewBox="0 0 14 14" fill="none">
                <Circle cx="7" cy="7" r="6" fill="#9FE1CB" />
                <Path d="M4 7l2 2 4-4" stroke="#085041" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </View>

          {/* Step 2: OCR */}
          <View style={[
            styles.stepRow,
            step === 2 && styles.stepRowActive,
            step > 2 && styles.stepRowDone,
            step < 2 && styles.stepRowWaiting
          ]}>
            <View style={[styles.stepDot, step > 2 ? styles.dotDone : step === 2 ? styles.dotActive : styles.dotWaiting]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, step === 2 && { color: '#185FA5' }]}>Extracción OCR</Text>
              <Text style={[styles.stepDesc, step === 2 && { color: Colors.primary }]}>
                {step === 2 ? 'Identificando ingredientes...' : 'Extracción finalizada'}
              </Text>
            </View>
            {step > 2 && (
              <Svg style={styles.checkIcon} width="12" height="12" viewBox="0 0 14 14" fill="none">
                <Circle cx="7" cy="7" r="6" fill="#9FE1CB" />
                <Path d="M4 7l2 2 4-4" stroke="#085041" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </View>

          {/* Step 3: Analysis */}
          <View style={[
            styles.stepRow,
            step === 3 && styles.stepRowActive,
            step > 3 && styles.stepRowDone,
            step < 3 && styles.stepRowWaiting
          ]}>
            <View style={[styles.stepDot, step > 3 ? styles.dotDone : step === 3 ? styles.dotActive : styles.dotWaiting]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, step === 3 && { color: '#185FA5' }]}>Análisis de alérgenos</Text>
              <Text style={[styles.stepDesc, step === 3 && { color: Colors.primary }]}>
                {step === 3 ? 'Buscando alérgenos...' : 'Base de datos CodiDevs'}
              </Text>
            </View>
            {step > 3 && (
              <Svg style={styles.checkIcon} width="12" height="12" viewBox="0 0 14 14" fill="none">
                <Circle cx="7" cy="7" r="6" fill="#9FE1CB" />
                <Path d="M4 7l2 2 4-4" stroke="#085041" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </View>

          {/* Step 4: Profile matching */}
          <View style={[
            styles.stepRow,
            step === 4 && styles.stepRowActive,
            step < 4 && styles.stepRowWaiting
          ]}>
            <View style={[styles.stepDot, step === 4 ? styles.dotActive : styles.dotWaiting]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, step === 4 && { color: '#185FA5' }]}>Cruce con tu perfil</Text>
              <Text style={[styles.stepDesc, step === 4 && { color: Colors.primary }]}>
                {step === 4 ? 'Analizando severidad...' : 'Severidad personalizada'}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarWrap}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress * 100)}% completado
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    paddingBottom: 10,
    height: Platform.OS === 'android' ? 84 : 56,
  },
  cancelBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 14,
    color: '#1A2340',
  },
  body: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  mascotCard: {
    width: 100,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  textCenter: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontWeight: '800',
    fontSize: 14,
    color: '#1A2340',
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: FontFamily.interRegular,
    fontSize: 10,
    color: '#6B7A99',
  },
  stepsList: {
    width: '100%',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F5',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  stepRowActive: {
    borderColor: '#B5D4F4',
    backgroundColor: '#F0F6FF',
  },
  stepRowWaiting: {
    opacity: 0.5,
  },
  stepRowDone: {
    borderColor: '#E2E8F5',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  dotDone: {
    backgroundColor: '#24C8A0',
  },
  dotActive: {
    backgroundColor: '#5A7BFA',
  },
  dotWaiting: {
    backgroundColor: '#DDE3F0',
  },
  stepTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '700',
    fontSize: 10,
    color: '#1A2340',
  },
  stepDesc: {
    fontFamily: FontFamily.interRegular,
    fontSize: 9,
    color: '#8896B0',
    marginTop: 1,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  progressBarWrap: {
    width: '100%',
    height: 5,
    backgroundColor: '#EEF3FF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 5,
    backgroundColor: '#5A7BFA',
    borderRadius: 10,
  },
  progressText: {
    fontFamily: FontFamily.interRegular,
    fontSize: 9,
    color: '#8896B0',
  },
});
