/**
 * scan.tsx — Pantalla de escaneo real con expo-camera y expo-image-picker.
 *
 * Fixes aplicados:
 *  1. Tab bar oculta automáticamente cuando la cámara está activa (useNavigation).
 *  2. Flash real usando enableTorch (no flash prop, que solo aplica al tomar foto).
 *  3. Layout corregido: botones de la cámara por encima del área segura.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/ui/AppText';
import { router, useNavigation } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { useAppStore } from '@/store/appStore';
import { encodeTextAsBase64 } from '@/services/api';

const { width, height } = Dimensions.get('window');

type ScanMode = 'camera' | 'manual';

export default function ScanScreen() {
  const { setPendingScan } = useAppStore();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // ─── Estado ────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<ScanMode>('camera');
  const [torchOn, setTorchOn] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [productName, setProductName] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [barcodeText, setBarcodeText] = useState('');

  // ─── Permiso de cámara ─────────────────────────────────────────────────────
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // ─── Referencia cámara ─────────────────────────────────────────────────────
  const cameraRef = useRef<CameraView>(null);

  // ─── Ocultar/mostrar tab bar al entrar/salir de modo cámara ───────────────
  useEffect(() => {
    const parent = navigation.getParent();
    if (mode === 'camera') {
      // Ocultar tab bar para cámara fullscreen
      parent?.setOptions({ tabBarStyle: { display: 'none' } });
      StatusBar.setHidden(true);
    } else {
      // Restaurar tab bar en modo manual
      parent?.setOptions({ tabBarStyle: undefined });
      StatusBar.setHidden(false);
    }

    return () => {
      // Restaurar siempre al desmontar (e.g., navegar a otra pestaña)
      parent?.setOptions({ tabBarStyle: undefined });
      StatusBar.setHidden(false);
    };
  }, [mode, navigation]);

  // ─── Solicitar permiso al entrar en modo cámara ────────────────────────────
  useEffect(() => {
    if (mode === 'camera' && !cameraPermission?.granted) {
      requestCameraPermission();
    }
  }, [mode]);

  // ─── Tomar foto ────────────────────────────────────────────────────────────
  const handleTakePhoto = useCallback(async () => {
    if (!cameraRef.current || capturing) return;

    if (!cameraPermission?.granted) {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a la cámara para escanear etiquetas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Dar permiso', onPress: requestCameraPermission },
        ]
      );
      return;
    }

    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.75,
        base64: true,
        skipProcessing: false,
      });

      if (!photo?.base64) {
        Alert.alert('Error', 'No se pudo capturar la imagen. Inténtalo de nuevo.');
        return;
      }

      setTorchOn(false); // Apagar linterna antes de navegar
      setPendingScan({
        scanSource: 'camera',
        imageBase64: photo.base64,
      });
      router.push('/processing');
    } catch (err: any) {
      Alert.alert('Error de cámara', err?.message || 'No se pudo tomar la foto.');
    } finally {
      setCapturing(false);
    }
  }, [capturing, cameraPermission]);

  // ─── Galería ───────────────────────────────────────────────────────────────
  const handleOpenGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para analizar imágenes de etiquetas.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
      base64: true,
      allowsEditing: false, // false = permite seleccionar sin recortar
      allowsMultipleSelection: false,
    });

    if (result.canceled || !result.assets?.[0]?.base64) return;

    setTorchOn(false);
    setPendingScan({
      scanSource: 'camera',
      imageBase64: result.assets[0].base64!,
    });
    router.push('/processing');
  }, []);

  // ─── Análisis manual ───────────────────────────────────────────────────────
  const handleAnalyzeManual = useCallback(() => {
    const textToSend = ingredientsText.trim() || productName.trim();
    if (!textToSend) {
      Alert.alert('Campo vacío', 'Ingresa los ingredientes o el nombre del producto.');
      return;
    }
    setPendingScan({
      scanSource: 'manual',
      imageBase64: encodeTextAsBase64(textToSend),
      manualText: textToSend,
      productName: productName.trim() || undefined,
      barcode: barcodeText.trim() || undefined,
    });
    router.push('/processing');
  }, [ingredientsText, productName, barcodeText]);

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Modo cámara
  // ──────────────────────────────────────────────────────────────────────────
  if (mode === 'camera') {
    // Sin permiso concedido
    if (!cameraPermission?.granted) {
      return (
        <View style={styles.permBg}>
          <View style={[styles.permContainer, { paddingTop: insets.top + 20 }]}>
            <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
              <Path
                d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
                stroke="#5A7BFA" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
              />
              <Circle cx={12} cy={13} r={4} stroke="#5A7BFA" strokeWidth={1.5} />
            </Svg>
            <Text style={styles.permTitle}>Acceso a la cámara</Text>
            <Text style={styles.permSub}>
              AllergenSmart necesita la cámara para escanear etiquetas con Google Vision AI.
            </Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestCameraPermission} activeOpacity={0.85}>
              <Text style={styles.permBtnText}>Dar permiso</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.permBtnOutline} onPress={() => setMode('manual')} activeOpacity={0.8}>
              <Text style={styles.permBtnOutlineText}>Usar entrada manual</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Cámara activa — fullscreen sin tab bar
    return (
      <View style={styles.cameraRoot}>
        {/* Cámara real ocupa TODA la pantalla */}
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing="back"
          flash="off"                // flash al tomar foto: siempre off (usamos torch)
          enableTorch={torchOn}      // ← linterna real (ilumina mientras grabas)
        />

        {/* ── Barra superior ── */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          {/* Botón volver */}
          <TouchableOpacity style={styles.overlayBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          {/* Badge estado */}
          <View style={[styles.modeBadge, torchOn && styles.modeBadgeFlash]}>
            <View style={[styles.modeDot, { backgroundColor: torchOn ? '#FAC775' : '#24C8A0' }]} />
            <Text style={[styles.modeBadgeText, torchOn && { color: '#FAC775' }]}>
              {torchOn ? '⚡ Flash ON' : 'Cámara lista'}
            </Text>
          </View>

          {/* Botón flash / linterna */}
          <TouchableOpacity
            style={[styles.overlayBtn, torchOn && styles.overlayBtnActive]}
            onPress={() => setTorchOn((v) => !v)}
            activeOpacity={0.8}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                stroke={torchOn ? '#FAC775' : '#FFFFFF'}
                strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* ── Marco de enfoque ── */}
        <View style={styles.focusWrap} pointerEvents="none">
          <View style={[styles.focusBox, torchOn && styles.focusBoxFlash]}>
            {/* Esquinas */}
            <View style={[styles.corner, styles.cornerTL, torchOn && { borderColor: '#FAC775' }]} />
            <View style={[styles.corner, styles.cornerTR, torchOn && { borderColor: '#FAC775' }]} />
            <View style={[styles.corner, styles.cornerBL, torchOn && { borderColor: '#FAC775' }]} />
            <View style={[styles.corner, styles.cornerBR, torchOn && { borderColor: '#FAC775' }]} />
          </View>
          <Text style={[styles.focusHint, torchOn && { color: '#FAC775' }]}>
            {torchOn ? 'Flash activado · apunta a la etiqueta' : 'Centra la etiqueta de ingredientes'}
          </Text>
        </View>

        {/* ── Barra inferior de acciones ── */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
          {/* Galería */}
          <TouchableOpacity style={styles.sideActionBtn} onPress={handleOpenGallery} activeOpacity={0.8}>
            <View style={styles.sideActionIcon}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Rect x={3} y={3} width={18} height={18} rx={2} stroke="#FFFFFF" strokeWidth={1.8} />
                <Circle cx={8.5} cy={8.5} r={1.5} fill="#FFFFFF" />
                <Path d="M21 15l-5-5L5 21" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={styles.sideActionLabel}>Galería</Text>
          </TouchableOpacity>

          {/* Disparador principal */}
          <TouchableOpacity
            style={styles.shutterBtn}
            onPress={handleTakePhoto}
            activeOpacity={0.85}
            disabled={capturing}
          >
            {capturing
              ? <ActivityIndicator color="#1A2340" size="large" />
              : <View style={styles.shutterInner} />
            }
          </TouchableOpacity>

          {/* Manual */}
          <TouchableOpacity style={styles.sideActionBtn} onPress={() => setMode('manual')} activeOpacity={0.8}>
            <View style={styles.sideActionIcon}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path d="M12 20h9" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
                <Path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={styles.sideActionLabel}>Manual</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Modo manual
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.manualBg} edges={['top']}>
      <ScrollView contentContainerStyle={styles.manualScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Nav */}
        <View style={styles.manualNav}>
          <TouchableOpacity style={styles.manualBackBtn} onPress={() => setMode('camera')} activeOpacity={0.8}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.manualNavTitle}>Entrada manual</Text>
          <View style={{ width: 34 }} />
        </View>

        {/* Banner informativo */}
        <View style={styles.infoBanner}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <Circle cx={12} cy={12} r={9} stroke="#854F0B" strokeWidth={1.8} />
            <Path d="M12 8v4M12 16h.01" stroke="#854F0B" strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
          <Text style={styles.infoBannerText}>
            Usa la cámara para mayor precisión. Este modo es para cuando no puedes leer la etiqueta con la cámara.
          </Text>
        </View>

        {/* Campos */}
        <View style={styles.fields}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nombre del producto</Text>
            <View style={styles.fieldRow}>
              <TextInput
                style={styles.fieldInput}
                value={productName}
                onChangeText={setProductName}
                placeholder="Ej: Galletas María"
                placeholderTextColor={Colors.textQuaternary}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Lista de ingredientes *</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={6}
              value={ingredientsText}
              onChangeText={setIngredientsText}
              placeholder="Pega o escribe la lista de ingredientes aquí..."
              placeholderTextColor={Colors.textQuaternary}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Código de barras (opcional)</Text>
            <View style={styles.fieldRow}>
              <TextInput
                style={styles.fieldInput}
                value={barcodeText}
                onChangeText={setBarcodeText}
                placeholder="Ej: 7861000123456"
                placeholderTextColor={Colors.textQuaternary}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.manualActions}>
          <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyzeManual} activeOpacity={0.85}>
            <Text style={styles.analyzeBtnText}>Analizar con IA →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cameraBtn} onPress={() => setMode('camera')} activeOpacity={0.8}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
              <Path
                d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
                stroke={Colors.primary} strokeWidth={1.8} strokeLinecap="round"
              />
              <Circle cx={12} cy={13} r={4} stroke={Colors.primary} strokeWidth={1.8} />
            </Svg>
            <Text style={styles.cameraBtnText}>Volver a la cámara</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // ── Pantalla sin permiso ──────────────────────────────────────────────────
  permBg: {
    flex: 1,
    backgroundColor: Colors.darkBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permContainer: {
    paddingHorizontal: 36,
    alignItems: 'center',
    gap: 12,
  },
  permTitle: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: 18,
    fontWeight: '800',
    color: '#F1F5F9',
    textAlign: 'center',
    marginTop: 8,
  },
  permSub: {
    fontFamily: FontFamily.interRegular,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  permBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  permBtnText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  permBtnOutline: {
    borderRadius: 14,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  permBtnOutlineText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 13,
    color: '#94A3B8',
  },

  // ── Modo cámara ────────────────────────────────────────────────────────────
  cameraRoot: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Barra superior
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 20,
    // Degradado oscuro superior para legibilidad
    backgroundColor: 'rgba(0,0,0,0.40)',
  },
  overlayBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.50)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  overlayBtnActive: {
    backgroundColor: 'rgba(250,199,117,0.25)',
    borderColor: 'rgba(250,199,117,0.6)',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(36,200,160,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(36,200,160,0.4)',
  },
  modeBadgeFlash: {
    backgroundColor: 'rgba(250,199,117,0.18)',
    borderColor: 'rgba(250,199,117,0.45)',
  },
  modeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  modeBadgeText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 11,
    color: '#24C8A0',
    fontWeight: '700',
  },

  // Marco de enfoque
  focusWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  focusBox: {
    width: width * 0.78,
    height: height * 0.35,
  },
  focusBoxFlash: {},
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#24C8A0',
    borderRadius: 4,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  focusHint: {
    marginTop: 14,
    fontFamily: FontFamily.nunitoBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Barra inferior con botones de acción
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.60)',
    zIndex: 20,
  },
  sideActionBtn: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  sideActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideActionLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  // Botón disparador grande
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#1A2340',
  },

  // ── Modo manual ────────────────────────────────────────────────────────────
  manualBg: {
    flex: 1,
    backgroundColor: Colors.bgApp,
  },
  manualScroll: {
    paddingBottom: 40,
  },
  manualNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  manualBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualNavTitle: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '900',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.warningSurface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    marginHorizontal: 14,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoBannerText: {
    fontFamily: FontFamily.interRegular,
    fontSize: 11,
    color: '#7A4E0B',
    flex: 1,
    lineHeight: 16,
  },
  fields: {
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 16,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
    paddingLeft: 2,
  },
  fieldRow: {
    borderWidth: 1.5,
    borderColor: Colors.borderInput,
    borderRadius: 12,
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldInput: {
    fontFamily: FontFamily.interRegular,
    fontSize: 13,
    color: Colors.textPrimary,
    padding: 0,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: Colors.borderInput,
    borderRadius: 12,
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamily.interRegular,
    fontSize: 12,
    color: Colors.textPrimary,
    minHeight: 110,
  },
  manualActions: {
    paddingHorizontal: 14,
    gap: 8,
  },
  analyzeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  analyzeBtnText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cameraBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cameraBtnText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
});
