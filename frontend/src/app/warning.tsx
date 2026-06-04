import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { useAppStore } from '@/store/appStore';
import { AlergiMascot } from '@/components/ui/AlergiMascot';

export default function WarningScreen() {
  const router = useRouter();
  const { activeScan } = useAppStore();

  // Fallback if no active scan
  const scan = activeScan || {
    name: 'Galletas de Avena 150g',
    brand: 'OatLife',
    status: 'warning' as const,
    warningType: 'partial' as const,
    confidence: 68,
    allergens: ['Lácteos', 'Frutos secos'],
    rawIngredients: 'avena, aceite de coco, miel, azúcar morena, sal — [zona cortada: ~3 líneas]',
  };

  const isBlurry = scan.warningType === 'blurry';

  const handleBack = () => {
    router.replace('/(tabs)/scanner');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF9F27" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Resultado</Text>
        
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF9F27" strokeWidth="1.4" strokeLinecap="round">
            <Circle cx="12" cy="12" r="9" />
            <Path d="M12 8v8M12 12h.01" />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.resHero}>
          {/* Mascot wrapper with absolute floating elements */}
          <View style={styles.mascotWrapper}>
            <AlergiMascot state="amber" size={56} />
            
            {/* Blurry state floating question marks */}
            {isBlurry && (
              <>
                <Text style={[styles.floatingQuest, { left: -10, top: 10, fontSize: 11 }]}>?</Text>
                <Text style={[styles.floatingQuest, { right: -12, top: 5, fontSize: 9, opacity: 0.7 }]}>?</Text>
                <Text style={[styles.floatingQuest, { right: -8, bottom: 8, fontSize: 7, opacity: 0.8 }]}>?</Text>
              </>
            )}
            
            {/* Partial state floating sweat drops */}
            {!isBlurry && (
              <View style={styles.sweatDrops}>
                <Svg width="20" height="20" viewBox="0 0 24 24" style={styles.sweat1}>
                  <Path d="M12 2C12 2 9 8 12 11c3-3 0-9 0-9z" fill="#FFD580" opacity={0.8} />
                </Svg>
                <Svg width="14" height="14" viewBox="0 0 24 24" style={styles.sweat2}>
                  <Path d="M12 2C12 2 9 8 12 11c3-3 0-9 0-9z" fill="#FFD580" opacity={0.6} />
                </Svg>
              </View>
            )}
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {isBlurry ? 'PRECAUCION · IMAGEN POCO CLARA' : 'PRECAUCION · NO CONFIRMADO'}
            </Text>
          </View>

          <Text style={styles.resProduct}>
            {isBlurry ? 'Producto sin identificar' : scan.name}
          </Text>
          <Text style={styles.resBrand}>
            {isBlurry ? 'No se pudo leer la etiqueta completa' : `Lectura: ${scan.confidence}% · Zona cortada en imagen`}
          </Text>
        </View>

        {/* Confidence Meter */}
        <View style={styles.confWrap}>
          <Text style={styles.confLabel}>Confianza de lectura OCR</Text>
          <View style={styles.confBarBg}>
            <View
              style={[
                styles.confBarFill,
                { width: isBlurry ? '34%' : '68%' }
              ]}
            />
          </View>
          <View style={styles.confRow}>
            <Text style={styles.confPct}>{isBlurry ? '34%' : '68%'}</Text>
            <Text style={styles.confHint}>Mínimo requerido: 75%</Text>
          </View>
        </View>

        {/* OCR Preview */}
        <View style={styles.ocrPreview}>
          <Text style={styles.ocrPreviewLabel}>
            {isBlurry ? 'Texto extraído — lectura parcial' : 'Ingredientes leídos — zona faltante'}
          </Text>
          
          {isBlurry ? (
            <View style={styles.ocrLineText}>
              <Text style={styles.txtOk}>aceite de </Text>
              <Text style={styles.txtGap}>██████</Text>
              <Text style={styles.txtOk}>, sal,</Text>
              <Text style={styles.lineBreak}>{'\n'}</Text>
              
              <Text style={styles.txtGap}>█████████</Text>
              <Text style={styles.txtOk}> azúcar,</Text>
              <Text style={styles.lineBreak}>{'\n'}</Text>
              
              <Text style={styles.txtUnk}>lec?? entera</Text>
              <Text style={styles.txtOk}>, e</Text>
              <Text style={styles.txtGap}>████</Text>
              <Text style={styles.txtOk}>...</Text>
            </View>
          ) : (
            <View style={styles.ocrLineText}>
              <Text style={styles.txtOk}>avena, aceite de coco, miel,</Text>
              <Text style={styles.lineBreak}>{'\n'}</Text>
              
              <Text style={styles.txtOk}>azúcar morena, sal —</Text>
              <Text style={styles.lineBreak}>{'\n'}</Text>
              
              <Text style={styles.txtGap}>[zona cortada: ~3 líneas]</Text>
            </View>
          )}
        </View>

        {/* Dynamic Lists */}
        {isBlurry ? (
          // Blurry State - Tips Box
          <View style={styles.tipsBox}>
            <Text style={styles.tipsLabel}>Cómo mejorar la lectura</Text>
            <View style={styles.tipRow}>
              <View style={styles.tipNum}><Text style={styles.tipNumText}>1</Text></View>
              <Text style={styles.tipTxt}>Acerca más la cámara a la etiqueta (10–15 cm)</Text>
            </View>
            <View style={styles.tipRow}>
              <View style={styles.tipNum}><Text style={styles.tipNumText}>2</Text></View>
              <Text style={styles.tipTxt}>Busca mejor iluminación, evita reflejos</Text>
            </View>
            <View style={[styles.tipRow, { marginBottom: 0 }]}>
              <View style={styles.tipNum}><Text style={styles.tipNumText}>3</Text></View>
              <Text style={styles.tipTxt}>Estabiliza el teléfono o apóyalo en una superficie</Text>
            </View>
          </View>
        ) : (
          // Partial State - Allergen checks list
          <View style={styles.resBody}>
            <View style={[styles.wRow, styles.wRowSafe]}>
              <View style={[styles.wDot, { backgroundColor: Colors.success }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.wName, { color: Colors.successDark }]}>Gluten</Text>
                <Text style={[styles.wDesc, { color: Colors.successMid }]}>No detectado en zona leída</Text>
              </View>
              <View style={[styles.wSev, { backgroundColor: Colors.successBorder }]}>
                <Text style={[styles.wSevText, { color: Colors.successBadgeText }]}>LEÍDO</Text>
              </View>
            </View>

            <View style={styles.wRow}>
              <View style={[styles.wDot, { backgroundColor: Colors.warning }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.wName}>Lácteos</Text>
                <Text style={styles.wDesc}>Zona faltante podría contenerlos</Text>
              </View>
              <View style={[styles.wSev, { backgroundColor: Colors.warningBorder }]}>
                <Text style={[styles.wSevText, { color: Colors.warningBadgeText }]}>NO CONF.</Text>
              </View>
            </View>

            <View style={styles.wRow}>
              <View style={[styles.wDot, { backgroundColor: Colors.warning }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.wName}>Frutos secos</Text>
                <Text style={styles.wDesc}>Zona faltante podría contenerlos</Text>
              </View>
              <View style={[styles.wSev, { backgroundColor: Colors.warningBorder }]}>
                <Text style={[styles.wSevText, { color: Colors.warningBadgeText }]}>NO CONF.</Text>
              </View>
            </View>
          </View>
        )}

        {/* Buttons */}
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.9}
          onPress={handleBack}
        >
          <Svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={styles.actionIcon}>
            <Path d="M14 8A6 6 0 112 8" stroke="#412402" strokeWidth="1.8" strokeLinecap="round" />
            <Path d="M14 4v4h-4" stroke="#412402" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={styles.actionBtnText}>
            {isBlurry ? 'Volver a escanear' : 'Escanear zona faltante'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secBtn}
          activeOpacity={0.8}
          onPress={handleBack}
        >
          <Text style={styles.secBtnText}>
            {isBlurry ? 'Buscar producto manualmente' : 'Buscar producto en base de datos'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },
  scrollContent: {
    paddingBottom: 40,
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
  headerIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FDF6E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 13,
    color: '#633806',
  },
  resHero: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#FDF6E3',
    marginBottom: 8,
  },
  mascotWrapper: {
    position: 'relative',
    marginBottom: 7,
  },
  floatingQuest: {
    position: 'absolute',
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    color: '#EF9F27',
  },
  sweatDrops: {
    position: 'absolute',
    inset: 0,
  },
  sweat1: {
    position: 'absolute',
    right: -10,
    top: 10,
  },
  sweat2: {
    position: 'absolute',
    right: -15,
    top: 22,
  },
  badge: {
    backgroundColor: '#FAC775',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  badgeText: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '800',
    fontSize: 10,
    color: '#412402',
  },
  resProduct: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 13,
    color: '#412402',
    textAlign: 'center',
    marginBottom: 2,
  },
  resBrand: {
    fontFamily: FontFamily.interRegular,
    fontSize: 9,
    color: '#854F0B',
    textAlign: 'center',
  },
  confWrap: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FAC775',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  confLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    color: '#854F0B',
    fontWeight: '700',
    marginBottom: 6,
  },
  confBarBg: {
    backgroundColor: '#FDF6E3',
    borderRadius: 20,
    height: 6,
    marginBottom: 4,
    width: '100%',
  },
  confBarFill: {
    height: 6,
    borderRadius: 20,
    backgroundColor: '#EF9F27',
  },
  confRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confPct: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '800',
    fontSize: 11,
    color: '#EF9F27',
  },
  confHint: {
    fontFamily: FontFamily.interRegular,
    fontSize: 9,
    color: '#BA7517',
  },
  ocrPreview: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#FDF6E3',
    borderWidth: 1,
    borderColor: '#FAC775',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  ocrPreviewLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '700',
    color: '#854F0B',
    marginBottom: 4,
  },
  ocrLineText: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  txtOk: {
    fontFamily: FontFamily.interRegular,
    fontSize: 9,
    color: '#3A3A50',
    lineHeight: 16,
  },
  txtGap: {
    fontFamily: FontFamily.interRegular,
    fontSize: 9,
    color: '#412402',
    backgroundColor: '#FAC775',
    opacity: 0.6,
    borderRadius: 3,
    paddingHorizontal: 2,
    fontWeight: '500',
    lineHeight: 16,
  },
  txtUnk: {
    fontFamily: FontFamily.interRegular,
    fontSize: 9,
    color: '#412402',
    backgroundColor: '#FAC775',
    borderRadius: 3,
    paddingHorizontal: 2,
    fontWeight: '700',
    lineHeight: 16,
  },
  lineBreak: {
    width: '100%',
  },
  tipsBox: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FAC775',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tipsLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '700',
    color: '#854F0B',
    marginBottom: 5,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  tipNum: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF9F27',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tipNumText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 8,
    fontWeight: '800',
    color: '#412402',
  },
  tipTxt: {
    fontFamily: FontFamily.interRegular,
    fontSize: 9,
    color: '#633806',
    lineHeight: 14,
    flex: 1,
  },
  resBody: {
    paddingHorizontal: 12,
    flexDirection: 'column',
    gap: 5,
    marginBottom: 8,
  },
  wRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: '#FDF6E3',
    borderWidth: 1,
    borderColor: '#FAC775',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  wRowSafe: {
    backgroundColor: '#EAF7F2',
    borderColor: '#9FE1CB',
  },
  wDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
    marginTop: 2,
  },
  wName: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '700',
    fontSize: 11,
    color: '#633806',
  },
  wDesc: {
    fontFamily: FontFamily.interRegular,
    fontSize: 9,
    color: '#854F0B',
    marginTop: 1,
    lineHeight: 14,
  },
  wSev: {
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 7,
    marginLeft: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  wSevText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '700',
  },
  actionBtn: {
    marginHorizontal: 12,
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF9F27',
    marginTop: 2,
  },
  actionIcon: {
    marginRight: 4,
  },
  actionBtnText: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '800',
    fontSize: 11,
    color: '#412402',
  },
  secBtn: {
    marginHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FDF6E3',
    borderWidth: 1,
    borderColor: '#FAC775',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  secBtnText: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '700',
    fontSize: 10,
    color: '#854F0B',
  },
});
