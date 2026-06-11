import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { useAppStore } from '@/store/appStore';
import { AlergiMascot } from '@/components/ui/AlergiMascot';
import {
  scanLabel,
  mapAlertLevelToStatus,
  mapSeverityToStore,
  type ScanResponse,
} from '@/services/api';

export default function ProcessingScreen() {
  const router = useRouter();
  const { pendingScan, setActiveScan, addHistoryItem, setPendingScan } = useAppStore();
  const [progress, setProgress] = useState(0.2);
  const [step, setStep] = useState(1); // 1: Image, 2: OCR, 3: Analysis, 4: Match
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const hasCalled = useRef(false);

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;

    runScan();
  }, []);

  /**
   * Llama al backend, mapea la respuesta y navega a la pantalla correcta.
   */
  const runScan = async () => {
    // ─── Animación de progreso visual ─────────────────────────────────────────
    const t1 = setTimeout(() => { setProgress(0.45); setStep(2); }, 600);
    const t2 = setTimeout(() => { setProgress(0.72); setStep(3); }, 1400);
    const t3 = setTimeout(() => { setProgress(0.88); setStep(4); }, 2200);

    try {
      // ─── Preparar payload ───────────────────────────────────────────────────
      if (!pendingScan?.imageBase64) {
        throw new Error('No hay datos de escaneo disponibles. Vuelve e intenta de nuevo.');
      }

      const payload = {
        image_base64: pendingScan.imageBase64,
        scan_source: pendingScan.scanSource,
        barcode: pendingScan.barcode,
        app_version: '2.0.0',
      };

      // ─── Llamada al backend ─────────────────────────────────────────────────
      const response: ScanResponse = await scanLabel(payload);

      // ─── Limpiar timers de animación ────────────────────────────────────────
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      setProgress(1.0);
      setStep(4);

      // ─── Mapear ScanResponse → ActiveScan ──────────────────────────────────
      const status = mapAlertLevelToStatus(response.alert_level);
      const allergenNames = response.allergens_found.map((a) => a.name);
      const productName =
        response.product?.name ||
        pendingScan.productName ||
        (pendingScan.scanSource === 'manual' ? 'Producto Manual' : 'Producto escaneado');
      const brandName = response.product?.brand || '';

      const activeScan = {
        name: productName,
        brand: brandName,
        status,
        confidence: Math.round(response.confidence * 100),
        allergens: allergenNames,
        rawIngredients: response.detected_text || pendingScan.manualText || '',
        allergensDetailed: response.allergens_found,
        warnings: response.warnings,
        detectedText: response.detected_text,
        fromCache: response.from_cache,
      };

      setActiveScan(activeScan);

      // ─── Guardar en historial local (el backend ya lo guardó en BD) ─────────
      const now = new Date();
      addHistoryItem({
        name: productName,
        brand: brandName,
        detail:
          allergenNames.length > 0
            ? `${allergenNames.length} alérgeno${allergenNames.length > 1 ? 's' : ''} detectado${allergenNames.length > 1 ? 's' : ''}`
            : 'Sin alérgenos detectados',
        time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        date: 'Hoy',
        status,
        confidence: Math.round(response.confidence * 100),
        allergens: allergenNames,
        rawIngredients: response.detected_text || '',
      });

      // ─── Limpiar pendingScan ────────────────────────────────────────────────
      setPendingScan(null);

      // ─── Navegar según nivel de alerta ──────────────────────────────────────
      await new Promise((r) => setTimeout(r, 400)); // pequeña pausa para ver el 100%
      if (status === 'warning') {
        router.replace('/warning');
      } else {
        router.replace('/result');
      }
    } catch (err: any) {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      const message: string =
        err?.message || 'Error al procesar el escaneo. Verifica tu conexión con el servidor.';
      setErrorMsg(message);
      setProgress(0);
    }
  };

  const handleCancel = () => {
    setPendingScan(null);
    router.replace('/(tabs)/scan');
  };

  const handleRetry = () => {
    setErrorMsg(null);
    setProgress(0.2);
    setStep(1);
    hasCalled.current = false;
    runScan();
  };

  // ─── Pantalla de error ─────────────────────────────────────────────────────
  if (errorMsg) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5M12 19l-7-7 7-7" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error de análisis</Text>
          <View style={{ width: 30 }} />
        </View>

        <View style={styles.body}>
          <View style={styles.mascotCard}>
            <AlergiMascot state="red" size={70} />
          </View>
          <View style={styles.textCenter}>
            <Text style={styles.title}>Algo salió mal</Text>
            <Text style={[styles.subtitle, { color: Colors.dangerMid, textAlign: 'center', marginTop: 6, lineHeight: 16 }]}>
              {errorMsg}
            </Text>
          </View>

          <View style={{ gap: 10, width: '100%', marginTop: 20 }}>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: Colors.primary }]}
              onPress={handleRetry}
              activeOpacity={0.85}
            >
              <Text style={styles.retryBtnText}>Intentar de nuevo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: Colors.dangerSurface, borderWidth: 1, borderColor: Colors.dangerBorder }]}
              onPress={handleCancel}
              activeOpacity={0.85}
            >
              <Text style={[styles.retryBtnText, { color: Colors.dangerMid }]}>Volver al escáner</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Pantalla de carga normal ──────────────────────────────────────────────
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
            {pendingScan?.manualText
              ? `Analizando ${pendingScan.manualText.length} caracteres de ingredientes`
              : 'Procesando imagen con Google Cloud Vision'}
          </Text>
        </View>

        {/* Steps box */}
        <View style={styles.stepsList}>
          {/* Step 1: Capture */}
          <View style={[styles.stepRow, step > 1 && styles.stepRowDone]}>
            <View style={[styles.stepDot, step > 1 ? styles.dotDone : styles.dotActive]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Captura de imagen</Text>
              <Text style={styles.stepDesc}>
                {pendingScan?.scanSource === 'manual' ? 'Texto de ingredientes' : '1 foto tomada'}
              </Text>
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
                {step === 3 ? 'Buscando alérgenos...' : 'Base de datos AllergenSmart'}
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
  retryBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '700',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
