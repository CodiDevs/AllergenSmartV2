import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Animated,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { AppText as Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect, Ellipse } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import {
  useAppStore,
  selectSafeCount,
  selectDangerCount,
  selectActiveHighAlerts,
} from '@/store/appStore';
import { AlergiMascot } from '@/components/ui/AlergiMascot';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUiScale } from '@/hooks/useUiScale';

const TIPS = [
  "Siempre escanea en espacios bien iluminados para obtener la mejor precisión OCR posible.",
  "Los códigos de barras se detectan automáticamente. Usa el botón de foto para leer el texto nutricional y de ingredientes.",
  "Si la aplicación detecta un alérgeno, revisa siempre dos veces el empaque del producto."
];

function TipCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      goToNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const goToNext = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setCurrentIndex((prev) => (prev + 1) % TIPS.length);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const goToPrev = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setCurrentIndex((prev) => (prev - 1 + TIPS.length) % TIPS.length);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  return (
    <View style={styles.tipCard}>
      <View style={styles.tipIcon}>
        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#085041" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 8v4l3 3" />
        </Svg>
      </View>
      <View style={styles.tipTextContainer}>
        <Text style={styles.tipLabel}>Consejo del día</Text>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.tipDesc}>
            {TIPS[currentIndex]}
          </Text>
        </Animated.View>
      </View>
      <View style={styles.tipControls}>
        <TouchableOpacity onPress={goToPrev} style={styles.tipControlBtn}>
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#085041" strokeWidth="2" strokeLinecap="round">
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNext} style={styles.tipControlBtn}>
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#085041" strokeWidth="2" strokeLinecap="round">
            <Path d="M9 18l6-6-6-6" />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeTab() {
  const router = useRouter();
  const scale = useUiScale();
  const { allergens, history } = useAppStore();
  const { user } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  // Nombre real desde Supabase Auth
  const displayName = user?.user_metadata?.full_name || 'Bienvenido';

  // Iniciales para el avatar
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .filter(Boolean)
    .join('')
    .substring(0, 2)
    .toUpperCase() || '?';

  // Estadísticas calculadas desde el historial real
  const totalScans = history.length;
  const activeAlerts = useAppStore(selectActiveHighAlerts);
  const safeProductsCount = useAppStore(selectSafeCount);
  const preventedCount = useAppStore(selectDangerCount);

  // Historial reciente (primeros 3 items)
  const recentHistory = history.slice(0, 3);

  // ── Drop background animation ──────────────────────────────────────────────
  // A single 0→100 progress value drives 4 phases via interpolation:
  //   0 →  55 : caída  (translateY 0 → 22)
  //  55 →  68 : aplaste  (scaleX 1→1.4, scaleY 1→0.5)
  //  68 →  82 : reforma (scales back to 1)
  //  82 → 100 : sube  (translateY 22 → 0)
  const dropProgress = useSharedValue(0);

  useEffect(() => {
    dropProgress.value = withRepeat(
      withSequence(
        // Cae lentamente con aceleración de gravedad (5s)
        withTiming(100, { duration: 5000, easing: Easing.in(Easing.quad) }),
        // Pausa breve antes de reiniciar (para que no sea abrupto)
        withDelay(200, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );
  }, []);

  const dropStyle = useAnimatedStyle(() => {
    const p = dropProgress.value;
    // La gota baja hasta salir completamente del card (150px)
    const translateY = interpolate(p, [0, 100], [0, 150]);
    // Fade in rápido al inicio → visible durante la caída → fade out antes de salir
    const opacity = interpolate(p, [0, 4, 80, 100], [0, 0.1, 0.1, 0]);
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  // Allergen icons mapping
  const getAllergenIcon = (id: string, color: string) => {
    switch (id) {
      case 'gluten':
        return (
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
            <Path d="M12 3c-1.5 4-6 6-6 10a6 6 0 0012 0c0-4-4.5-6-6-10z" />
          </Svg>
        );
      case 'lacteos':
        return (
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
            <Ellipse cx={12} cy={12} rx={8} ry={5} />
            <Path d="M12 7v10M7 9.5C9 11 15 11 17 9.5M7 14.5C9 13 15 13 17 14.5" />
          </Svg>
        );
      case 'mani':
        return (
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
            <Path d="M12 3c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9z" />
            <Path d="M9 14c1-1.5 5-1.5 6 0" />
          </Svg>
        );
      case 'huevo':
        default:
        return (
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
            <Circle cx={12} cy={12} r={7} />
            <Path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" />
          </Svg>
        );
    }
  };

  const getStatusStyle = (status: 'safe' | 'warning' | 'danger') => {
    switch (status) {
      case 'danger':
        return {
          dot: Colors.danger,
          bg: Colors.dangerSurface,
          border: Colors.dangerBorder,
          text: Colors.dangerDark,
          badgeText: 'PELIGRO',
        };
      case 'warning':
        return {
          dot: Colors.warning,
          bg: Colors.warningSurface,
          border: Colors.warningBorder,
          text: Colors.warningDark,
          badgeText: 'PRECAUCIÓN',
        };
      case 'safe':
      default:
        return {
          dot: Colors.success,
          bg: Colors.successSurface,
          border: Colors.successBorder,
          text: Colors.successDark,
          badgeText: 'SEGURO',
        };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Statusbar Space Offset */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navbar */}
        <View style={styles.topnav}>
          <View style={styles.topnavLeft}>
            <Text style={styles.topnavGreeting}>Hola de nuevo,</Text>
            <Text style={styles.topnavName}>{displayName}</Text>
          </View>
          <View style={styles.topnavRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.8}
              accessibilityLabel="Notificaciones"
              onPress={() => router.push('/notifications')}
            >
              <Svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <Path d="M13.73 21a2 2 0 01-3.46 0" />
              </Svg>
              {unreadCount > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.avatarContainer, { width: 36 * scale, height: 36 * scale, borderRadius: (36 * scale) / 2 }]}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          {/* Background Drop — animated with fall+splat+reform cycle */}
          <Reanimated.View style={[styles.heroCardBg, dropStyle]}>
            <Svg width="100" height="100" viewBox="0 0 80 88">
              <Path d="M40 8 C40 8 14 32 14 50 C14 67 25 76 40 76 C55 76 66 67 66 50 C66 32 40 8 40 8Z" fill="#FFFFFF" />
            </Svg>
          </Reanimated.View>

          <View style={styles.heroText}>
            <Text style={styles.heroEyebrow}>SmartAllergen · listo para escanear</Text>
            <Text style={styles.heroTitle}>¿Qué producto deseas{'\n'}escanear?</Text>
            
            <TouchableOpacity
              style={styles.scanBtn}
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/scan')}
            >
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2.2" strokeLinecap="round">
                <Rect x="2" y="6" width="6" height="6" rx="1" />
                <Rect x="16" y="6" width="6" height="6" rx="1" />
                <Rect x="2" y="16" width="6" height="6" rx="1" />
                <Path d="M16 16h2v2h2v2M20 16h2M16 20v2" />
              </Svg>
              <Text style={styles.scanBtnText}>Escanear etiqueta</Text>
            </TouchableOpacity>
          </View>

          {/* Mini Mascot */}
          <View style={styles.mascotMiniWrapper}>
            <Svg width="36" height="40" viewBox="0 0 80 88">
              <Path d="M40 8 C40 8 14 32 14 50 C14 67 25 76 40 76 C55 76 66 67 66 50 C66 32 40 8 40 8Z" fill="white" opacity="0.9" />
              <Circle cx="33" cy="50" r="5" fill={Colors.primary} />
              <Circle cx="47" cy="50" r="5" fill={Colors.primary} />
              <Circle cx="34.5" cy="51" r="2" fill="white" />
              <Circle cx="48.5" cy="51" r="2" fill="white" />
              <Path d="M34 57 Q40 63 46 57" fill="none" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/(tabs)/history', params: { filter: 'all' } })}
          >
            <Text style={styles.statLabel}>Escaneos totales</Text>
            <Text style={[styles.statNum, { color: Colors.primary }]}>{totalScans}</Text>
            <View style={[styles.statSubContainer, { backgroundColor: '#EEF3FF' }]}>
              <Text style={[styles.statSubText, { color: '#185FA5' }]}>este mes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/(tabs)/history', params: { filter: 'danger' } })}
          >
            <Text style={styles.statLabel}>Alertas activas</Text>
            <Text style={[styles.statNum, { color: Colors.danger }]}>{activeAlerts}</Text>
            <View style={[styles.statSubContainer, { backgroundColor: Colors.dangerSurface }]}>
              <Text style={[styles.statSubText, { color: Colors.dangerDark }]}>alérgenos HIGH</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/(tabs)/history', params: { filter: 'safe' } })}
          >
            <Text style={styles.statLabel}>Productos seguros</Text>
            <Text style={[styles.statNum, { color: Colors.success }]}>{safeProductsCount}</Text>
            <View style={[styles.statSubContainer, { backgroundColor: Colors.successSurface }]}>
              <Text style={[styles.statSubText, { color: Colors.successDark }]}>guardados</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/(tabs)/history', params: { filter: 'danger' } })}
          >
            <Text style={styles.statLabel}>Peligros evitados</Text>
            <Text style={[styles.statNum, { color: Colors.warning }]}>{preventedCount}</Text>
            <View style={[styles.statSubContainer, { backgroundColor: Colors.warningSurface }]}>
              <Text style={[styles.statSubText, { color: Colors.warningDark }]}>esta semana</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Mis Alérgenos Section Header */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Mis alérgenos</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.sectionLink}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Allergens Horizontal List */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.allergensScroll}
        >
          {allergens.map((allergen) => {
            const isHigh = allergen.severity === 'HIGH';
            const iconBg = isHigh ? Colors.dangerSurface : Colors.warningSurface;
            const iconColor = isHigh ? Colors.danger : Colors.warning;
            const sevBg = isHigh ? Colors.dangerBorder : Colors.warningBorder;
            const sevColor = isHigh ? Colors.dangerBadgeText : Colors.warningBadgeText;

            return (
              <View key={allergen.id} style={styles.alChip}>
                <View style={[styles.alChipIcon, { backgroundColor: iconBg }]}>
                  {getAllergenIcon(allergen.id, iconColor)}
                </View>
                <Text style={styles.alChipName} numberOfLines={1}>
                  {allergen.name}
                </Text>
                <View style={[styles.alChipSev, { backgroundColor: sevBg }]}>
                  <Text style={[styles.alChipSevText, { color: sevColor }]}>
                    {allergen.severity}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Add Allergen Button */}
          <TouchableOpacity
            style={[styles.alChip, styles.alChipAdd]}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={[styles.alChipIcon, { backgroundColor: '#F0F3FA' }]}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2.5" strokeLinecap="round">
                <Path d="M12 5v14M5 12h14" />
              </Svg>
            </View>
            <Text style={[styles.alChipName, { color: Colors.primary }]}>Añadir</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Recent History Section Header */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Historial reciente</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={styles.sectionLink}>Ver todo</Text>
          </TouchableOpacity>
        </View>

        {/* History List */}
        <View style={styles.historyList}>
          {recentHistory.map((item) => {
            const stylesConfig = getStatusStyle(item.status);

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.histItem}
                activeOpacity={0.9}
                onPress={() => {
                  useAppStore.getState().setActiveScan({
                    name: item.name,
                    brand: item.brand,
                    status: item.status,
                    confidence: item.confidence ?? 100,
                    allergens: item.allergens,
                    rawIngredients: item.rawIngredients,
                    warningType: item.warningType,
                  });
                  if (item.status === 'warning') {
                    router.push('/warning');
                  } else {
                    router.push('/result');
                  }
                }}
              >
                <View style={[styles.histDot, { backgroundColor: stylesConfig.dot }]} />
                <View style={styles.histInfo}>
                  <Text style={styles.histName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.histDetail} numberOfLines={1}>
                    {item.detail}
                  </Text>
                </View>
                <View style={[styles.histBadge, { backgroundColor: stylesConfig.bg }]}>
                  <Text style={[styles.histBadgeText, { color: stylesConfig.text }]}>
                    {stylesConfig.badgeText}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tip of the day Card */}
        <TipCarousel />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  topnav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    paddingBottom: 10,
  },
  topnavLeft: {
    flexDirection: 'column',
  },
  topnavGreeting: {
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.md,
    color: '#8896B0',
  },
  topnavName: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 17,
    color: '#1A2340',
  },
  topnavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E24B4A',
    borderWidth: 1.5,
    borderColor: '#FAFBFF',
  },
  avatarContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#5A7BFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 13,
    color: '#FFFFFF',
  },
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#5A7BFA',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  heroCardBg: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  heroText: {
    flex: 1,
    zIndex: 1,
  },
  heroEyebrow: {
    fontFamily: FontFamily.interRegular,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    marginBottom: 3,
  },
  heroTitle: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 20,
  },
  scanBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  scanBtnText: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '800',
    fontSize: 11,
    color: '#5A7BFA',
  },
  mascotMiniWrapper: {
    flexShrink: 0,
    marginLeft: 8,
    zIndex: 1,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginVertical: 10,
  },
  sectionTitle: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontWeight: '800',
    fontSize: 13,
    color: '#1A2340',
  },
  sectionLink: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '600',
    fontSize: 11,
    color: '#5A7BFA',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF5',
    borderRadius: 14,
    padding: 12,
    width: '48.5%', // responsive 2 columns
  },
  statLabel: {
    fontFamily: FontFamily.interRegular,
    fontSize: 10,
    color: '#8896B0',
    fontWeight: '500',
    marginBottom: 4,
  },
  statNum: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 20,
    marginBottom: 4,
  },
  statSubContainer: {
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 7,
    alignSelf: 'flex-start',
  },
  statSubText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '600',
  },
  allergensScroll: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    gap: 8,
  },
  alChip: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF5',
    borderRadius: 14,
    padding: 10,
    minWidth: 62,
  },
  alChipAdd: {
    borderStyle: 'dashed',
    borderColor: '#B0BAD0',
  },
  alChipIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alChipName: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '700',
    color: '#1A2340',
  },
  alChipSev: {
    borderRadius: 20,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },
  alChipSevText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 8,
    fontWeight: '700',
  },
  historyList: {
    paddingHorizontal: 16,
    flexDirection: 'column',
    gap: 7,
    marginBottom: 4,
  },
  histItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF5',
    borderRadius: 14,
    padding: 10,
  },
  histDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  histInfo: {
    flex: 1,
  },
  histName: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '800',
    fontSize: 12,
    color: '#1A2340',
  },
  histDetail: {
    fontFamily: FontFamily.interRegular,
    fontSize: 10,
    color: '#8896B0',
    marginTop: 1,
  },
  histBadge: {
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  histBadgeText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '700',
  },
  tipCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#EAF7F2',
    borderWidth: 1,
    borderColor: '#9FE1CB',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#9FE1CB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTextContainer: {
    flex: 1,
  },
  tipLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '800',
    fontSize: 11,
    color: '#085041',
    marginBottom: 2,
  },
  tipDesc: {
    fontFamily: FontFamily.interRegular,
    fontSize: 10,
    color: '#0F6E56',
    lineHeight: 14,
  },
  tipControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'center',
    marginLeft: 4,
  },
  tipControlBtn: {
    padding: 6,
    backgroundColor: 'rgba(8,80,65,0.06)',
    borderRadius: 8,
  },
});
