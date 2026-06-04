import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { useAppStore } from '@/store/appStore';

type ScannerState = 'idle' | 'active' | 'flashlight' | 'gallery' | 'manual';

export default function ScannerTab() {
  const router = useRouter();
  const { setActiveScan } = useAppStore();
  const [state, setState] = useState<ScannerState>('idle');
  
  // Manual Input State
  const [productName, setProductName] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [barcodeText, setBarcodeText] = useState('');
  const [manualInputFocused, setManualInputFocused] = useState<string | null>(null);

  // Animation for scanner laser line
  const laserAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (state === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      laserAnim.setValue(0);
    }
  }, [state]);

  const handleStartScan = () => {
    setState('active');
  };

  const handleFlashlightToggle = () => {
    if (state === 'flashlight') {
      setState('idle');
    } else {
      setState('flashlight');
    }
  };

  const handleAnalyzeActive = () => {
    // Set active scan to Danger matching HTML
    setActiveScan({
      name: 'Galletas Integrales NutriSnack',
      brand: 'NutriSnack',
      status: 'danger',
      confidence: 87,
      allergens: ['Gluten', 'Lácteos'],
      rawIngredients: 'aceite de girasol, sal, azúcar, gluten de trigo, emulsionante E471, leche entera, extracto de vainilla'
    });
    router.push('/processing');
  };

  const handleAnalyzeGallery = () => {
    // Set active scan to Warning B (partial) matching HTML
    setActiveScan({
      name: 'Galletas de Avena 150g',
      brand: 'OatLife',
      status: 'warning',
      warningType: 'partial',
      confidence: 68,
      allergens: ['Lácteos', 'Frutos secos'],
      rawIngredients: 'avena, aceite de coco, miel, azúcar morena, sal — [zona cortada: ~3 líneas]'
    });
    router.push('/processing');
  };

  const handleAnalyzeManual = () => {
    // Simple logic based on written text
    const text = ingredientsText.toLowerCase() + productName.toLowerCase();
    const hasGluten = text.includes('gluten') || text.includes('trigo') || text.includes('avena');
    const hasLact = text.includes('leche') || text.includes('lactosa') || text.includes('queso') || text.includes('yogur');
    const hasMani = text.includes('mani') || text.includes('cacahuate') || text.includes('nuez');

    const detected = [];
    if (hasGluten) detected.push('Gluten');
    if (hasLact) detected.push('Lácteos');
    if (hasMani) detected.push('Maní');

    const nameToUse = productName.trim() || 'Producto Manual';
    const rawToUse = ingredientsText.trim() || 'Ingredientes ingresados manualmente';

    if (detected.length > 0) {
      setActiveScan({
        name: nameToUse,
        brand: 'Manual Entry',
        status: 'danger',
        confidence: 100,
        allergens: detected,
        rawIngredients: rawToUse,
      });
    } else {
      setActiveScan({
        name: nameToUse,
        brand: 'Manual Entry',
        status: 'safe',
        confidence: 100,
        allergens: [],
        rawIngredients: rawToUse,
      });
    }
    router.push('/processing');
  };

  // Render camera mock window
  const renderCameraView = () => {
    const isDark = state === 'idle' || state === 'active' || state === 'flashlight';
    const frameColor = state === 'active' ? '#24C8A0' : state === 'flashlight' ? '#FAC775' : '#64748B';
    const gridColor = state === 'flashlight' ? 'rgba(250, 199, 117, 0.08)' : 'rgba(255, 255, 255, 0.06)';
    
    const laserY = laserAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [4, 66], // moves inside 70px height box
    });

    return (
      <View style={[styles.cameraArea, { backgroundColor: '#1A2340' }]}>
        {/* Flashlight Light effect */}
        {state === 'flashlight' && (
          <View style={styles.flashlightEffect} />
        )}

        {/* Camera Grid Lines */}
        <View style={styles.gridOverlay}>
          <View style={[styles.gridCol, { borderRightColor: gridColor, borderLeftColor: gridColor }]} />
          <View style={[styles.gridRow, { borderBottomColor: gridColor, borderTopColor: gridColor }]} />
        </View>

        {/* Scan Frame */}
        <View style={[styles.scanFrame, { borderColor: 'transparent' }]}>
          {/* Corners */}
          <View style={[styles.cornerTL, { borderTopColor: frameColor, borderLeftColor: frameColor }]} />
          <View style={[styles.cornerTR, { borderTopColor: frameColor, borderRightColor: frameColor }]} />
          <View style={[styles.cornerBL, { borderBottomColor: frameColor, borderLeftColor: frameColor }]} />
          <View style={[styles.cornerBR, { borderBottomColor: frameColor, borderRightColor: frameColor }]} />
          
          {/* Scanner laser line */}
          {state === 'active' && (
            <Animated.View style={[styles.scanLine, { backgroundColor: '#24C8A0', transform: [{ translateY: laserY }] }]} />
          )}

          {/* Simulated ingredients scan lines inside frame */}
          {(state === 'active' || state === 'flashlight') && (
            <View style={styles.ingredientsLinesMock}>
              <View style={[styles.mockLine, { width: '90%', backgroundColor: state === 'flashlight' ? '#FAC775' : '#FFFFFF' }]} />
              <View style={[styles.mockLine, { width: '75%', backgroundColor: state === 'flashlight' ? '#FAC775' : '#FFFFFF' }]} />
              <View style={[styles.mockLine, { width: '85%', backgroundColor: state === 'flashlight' ? '#FAC775' : '#FFFFFF' }]} />
              <View style={[styles.mockLine, { width: '60%', backgroundColor: state === 'flashlight' ? '#FAC775' : '#FFFFFF' }]} />
            </View>
          )}
        </View>

        {/* Bottom indicator badge inside camera */}
        <View style={styles.camLabelRow}>
          <View style={styles.camPill}>
            <View style={[styles.camPillDot, { backgroundColor: state === 'active' ? '#24C8A0' : '#8896B0' }]} />
            <Text style={styles.camPillText}>
              {state === 'active' ? 'OCR activo' : state === 'flashlight' ? 'Linterna ON' : 'Apunta a la etiqueta'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, (state === 'idle' || state === 'active' || state === 'flashlight') && styles.containerDark]}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, (state === 'idle' || state === 'active' || state === 'flashlight') && styles.backBtnDark]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={(state === 'idle' || state === 'active' || state === 'flashlight') ? '#94A3B8' : '#5A7BFA'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, (state === 'idle' || state === 'active' || state === 'flashlight') && styles.headerTitleDark]}>
          {state === 'active' ? 'Escaneando...' : state === 'gallery' ? 'Elegir imagen' : state === 'manual' ? 'Entrada manual' : 'Escanear'}
        </Text>
        
        {state === 'active' ? (
          <View style={styles.activeOcrLabel}>
            <View style={styles.activeOcrDot} />
            <Text style={styles.activeOcrText}>OCR activo</Text>
          </View>
        ) : state === 'flashlight' ? (
          <View style={styles.flashlightLabel}>
            <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#BA7517" strokeWidth="2" strokeLinecap="round">
              <Path d="M9.663 17h4.673M12 3v1M3.515 5.515l.707.707M1 13H3M20.485 5.515l-.707.707M23 13h-2" />
              <Circle cx="12" cy="13" r="4" />
            </Svg>
            <Text style={styles.flashlightText}>Linterna ON</Text>
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* VIEWPORTS / SCREENS BY STATE */}
        
        {/* 1. Camera States (Idle, Active, Flashlight) */}
        {(state === 'idle' || state === 'active' || state === 'flashlight') && (
          <View style={styles.cameraSection}>
            {renderCameraView()}
            
            <View style={styles.cameraControls}>
              {/* State feedback box */}
              {state === 'active' ? (
                <View style={styles.realtimeOcrBox}>
                  <Text style={styles.ocrBoxLabel}>Texto detectado en tiempo real</Text>
                  <Text style={styles.ocrBoxContent}>
                    ...aceite de girasol, <Text style={styles.ocrBoxHighlight}>gluten</Text>, sal, <Text style={styles.ocrBoxHighlight}>leche</Text> descremada, azúcar...
                  </Text>
                </View>
              ) : state === 'flashlight' ? (
                <View style={styles.flashlightStatusBox}>
                  <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FAC775" strokeWidth="1.8" strokeLinecap="round">
                    <Path d="M9.663 17h4.673M12 3v1M3.515 5.515l.707.707M1 13H3M20.485 5.515l-.707.707M23 13h-2" />
                    <Circle cx="12" cy="13" r="4" />
                  </Svg>
                  <Text style={styles.flashlightStatusText}>Iluminación activa · OCR mejorado</Text>
                </View>
              ) : (
                <View style={styles.ocrWaitingBox}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round">
                    <Rect x="1" y="3" width="22" height="16" rx="2" />
                    <Path d="M1 8h22M1 13h22" />
                  </Svg>
                  <Text style={styles.ocrWaitingText}>OCR esperando señal...</Text>
                  <View style={styles.ocrWaitingDot} />
                </View>
              )}

              {/* Counters Grid (Active state only) */}
              {state === 'active' && (
                <View style={styles.countersGrid}>
                  <View style={styles.counterCard}>
                    <Text style={styles.counterNum}>312</Text>
                    <Text style={styles.counterLabel}>caracteres</Text>
                  </View>
                  <View style={styles.counterCard}>
                    <Text style={[styles.counterNum, { color: Colors.warning }]}>2</Text>
                    <Text style={styles.counterLabel}>marcados</Text>
                  </View>
                  <View style={styles.counterCard}>
                    <Text style={[styles.counterNum, { color: Colors.success }]}>87%</Text>
                    <Text style={styles.counterLabel}>confianza</Text>
                  </View>
                </View>
              )}

              {/* Option Tabs (Gallery, Manual, Flashlight) */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.8}
                  onPress={() => setState('gallery')}
                >
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round">
                    <Path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                  </Svg>
                  <Text style={styles.actionBtnText}>Galería</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.8}
                  onPress={() => setState('manual')}
                >
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round">
                    <Path d="M9 11l3 3L22 4" />
                    <Path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </Svg>
                  <Text style={styles.actionBtnText}>Manual</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, state === 'flashlight' && styles.actionBtnSelected]}
                  activeOpacity={0.8}
                  onPress={handleFlashlightToggle}
                >
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={state === 'flashlight' ? '#FAC775' : '#94A3B8'} strokeWidth="1.8" strokeLinecap="round">
                    <Path d="M9.663 17h4.673M12 3v1M3.515 5.515l.707.707M1 13H3M20.485 5.515l-.707.707M23 13h-2" />
                    <Circle cx="12" cy="13" r="4" />
                  </Svg>
                  <Text style={[styles.actionBtnText, state === 'flashlight' && { color: '#FAC775' }]}>Linterna</Text>
                </TouchableOpacity>
              </View>

              {/* Main Scanner Action Button */}
              {state === 'active' ? (
                <TouchableOpacity
                  style={[styles.mainScanBtn, { backgroundColor: Colors.success }]}
                  activeOpacity={0.9}
                  onPress={handleAnalyzeActive}
                >
                  <Text style={[styles.mainScanBtnText, { color: '#04342C' }]}>Analizar ingredientes</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.mainScanBtn, state === 'flashlight' ? { backgroundColor: Colors.primary } : { backgroundColor: '#374151' }]}
                  activeOpacity={0.9}
                  onPress={handleStartScan}
                >
                  <Text style={[styles.mainScanBtnText, state === 'flashlight' ? { color: '#fff' } : { color: '#64748B' }]}>Escanear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* 2. Gallery State */}
        {state === 'gallery' && (
          <View style={styles.lightSection}>
            <View style={styles.searchBarBox}>
              <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.8" strokeLinecap="round">
                <Circle cx="11" cy="11" r="7" />
                <Path d="M21 21l-4.35-4.35" />
              </Svg>
              <Text style={styles.searchBarText}>Buscar en galería...</Text>
            </View>

            {/* Gallery grid mock */}
            <View style={styles.galleryGrid}>
              <View style={styles.gallerySquare}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8896B0" strokeWidth="1.5" strokeLinecap="round">
                  <Rect x="3" y="3" width="18" height="18" rx="2" />
                  <Circle cx="8.5" cy="8.5" r="1.5" />
                  <Path d="M21 15l-5-5L5 21" />
                </Svg>
              </View>
              <View style={styles.gallerySquare}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8896B0" strokeWidth="1.5" strokeLinecap="round">
                  <Rect x="3" y="3" width="18" height="18" rx="2" />
                  <Circle cx="8.5" cy="8.5" r="1.5" />
                  <Path d="M21 15l-5-5L5 21" />
                </Svg>
              </View>
              
              {/* Selected pasta image */}
              <View style={[styles.gallerySquare, styles.gallerySquareSelected]}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
                  <Rect x="3" y="3" width="18" height="18" rx="2" />
                  <Circle cx="8.5" cy="8.5" r="1.5" />
                  <Path d="M21 15l-5-5L5 21" />
                </Svg>
                <View style={styles.checkmarkIcon}>
                  <Svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <Path d="M2 6l3 3 5-5" />
                  </Svg>
                </View>
              </View>

              <View style={styles.gallerySquare} />
              <View style={styles.gallerySquare} />
              <View style={styles.gallerySquare} />
            </View>

            {/* Selection banner */}
            <View style={styles.selectionBanner}>
              <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#085041" strokeWidth="1.8" strokeLinecap="round">
                <Rect x="3" y="3" width="18" height="18" rx="2" />
                <Circle cx="8.5" cy="8.5" r="1.5" />
                <Path d="M21 15l-5-5L5 21" />
              </Svg>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectionTitle}>etiqueta_pasta.jpg · seleccionada</Text>
                <Text style={styles.selectionDesc}>2.1 MB · hoy 09:38</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryActionBtnLight}
              activeOpacity={0.9}
              onPress={handleAnalyzeGallery}
            >
              <Text style={styles.primaryActionBtnTextLight}>Analizar esta imagen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtnLight}
              activeOpacity={0.8}
              onPress={() => setState('idle')}
            >
              <Text style={styles.cancelBtnTextLight}>Volver a la cámara</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. Manual Input State */}
        {state === 'manual' && (
          <View style={styles.lightSection}>
            {/* Warning callout */}
            <View style={styles.manualCallout}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="1.8" strokeLinecap="round" style={{ marginTop: 2 }}>
                <Circle cx="12" cy="12" r="9" />
                <Path d="M12 8v4" />
                <Circle cx="12" cy="16" r="0.5" fill="#854F0B" />
              </Svg>
              <Text style={styles.manualCalloutText}>
                Usa esto solo si la cámara no puede leer la etiqueta
              </Text>
            </View>

            {/* Inputs Container */}
            <View style={styles.formContainer}>
              {/* Product Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nombre del producto</Text>
                <View style={[styles.formInputContainer, manualInputFocused === 'name' && styles.formInputFocused]}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={manualInputFocused === 'name' ? Colors.primary : Colors.textQuaternary} strokeWidth="1.8" strokeLinecap="round">
                    <Rect x="3" y="3" width="18" height="18" rx="2" />
                    <Path d="M9 9h6M9 12h4" />
                  </Svg>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Galletas NutriSnack..."
                    placeholderTextColor={Colors.textQuaternary}
                    value={productName}
                    onChangeText={setProductName}
                    onFocus={() => setManualInputFocused('name')}
                    onBlur={() => setManualInputFocused(null)}
                  />
                </View>
              </View>

              {/* Ingredients List */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Lista de ingredientes</Text>
                <View style={[styles.formTextareaContainer, manualInputFocused === 'ingredients' && styles.formInputFocused]}>
                  <TextInput
                    style={styles.formTextarea}
                    placeholder="Pega o escribe los ingredientes aquí..."
                    placeholderTextColor={Colors.textQuaternary}
                    value={ingredientsText}
                    onChangeText={setIngredientsText}
                    onFocus={() => setManualInputFocused('ingredients')}
                    onBlur={() => setManualInputFocused(null)}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Barcode Search */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Buscar por código de barras</Text>
                <View style={[styles.formInputContainer, manualInputFocused === 'barcode' && styles.formInputFocused]}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={manualInputFocused === 'barcode' ? Colors.primary : Colors.textQuaternary} strokeWidth="1.8" strokeLinecap="round">
                    <Path d="M4 6h2v12H4zM9 6h1v12H9zM13 6h2v12h-2zM18 6h2v12h-2z" />
                  </Svg>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ej. 7622210100283"
                    placeholderTextColor={Colors.textQuaternary}
                    value={barcodeText}
                    onChangeText={setBarcodeText}
                    onFocus={() => setManualInputFocused('barcode')}
                    onBlur={() => setManualInputFocused(null)}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryActionBtnLight}
              activeOpacity={0.9}
              onPress={handleAnalyzeManual}
            >
              <Text style={styles.primaryActionBtnTextLight}>Analizar ingredientes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtnLight}
              activeOpacity={0.8}
              onPress={() => setState('idle')}
            >
              <Text style={styles.cancelBtnTextLight}>Volver a la cámara</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
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
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnDark: {
    backgroundColor: '#1F2937',
  },
  headerTitle: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 14,
    color: '#1A2340',
  },
  headerTitleDark: {
    color: '#F1F5F9',
  },
  activeOcrLabel: {
    backgroundColor: '#24C8A0',
    borderRadius: 9,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeOcrDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  activeOcrText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  flashlightLabel: {
    backgroundColor: '#FDF6E3',
    borderRadius: 9,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flashlightText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '700',
    color: '#BA7517',
  },
  cameraSection: {
    flex: 1,
    paddingHorizontal: 12,
  },
  lightSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  cameraArea: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  flashlightEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250, 199, 117, 0.15)',
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    flexDirection: 'row',
  },
  gridCol: {
    flex: 1,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    opacity: 0.8,
  },
  gridRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '33.3%',
    bottom: '33.3%',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    opacity: 0.8,
  },
  scanFrame: {
    width: 140,
    height: 80,
    position: 'relative',
    justifyContent: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 18,
    height: 18,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderRadius: 4,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderRadius: 4,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 18,
    height: 18,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderRadius: 4,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 2,
    opacity: 0.8,
  },
  ingredientsLinesMock: {
    position: 'absolute',
    inset: 10,
    flexDirection: 'column',
    gap: 3,
    opacity: 0.4,
  },
  mockLine: {
    height: 4,
    borderRadius: 2,
  },
  camLabelRow: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  camPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  camPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  camPillText: {
    fontFamily: FontFamily.interRegular,
    fontSize: 9,
    color: '#CBD5E1',
  },
  cameraControls: {
    flexDirection: 'column',
    gap: 10,
  },
  ocrWaitingBox: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ocrWaitingText: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '700',
    fontSize: 11,
    color: '#475569',
  },
  ocrWaitingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#374151',
    marginLeft: 'auto',
  },
  realtimeOcrBox: {
    backgroundColor: '#0F2027',
    borderWidth: 1,
    borderColor: '#1A3A2A',
    borderRadius: 12,
    padding: 10,
  },
  ocrBoxLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '700',
    color: '#24C8A0',
    marginBottom: 4,
  },
  ocrBoxContent: {
    fontFamily: FontFamily.interRegular,
    fontSize: 10,
    color: '#94A3B8',
    lineHeight: 16,
  },
  ocrBoxHighlight: {
    backgroundColor: '#1A3A2A',
    color: '#24C8A0',
    fontWeight: '600',
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  flashlightStatusBox: {
    backgroundColor: '#1A1400',
    borderWidth: 1,
    borderColor: '#3A2E00',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flashlightStatusText: {
    fontFamily: FontFamily.interMedium,
    fontSize: 10,
    color: '#FAC775',
    fontWeight: '600',
  },
  countersGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  counterCard: {
    flex: 1,
    backgroundColor: '#0F1A2B',
    borderWidth: 1,
    borderColor: '#1E3A5F',
    borderRadius: 10,
    paddingVertical: 8,
    textAlign: 'center',
    alignItems: 'center',
  },
  counterNum: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 15,
    color: Colors.primary,
  },
  counterLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    color: '#334E7B',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionBtnSelected: {
    backgroundColor: '#2A2205',
    borderColor: '#FAC775',
    borderWidth: 1.5,
  },
  actionBtnText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  mainScanBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  mainScanBtnText: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 12,
  },

  // Gallery styles
  searchBarBox: {
    backgroundColor: '#EEF3FF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  searchBarText: {
    fontFamily: FontFamily.interRegular,
    fontSize: 11,
    color: '#8896B0',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 10,
  },
  gallerySquare: {
    width: '32.3%',
    aspectRatio: 1,
    backgroundColor: '#E8ECF5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gallerySquareSelected: {
    backgroundColor: '#5A7BFA',
    borderWidth: 2,
    borderColor: '#2D3A8C',
  },
  checkmarkIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    backgroundColor: '#24C8A0',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionBanner: {
    backgroundColor: Colors.successSurface,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  selectionTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.successDark,
  },
  selectionDesc: {
    fontFamily: FontFamily.interRegular,
    fontSize: 9,
    color: Colors.successMid,
  },
  primaryActionBtnLight: {
    width: '100%',
    backgroundColor: '#5A7BFA',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  primaryActionBtnTextLight: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 12,
    color: '#FFFFFF',
  },
  cancelBtnLight: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE3F0',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnTextLight: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '700',
    fontSize: 11,
    color: '#5A7BFA',
  },

  // Manual input styles
  manualCallout: {
    backgroundColor: '#FDF6E3',
    borderWidth: 1,
    borderColor: '#FAC775',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginBottom: 12,
  },
  manualCalloutText: {
    fontFamily: FontFamily.interRegular,
    fontSize: 10,
    color: '#854F0B',
    lineHeight: 14,
    flex: 1,
  },
  formContainer: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 12,
  },
  fieldGroup: {
    flexDirection: 'column',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7A99',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
    fontFamily: FontFamily.nunitoBold,
  },
  formInputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDE3F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formInputFocused: {
    borderColor: Colors.primary,
  },
  formInput: {
    flex: 1,
    fontFamily: FontFamily.interRegular,
    fontSize: 12,
    color: '#1A2340',
    padding: 0,
  },
  formTextareaContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE3F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
  },
  formTextarea: {
    flex: 1,
    fontFamily: FontFamily.interRegular,
    fontSize: 11,
    color: '#1A2340',
    padding: 0,
  },
});
