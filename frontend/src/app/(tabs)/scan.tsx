import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { router } from 'expo-router';
import Svg, { Path, Rect, Circle, Line, RadialGradient, Defs, Stop } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { useAppStore } from '@/store/appStore';

const { width } = Dimensions.get('window');

type ScanSubState = 'idle' | 'active_ocr' | 'flashlight' | 'gallery' | 'manual';

export default function ScanScreen() {
  const { allergens, setActiveScan, addHistoryItem } = useAppStore();
  const [subState, setSubState] = useState<ScanSubState>('idle');
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [productName, setProductName] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [barcodeText, setBarcodeText] = useState('');

  // Animation for the scanning line in Active OCR
  const scanLineAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (subState === 'active_ocr') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanLineAnim.stopAnimation();
    }
  }, [subState]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100], // Matches the height of the frame
  });

  /**
   * Cruza el texto de ingredientes con el perfil de alérgenos del usuario.
   * Devuelve los nombres de alérgenos detectados.
   */
  const detectAllergensFromText = (text: string): string[] => {
    const lowerText = text.toLowerCase();
    const detected: string[] = [];

    for (const allergen of allergens) {
      const allergenName = allergen.name.toLowerCase();
      // Busca el nombre del alérgeno directamente en el texto
      if (lowerText.includes(allergenName)) {
        detected.push(allergen.name);
      }
    }

    return detected;
  };

  const handleAnalyze = () => {
    let scan: any = null;

    if (subState === 'gallery') {
      // Galería: el backend hará OCR de la imagen seleccionada.
      // Por ahora generamos un resultado vacío listo para que el backend lo llene.
      const rawText = productName.trim() || '';
      const detectedAllergens = detectAllergensFromText(rawText);

      scan = {
        name: productName.trim() || 'Producto (galería)',
        brand: '',
        status: detectedAllergens.length > 0 ? 'danger' : 'safe',
        confidence: 90,
        allergens: detectedAllergens,
        rawIngredients: rawText || 'Pendiente de OCR',
        warningType: undefined,
      };
    } else if (subState === 'manual') {
      // Entrada manual: detectamos alérgenos cruzando con el perfil del usuario
      const combinedText = ingredientsText + ' ' + productName;
      const detectedAllergens = detectAllergensFromText(combinedText);

      scan = {
        name: productName.trim() || 'Producto Manual',
        brand: 'Entrada manual',
        status: detectedAllergens.length > 0 ? 'danger' : 'safe',
        confidence: 100,
        allergens: detectedAllergens,
        rawIngredients: ingredientsText.trim() || 'Ingredientes ingresados manualmente',
        warningType: undefined,
      };
    } else {
      // Modo cámara (idle / active_ocr / flashlight)
      // El backend procesará la imagen cuando esté implementado.
      // Por ahora avanzamos a processing con un resultado vacío.
      scan = {
        name: 'Producto escaneado',
        brand: '',
        status: 'safe',
        confidence: 0,
        allergens: [],
        rawIngredients: 'Pendiente de análisis OCR',
        warningType: undefined,
      };
    }

    // Guardar en historial local
    const now = new Date();
    const isToday = true; // siempre es hoy cuando se escanea
    addHistoryItem({
      name: scan.name,
      brand: scan.brand || '',
      detail: scan.allergens.length > 0
        ? `${scan.allergens.length} alérgeno${scan.allergens.length > 1 ? 's' : ''} detectado${scan.allergens.length > 1 ? 's' : ''}`
        : 'Sin alérgenos detectados',
      time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      date: 'Hoy',
      status: scan.status,
      confidence: scan.confidence,
      allergens: scan.allergens,
      rawIngredients: scan.rawIngredients,
      warningType: scan.warningType,
    });

    setActiveScan(scan);
    router.push('/processing');
  };

  const isDarkMode = subState === 'idle' || subState === 'active_ocr' || subState === 'flashlight';
  const bgColor = isDarkMode ? Colors.darkBg : Colors.bgApp;
  const textColor = isDarkMode ? Colors.darkText : Colors.textPrimary;
  const secondaryTextColor = isDarkMode ? Colors.darkTextSecondary : Colors.textSecondary;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navigation Bar */}
        <View style={styles.nv}>
          <TouchableOpacity
            style={[styles.ib, isDarkMode && styles.ibDark]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M10 3L5 8l5 5M5 8h14"
                stroke={isDarkMode ? '#94A3B8' : Colors.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <Text style={[styles.nvTitle, isDarkMode && styles.nvTitleDark]}>
            {subState === 'active_ocr'
              ? 'Escaneando...'
              : subState === 'gallery'
              ? 'Elegir imagen'
              : subState === 'manual'
              ? 'Entrada manual'
              : 'Escanear'}
          </Text>

          {subState === 'active_ocr' && (
            <View style={styles.ocrActiveBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.ocrActiveBadgeText}>OCR activo</Text>
            </View>
          )}

          {subState === 'flashlight' && (
            <View style={styles.flashlightBadge}>
              <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9.663 17h4.673M12 3v1M3.515 5.515l.707.707M1 13H3M20.485 5.515l-.707.707M23 13h-2M6.343 17.657l-.707.707M17.657 17.657l.707.707"
                  stroke="#BA7517"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                <Circle cx={12} cy={13} r={4} stroke="#BA7517" strokeWidth={2} />
              </Svg>
              <Text style={styles.flashlightBadgeText}>Linterna ON</Text>
            </View>
          )}

          {subState !== 'active_ocr' && subState !== 'flashlight' && <View style={{ width: 34 }} />}
        </View>

        {/* ─── CAMERA / PREVIEW SECTION (Dark states) ─── */}
        {isDarkMode && (
          <View style={styles.camContainer}>
            {/* Camera Area Box */}
            <View
              style={[
                styles.camArea,
                subState === 'flashlight' && { backgroundColor: Colors.flashBg },
              ]}
            >
              {/* Radial flashlight lighting gradient simulation */}
              {subState === 'flashlight' && (
                <View style={StyleSheet.absoluteFill}>
                  <Svg width="100%" height="100%">
                    <Defs>
                      <RadialGradient id="grad" cx="50%" cy="0%" rx="50%" ry="70%">
                        <Stop offset="0%" stopColor="#FAC775" stopOpacity="0.18" />
                        <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                      </RadialGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#grad)" />
                  </Svg>
                </View>
              )}

              {/* Grid Layout overlay */}
              <View style={[styles.gridOverlay, { opacity: subState === 'flashlight' ? 0.08 : 0.06 }]}>
                <View style={[styles.gridCell, { borderRightWidth: 1, borderBottomWidth: 1, borderColor: subState === 'flashlight' ? '#FAC775' : '#FFFFFF' }]} />
                <View style={[styles.gridCell, { borderRightWidth: 1, borderBottomWidth: 1, borderColor: subState === 'flashlight' ? '#FAC775' : '#FFFFFF' }]} />
                <View style={[styles.gridCell, { borderBottomWidth: 1, borderColor: subState === 'flashlight' ? '#FAC775' : '#FFFFFF' }]} />
                <View style={[styles.gridCell, { borderRightWidth: 1, borderBottomWidth: 1, borderColor: subState === 'flashlight' ? '#FAC775' : '#FFFFFF' }]} />
                <View style={[styles.gridCell, { borderRightWidth: 1, borderBottomWidth: 1, borderColor: subState === 'flashlight' ? '#FAC775' : '#FFFFFF' }]} />
                <View style={[styles.gridCell, { borderBottomWidth: 1, borderColor: subState === 'flashlight' ? '#FAC775' : '#FFFFFF' }]} />
                <View style={[styles.gridCell, { borderRightWidth: 1, borderColor: subState === 'flashlight' ? '#FAC775' : '#FFFFFF' }]} />
                <View style={[styles.gridCell, { borderRightWidth: 1, borderColor: subState === 'flashlight' ? '#FAC775' : '#FFFFFF' }]} />
                <View style={{ flex: 1 }} />
              </View>

              {/* Scanning Target Frame */}
              <View style={styles.targetFrame}>
                {/* Corners */}
                <View
                  style={[
                    styles.cornerTL,
                    {
                      borderColor:
                        subState === 'active_ocr'
                          ? Colors.success
                          : subState === 'flashlight'
                          ? '#FAC775'
                          : '#64748B',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.cornerTR,
                    {
                      borderColor:
                        subState === 'active_ocr'
                          ? Colors.success
                          : subState === 'flashlight'
                          ? '#FAC775'
                          : '#64748B',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.cornerBL,
                    {
                      borderColor:
                        subState === 'active_ocr'
                          ? Colors.success
                          : subState === 'flashlight'
                          ? '#FAC775'
                          : '#64748B',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.cornerBR,
                    {
                      borderColor:
                        subState === 'active_ocr'
                          ? Colors.success
                          : subState === 'flashlight'
                          ? '#FAC775'
                          : '#64748B',
                    },
                  ]}
                />

                {/* Simulated ingredients scan text blocks */}
                {subState === 'active_ocr' && (
                  <View style={styles.simulatedTextLines}>
                    <View style={styles.textLine1} />
                    <View style={styles.textLine2} />
                    <View style={styles.textLine3} />
                    <View style={styles.textLine4} />
                  </View>
                )}

                {/* Animated Scanner Laser Bar */}
                {subState === 'active_ocr' && (
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        transform: [{ translateY }],
                        backgroundColor: Colors.success,
                      },
                    ]}
                  />
                )}
                {subState === 'flashlight' && (
                  <View style={[styles.scanLineStatic, { backgroundColor: '#FAC775' }]} />
                )}
              </View>

              {/* Status Hint */}
              <View style={styles.scanHintContainer}>
                <Text
                  style={[
                    styles.scanHintText,
                    subState === 'active_ocr' && { color: Colors.success },
                    subState === 'flashlight' && { color: '#FAC775' },
                  ]}
                >
                  {subState === 'active_ocr'
                    ? 'Detectando texto...'
                    : subState === 'flashlight'
                    ? 'Linterna encendida · mejor lectura'
                    : 'Apunta a la etiqueta'}
                </Text>
              </View>
            </View>

            {/* OCR Live Text Overlay */}
            {subState === 'active_ocr' ? (
              <View style={styles.ocrLivePanel}>
                <Text style={styles.ocrLiveLabel}>Texto detectado en tiempo real</Text>
                <Text style={styles.ocrLiveContent}>
                  ...aceite de girasol,{' '}
                  <Text style={styles.ocrHighlight}>gluten</Text>, sal,{' '}
                  <Text style={styles.ocrHighlight}>leche</Text> descremada, azúcar...
                </Text>
              </View>
            ) : (
              <View style={[styles.ocrLivePanel, styles.ocrLivePanelIdle]}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Rect x={1} y={3} width={22} height={16} rx={2} stroke="#475569" strokeWidth={1.8} />
                  <Path d="M1 8h22M1 13h22" stroke="#475569" strokeWidth={1.8} />
                </Svg>
                <Text style={styles.ocrLiveLabelIdle}>OCR esperando señal...</Text>
                <View style={styles.idleDot} />
              </View>
            )}

            {/* Stats Row */}
            {subState === 'active_ocr' && (
              <View style={styles.scanStatsRow}>
                <View style={styles.scanStatCard}>
                  <Text style={styles.scanStatNumber}>312</Text>
                  <Text style={styles.scanStatLabel}>caracteres</Text>
                </View>
                <View style={styles.scanStatCard}>
                  <Text style={[styles.scanStatNumber, { color: Colors.warning }]}>2</Text>
                  <Text style={styles.scanStatLabel}>marcados</Text>
                </View>
                <View style={styles.scanStatCard}>
                  <Text style={[styles.scanStatNumber, { color: Colors.success }]}>87%</Text>
                  <Text style={styles.scanStatLabel}>confianza</Text>
                </View>
              </View>
            )}

            {/* Action Bar */}
            <View style={styles.cameraActionsRow}>
              <TouchableOpacity
                style={styles.actionIconButton}
                onPress={() => setSubState('gallery')}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Rect x={3} y={3} width={18} height={18} rx={2} stroke="#94A3B8" strokeWidth={1.8} />
                  <Circle cx={8.5} cy={8.5} r={1.5} stroke="#94A3B8" strokeWidth={1.8} />
                  <Path d="M21 15l-5-5L5 21" stroke="#94A3B8" strokeWidth={1.8} />
                </Svg>
                <Text style={styles.actionIconLabel}>Galería</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionIconButton}
                onPress={() => setSubState('manual')}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M9 11l3 3L22 4" stroke="#94A3B8" strokeWidth={1.8} />
                  <Path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#94A3B8" strokeWidth={1.8} />
                </Svg>
                <Text style={styles.actionIconLabel}>Manual</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionIconButton,
                  subState === 'flashlight' && { backgroundColor: '#2A2205', borderColor: '#FAC775', borderWidth: 1 },
                ]}
                onPress={() => setSubState(subState === 'flashlight' ? 'idle' : 'flashlight')}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9.663 17h4.673M12 3v1M3.515 5.515l.707.707M1 13H3M20.485 5.515l-.707.707M23 13h-2M6.343 17.657l-.707.707M17.657 17.657l.707.707"
                    stroke={subState === 'flashlight' ? '#FAC775' : '#94A3B8'}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />
                  <Circle cx={12} cy={13} r={4} stroke={subState === 'flashlight' ? '#FAC775' : '#94A3B8'} strokeWidth={1.8} />
                </Svg>
                <Text style={[styles.actionIconLabel, subState === 'flashlight' && { color: '#FAC775' }]}>Linterna</Text>
              </TouchableOpacity>
            </View>

            {/* Trigger Button */}
            <TouchableOpacity
              style={[
                styles.primaryScanBtn,
                subState === 'active_ocr'
                  ? { backgroundColor: Colors.success }
                  : subState === 'flashlight'
                  ? { backgroundColor: Colors.primary }
                  : { backgroundColor: '#374151' },
              ]}
              onPress={subState === 'active_ocr' ? handleAnalyze : () => setSubState('active_ocr')}
            >
              <Text
                style={[
                  styles.primaryScanBtnText,
                  subState === 'active_ocr' ? { color: '#04342C' } : { color: '#FFFFFF' },
                ]}
              >
                {subState === 'active_ocr' ? 'Analizar ingredientes' : 'Escanear'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── GALLERY PICKER SECTION (Light state) ─── */}
        {subState === 'gallery' && (
          <View style={styles.lightSection}>
            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Circle cx={11} cy={11} r={7} stroke={Colors.primary} strokeWidth={2} />
                <Path d="M21 21l-4.35-4.35" stroke={Colors.primary} strokeWidth={2} />
              </Svg>
              <Text style={styles.searchText}>Buscar en galería...</Text>
            </View>

            {/* Photo Grid */}
            <View style={styles.photoGrid}>
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.photoGridCell,
                    selectedPhoto === idx && styles.photoGridCellSelected,
                  ]}
                  onPress={() => setSelectedPhoto(idx)}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Rect x={3} y={3} width={18} height={18} rx={2} stroke={selectedPhoto === idx ? '#FFFFFF' : '#8896B0'} strokeWidth={1.5} />
                    <Circle cx={8.5} cy={8.5} r={1.5} fill={selectedPhoto === idx ? '#FFFFFF' : '#8896B0'} />
                    <Path d="M21 15l-5-5-11 11" stroke={selectedPhoto === idx ? '#FFFFFF' : '#8896B0'} strokeWidth={1.5} />
                  </Svg>
                  {selectedPhoto === idx && (
                    <View style={styles.checkmarkIcon}>
                      <Svg width={8} height={8} viewBox="0 0 12 12" fill="none">
                        <Path d="M2 6l3 3 5-5" stroke="white" strokeWidth={2} strokeLinecap="round" />
                      </Svg>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Selection Card */}
            <View style={styles.selectionCard}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Rect x={3} y={3} width={18} height={18} rx={2} stroke={Colors.successMid} strokeWidth={1.8} />
                <Circle cx={8.5} cy={8.5} r={1.5} stroke={Colors.successMid} strokeWidth={1.8} />
                <Path d="M21 15l-5-5-11 11" stroke={Colors.successMid} strokeWidth={1.8} />
              </Svg>
              <View style={styles.selectionCardTextContainer}>
                <Text style={styles.selectionCardTitle}>etiqueta_pasta.jpg · seleccionada</Text>
                <Text style={styles.selectionCardSub}>2.1 MB · hoy 09:38</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.lightActionBtn} onPress={handleAnalyze}>
              <Text style={styles.lightActionBtnText}>Analizar esta imagen</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── MANUAL ENTRY SECTION (Light state) ─── */}
        {subState === 'manual' && (
          <View style={styles.lightSection}>
            {/* Warning Banner */}
            <View style={styles.warningBanner}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={styles.warningBannerIcon}>
                <Circle cx={12} cy={12} r={9} stroke="#854F0B" strokeWidth={1.8} />
                <Path d="M12 8v4" stroke="#854F0B" strokeWidth={1.8} />
                <Circle cx={12} cy={16} r={0.5} fill="#854F0B" />
              </Svg>
              <Text style={styles.warningBannerText}>
                Usa esto solo si la cámara no puede leer la etiqueta
              </Text>
            </View>

            {/* Fields */}
            <View style={styles.fieldsContainer}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nombre del producto</Text>
                <View style={[styles.fieldInputWrapper, { borderColor: Colors.primary }]}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Rect x={3} y={3} width={18} height={18} rx={2} stroke={Colors.primary} strokeWidth={1.8} />
                    <Path d="M9 9h6M9 12h4" stroke={Colors.primary} strokeWidth={1.8} />
                  </Svg>
                  <TextInput
                    style={styles.fieldInput}
                    value={productName}
                    onChangeText={setProductName}
                  />
                  <View style={styles.blinkingCursor} />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Lista de ingredientes</Text>
                <View style={[styles.fieldInputWrapper, styles.textAreaWrapper]}>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={4}
                    value={ingredientsText}
                    onChangeText={setIngredientsText}
                    placeholder="Pega o escribe los ingredientes aquí..."
                    placeholderTextColor={Colors.textQuaternary}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Buscar por código de barras</Text>
                <View style={styles.fieldInputWrapper}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path d="M4 6h2v12H4zM9 6h1v12H9zM13 6h2v12h-2zM18 6h2v12h-2z" stroke="#B0BAD0" strokeWidth={1.8} />
                  </Svg>
                  <TextInput
                    style={[styles.fieldInput, { color: Colors.textSecondary }]}
                    value={barcodeText}
                    onChangeText={setBarcodeText}
                  />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.manualActions}>
              <TouchableOpacity style={styles.lightActionBtn} onPress={handleAnalyze}>
                <Text style={styles.lightActionBtnText}>Analizar ingredientes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryOutlineBtn}
                onPress={() => setSubState('idle')}
              >
                <Text style={styles.secondaryOutlineBtnText}>Volver a la cámara</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  nv: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  ib: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ibDark: {
    backgroundColor: Colors.darkSurface,
  },
  nvTitle: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    fontWeight: '900',
  },
  nvTitleDark: {
    color: '#F1F5F9',
  },
  ocrActiveBadge: {
    backgroundColor: Colors.success,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  ocrActiveBadgeText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.xs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  flashlightBadge: {
    backgroundColor: Colors.warningSurface,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flashlightBadgeText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.xs,
    color: '#BA7517',
    fontWeight: '700',
  },

  // State Selector
  stateSelector: {
    paddingHorizontal: 14,
    marginVertical: 10,
    gap: 4,
  },
  selectorLabel: {
    fontFamily: FontFamily.interSemiBold,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  selectorScroll: {
    flexDirection: 'row',
  },
  selectorBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.primarySurface,
    marginRight: 6,
  },
  selectorBtnDark: {
    backgroundColor: Colors.darkSurface,
  },
  selectorBtnActive: {
    backgroundColor: Colors.primary,
  },
  selectorBtnText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  selectorBtnTextActive: {
    color: '#FFFFFF',
  },

  // Dark states camera container
  camContainer: {
    paddingHorizontal: 14,
    gap: 8,
  },
  camArea: {
    backgroundColor: '#1A2340',
    borderRadius: 16,
    height: 160,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  gridCell: {
    width: '33.33%',
    height: '33.33%',
  },
  targetFrame: {
    width: 140,
    height: 80,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 18,
    height: 18,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 18,
    height: 18,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 1.5,
    opacity: 0.9,
  },
  scanLineStatic: {
    position: 'absolute',
    top: 40,
    left: 4,
    right: 4,
    height: 1.5,
    opacity: 0.8,
  },
  simulatedTextLines: {
    position: 'absolute',
    inset: 10,
    gap: 3,
    opacity: 0.4,
  },
  textLine1: { height: 4, backgroundColor: '#94A3B8', borderRadius: 2, width: '90%' },
  textLine2: { height: 4, backgroundColor: '#94A3B8', borderRadius: 2, width: '70%' },
  textLine3: { height: 4, backgroundColor: '#94A3B8', borderRadius: 2, width: '85%' },
  textLine4: { height: 4, backgroundColor: '#94A3B8', borderRadius: 2, width: '55%' },

  scanHintContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanHintText: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: FontSize.xs,
    color: '#64748B',
    fontFamily: FontFamily.interRegular,
  },

  // OCR Live text details
  ocrLivePanel: {
    backgroundColor: '#0F2027',
    borderWidth: 1,
    borderColor: '#1A3A2A',
    borderRadius: 12,
    padding: 10,
  },
  ocrLivePanelIdle: {
    backgroundColor: Colors.darkSurface,
    borderColor: Colors.darkBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  ocrLiveLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: '700',
    marginBottom: 4,
  },
  ocrLiveLabelIdle: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.base,
    color: '#475569',
    fontWeight: '700',
  },
  ocrLiveContent: {
    fontSize: FontSize.sm,
    color: '#94A3B8',
    lineHeight: 16,
    fontFamily: FontFamily.interRegular,
  },
  ocrHighlight: {
    backgroundColor: '#1A3A2A',
    color: Colors.success,
    borderRadius: 3,
    paddingHorizontal: 3,
    fontWeight: '600',
  },
  idleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#374151',
    marginLeft: 'auto',
  },

  // Stats Grid Scanner
  scanStatsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  scanStatCard: {
    flex: 1,
    backgroundColor: '#0F1A2B',
    borderWidth: 1,
    borderColor: '#1E3A5F',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  scanStatNumber: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: FontSize.lg,
    color: Colors.primary,
    fontWeight: '900',
  },
  scanStatLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.xxs,
    color: '#334E7B',
    fontWeight: '600',
  },

  // Camera Actions Bar
  cameraActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  actionIconButton: {
    flex: 1,
    backgroundColor: Colors.darkSurface,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    borderRadius: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionIconLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.sm,
    color: '#94A3B8',
    fontWeight: '700',
  },

  primaryScanBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryScanBtnText: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: FontSize.base,
    fontWeight: '900',
  },

  // ─── LIGHT SECTION (Gallery / Manual) ───
  lightSection: {
    paddingHorizontal: 14,
    gap: 8,
  },

  // Gallery Picker
  searchBar: {
    backgroundColor: '#EEF3FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  searchText: {
    fontSize: FontSize.base,
    color: Colors.textTertiary,
    fontFamily: FontFamily.interRegular,
  },
  photoGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  photoGridCell: {
    width: (width - 40) / 3,
    aspectRatio: 1,
    backgroundColor: '#E8ECF5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  photoGridCellSelected: {
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.primaryDark,
  },
  checkmarkIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCard: {
    backgroundColor: Colors.successSurface,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionCardTextContainer: {
    flex: 1,
  },
  selectionCardTitle: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: FontSize.base,
    color: Colors.successDark,
    fontWeight: '800',
  },
  selectionCardSub: {
    fontSize: FontSize.xs,
    color: Colors.successMid,
  },
  lightActionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  lightActionBtnText: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: FontSize.base,
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // Manual Entry Form
  warningBanner: {
    backgroundColor: Colors.warningSurface,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    gap: 7,
  },
  warningBannerIcon: {
    flexShrink: 0,
    marginTop: 1,
  },
  warningBannerText: {
    fontSize: FontSize.sm,
    color: Colors.warningMid,
    lineHeight: 14,
    flex: 1,
    fontFamily: FontFamily.interRegular,
  },
  fieldsContainer: {
    gap: 8,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  fieldInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.borderInput,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blinkingCursor: {
    width: 1.5,
    height: 14,
    backgroundColor: Colors.primary,
  },
  fieldInput: {
    flex: 1,
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    padding: 0,
  },
  textAreaWrapper: {
    height: 80,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  textArea: {
    flex: 1,
    width: '100%',
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    padding: 0,
    textAlignVertical: 'top',
  },
  manualActions: {
    gap: 6,
    marginTop: 4,
  },
  secondaryOutlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryOutlineBtnText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '700',
  },
});
