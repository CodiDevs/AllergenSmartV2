import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { useAppStore, FavoriteItem } from '@/store/appStore';
import { AlergiMascot } from '@/components/ui/AlergiMascot';

export default function ResultScreen() {
  const router = useRouter();
  const { activeScan, addFavorite, addHistoryItem, favorites } = useAppStore();

  // Fallback if no active scan
  const scan = activeScan || {
    name: 'Avena Natural Sin Gluten',
    brand: 'OatLife',
    status: 'safe' as const,
    confidence: 100,
    allergens: [],
    rawIngredients: 'copos de avena certificada, agua, sal marina, sin conservantes, sin gluten, sin lácteos, trazas: ninguna',
  };

  const isDanger = scan.status === 'danger';
  const themeColors = isDanger
    ? {
        pageBg: '#FFFAFA',
        headerText: '#791F1F',
        headerIconBg: '#FEECEC',
        badgeBg: '#F7C1C1',
        badgeText: '#501313',
        heroBg: '#FEECEC',
        mascotState: 'red' as const,
        badgeLabel: 'PELIGRO · NO CONSUMIR',
        subtitleText: `Marca: ${scan.brand} · ${scan.allergens.length} alérgenos HIGH`,
        btnBg: Colors.danger,
        btnText: '#FFFFFF',
      }
    : {
        pageBg: '#F5FFFC',
        headerText: '#085041',
        headerIconBg: '#EAF7F2',
        badgeBg: '#9FE1CB',
        badgeText: '#04342C',
        heroBg: '#EAF7F2',
        mascotState: 'green' as const,
        badgeLabel: 'SEGURO · PUEDES COMERLO',
        subtitleText: `Marca: ${scan.brand} · 0 alérgenos detectados`,
        btnBg: Colors.success,
        btnText: '#FFFFFF',
      };

  const handleBack = () => {
    router.replace('/(tabs)/scanner');
  };

  const handlePrimaryAction = () => {
    if (isDanger) {
      // Danger: View safe alternatives
      alert('Mostrando alternativas seguras libres de Gluten y Lácteos...');
    } else {
      // Safe: Add to favorites
      const isAlreadyFav = favorites.some((f) => f.name === scan.name);
      if (isAlreadyFav) {
        alert('Este producto ya está en tus favoritos');
        return;
      }
      
      const newFav: FavoriteItem = {
        id: `fav_${Date.now()}`,
        name: scan.name,
        category: 'Todos',
        detail: 'Escaneo · 0 alérgenos',
        status: 'safe',
        typeIcon: 'sprout',
      };
      addFavorite(newFav);
      
      // Also add to history as safe
      addHistoryItem({
        name: scan.name,
        brand: scan.brand,
        detail: 'Sin alérgenos · ahora',
        time: 'ahora',
        date: 'Hoy',
        status: 'safe',
        allergens: [],
        rawIngredients: scan.rawIngredients,
      });

      alert('¡Producto agregado a tus favoritos!');
      router.replace('/(tabs)/favorites');
    }
  };

  const handleSecondaryAction = () => {
    if (isDanger) {
      // Danger: Save to history
      addHistoryItem({
        name: scan.name,
        brand: scan.brand,
        detail: `${scan.allergens.join(', ')} · ahora`,
        time: 'ahora',
        date: 'Hoy',
        status: 'danger',
        allergens: scan.allergens,
        rawIngredients: scan.rawIngredients,
      });
      alert('Guardado en el historial de alertas');
      router.replace('/(tabs)/history');
    } else {
      // Safe: Share with family
      alert('Compartiendo enlace del producto seguro con tu familia...');
    }
  };

  // Hilight danger terms in the OCR raw text view
  const highlightOcrText = (text: string, dangerTerms: string[]) => {
    if (!dangerTerms || dangerTerms.length === 0) {
      return <Text style={styles.ocrFoundTxt}>{text}</Text>;
    }
    
    // Simple parsing to split by commas and highlight matched terms
    const segments = text.split(/,\s*/);
    return (
      <Text style={styles.ocrFoundTxt}>
        {segments.map((segment, index) => {
          const isDangerMatched = dangerTerms.some((term) =>
            segment.toLowerCase().includes(term.toLowerCase())
          );
          
          return (
            <React.Fragment key={index}>
              {index > 0 && <Text style={{ color: '#3A3A50' }}>, </Text>}
              {isDangerMatched ? (
                <Text style={styles.ocrTextHighlight}>{segment}</Text>
              ) : (
                <Text style={{ color: '#3A3A50' }}>{segment}</Text>
              )}
            </React.Fragment>
          );
        })}
      </Text>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.pageBg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.headerIconBtn, { backgroundColor: themeColors.headerIconBg }]}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDanger ? Colors.danger : Colors.success} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: themeColors.headerText }]}>
          Resultado
        </Text>
        
        <TouchableOpacity
          style={[styles.headerIconBtn, { backgroundColor: themeColors.headerIconBg }]}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          {isDanger ? (
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={Colors.danger} strokeWidth="2" strokeLinecap="round">
              <Path d="M18 6L6 18M6 6l12 12" />
            </Svg>
          ) : (
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={Colors.success} strokeWidth="2" strokeLinecap="round">
              <Path d="M20 6L9 17l-5-5" />
            </Svg>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.resHero, { backgroundColor: themeColors.heroBg }]}>
          <View style={styles.mascotContainer}>
            <AlergiMascot state={themeColors.mascotState} size={52} />
          </View>
          <View style={[styles.resBadge, { backgroundColor: themeColors.badgeBg }]}>
            <Text style={[styles.resBadgeText, { color: themeColors.badgeText }]}>
              {themeColors.badgeLabel}
            </Text>
          </View>
          <Text style={styles.resProduct}>{scan.name}</Text>
          <Text style={styles.resBrand}>{themeColors.subtitleText}</Text>
        </View>

        {/* OCR Box */}
        <View style={styles.ocrFound}>
          <Text style={styles.ocrFoundLabel}>Detectado por OCR en ingredientes</Text>
          {isDanger
            ? highlightOcrText(scan.rawIngredients, ['gluten', 'trigo', 'leche', 'entera'])
            : <Text style={styles.ocrFoundTxt}>{scan.rawIngredients}</Text>}
        </View>

        {/* Details list */}
        <View style={styles.resBody}>
          {isDanger ? (
            // Danger details list
            <>
              {scan.allergens.map((item, idx) => (
                <View key={idx} style={styles.allergenRow}>
                  <View style={[styles.alDot, { backgroundColor: Colors.danger }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alName, { color: Colors.dangerDark }]}>
                      {item === 'Gluten' ? 'Gluten (trigo)' : item === 'Lácteos' ? 'Lácteos (leche)' : item}
                    </Text>
                    <Text style={styles.alDesc}>
                      {item === 'Gluten'
                        ? 'Celiaquía confirmada en tu perfil'
                        : item === 'Lácteos'
                        ? 'Intolerancia severa en tu perfil'
                        : 'Alérgeno detectado en tu perfil'}
                    </Text>
                  </View>
                  <View style={[styles.alSevBadge, { backgroundColor: Colors.dangerBorder }]}>
                    <Text style={[styles.alSevBadgeText, { color: Colors.dangerBadgeText }]}>HIGH</Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            // Safe details list
            <>
              <View style={[styles.allergenRow, styles.allergenRowSafe]}>
                <View style={[styles.alDot, { backgroundColor: Colors.success }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alName, { color: Colors.successDark }]}>Sin gluten</Text>
                  <Text style={styles.alDesc}>Certificado libre de gluten</Text>
                </View>
                <View style={[styles.alSevBadge, { backgroundColor: Colors.successBorder }]}>
                  <Text style={[styles.alSevBadgeText, { color: Colors.successBadgeText }]}>OK</Text>
                </View>
              </View>

              <View style={[styles.allergenRow, styles.allergenRowSafe]}>
                <View style={[styles.alDot, { backgroundColor: Colors.success }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alName, { color: Colors.successDark }]}>Sin lácteos</Text>
                  <Text style={styles.alDesc}>No contiene derivados de leche</Text>
                </View>
                <View style={[styles.alSevBadge, { backgroundColor: Colors.successBorder }]}>
                  <Text style={[styles.alSevBadgeText, { color: Colors.successBadgeText }]}>OK</Text>
                </View>
              </View>

              <View style={[styles.allergenRow, styles.allergenRowSafe]}>
                <View style={[styles.alDot, { backgroundColor: Colors.success }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alName, { color: Colors.successDark }]}>Sin trazas</Text>
                  <Text style={styles.alDesc}>Apto para alta sensibilidad</Text>
                </View>
                <View style={[styles.alSevBadge, { backgroundColor: Colors.successBorder }]}>
                  <Text style={[styles.alSevBadgeText, { color: Colors.successBadgeText }]}>OK</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: themeColors.btnBg }]}
          activeOpacity={0.9}
          onPress={handlePrimaryAction}
        >
          <Text style={[styles.actionBtnText, { color: themeColors.btnText }]}>
            {isDanger ? 'Ver alternativas seguras' : 'Agregar a mis favoritos'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secBtn, { borderColor: isDanger ? Colors.dangerBorder : Colors.successBorder }]}
          activeOpacity={0.8}
          onPress={handleSecondaryAction}
        >
          <Text style={[styles.secBtnText, { color: isDanger ? Colors.dangerMid : Colors.successMid }]}>
            {isDanger ? 'Guardar en historial' : 'Compartir con familia'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 13,
  },
  resHero: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  mascotContainer: {
    marginBottom: 6,
  },
  resBadge: {
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  resBadgeText: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '800',
    fontSize: 10,
  },
  resProduct: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 14,
    color: '#1A2340',
    textAlign: 'center',
    marginBottom: 2,
  },
  resBrand: {
    fontFamily: FontFamily.interRegular,
    fontSize: 9,
    color: '#8896B0',
    textAlign: 'center',
  },
  ocrFound: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#F7F9FF',
    borderWidth: 1,
    borderColor: '#E2E8F5',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  ocrFoundLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    color: '#5A7BFA',
    fontWeight: '700',
    marginBottom: 2,
  },
  ocrFoundTxt: {
    fontFamily: FontFamily.interRegular,
    fontSize: 9,
    lineHeight: 14,
  },
  ocrTextHighlight: {
    backgroundColor: '#FFBCBC',
    color: '#791F1F',
    fontWeight: '700',
    borderRadius: 3,
    paddingHorizontal: 2,
  },
  resBody: {
    paddingHorizontal: 12,
    flexDirection: 'column',
    gap: 6,
    marginBottom: 8,
  },
  allergenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FEECEC',
    borderWidth: 1,
    borderColor: '#F7C1C1',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  allergenRowSafe: {
    backgroundColor: '#EAF7F2',
    borderColor: '#9FE1CB',
  },
  alDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  alName: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '700',
    fontSize: 11,
  },
  alDesc: {
    fontFamily: FontFamily.interRegular,
    fontSize: 9,
    color: '#6B7A99',
    marginTop: 1,
  },
  alSevBadge: {
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 7,
    marginLeft: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alSevBadgeText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '700',
  },
  actionBtn: {
    marginHorizontal: 12,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  actionBtnText: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '800',
    fontSize: 11,
  },
  secBtn: {
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F9FF',
    marginTop: 4,
  },
  secBtnText: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '700',
    fontSize: 10,
  },
});
