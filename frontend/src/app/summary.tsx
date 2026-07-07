import React, { useMemo } from 'react';
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
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import {
  useAppStore,
  selectSafeCount,
  selectDangerCount,
  selectWarningCount,
} from '@/store/appStore';
import { useAuthStore } from '@/stores/authStore';
import { AlergiMascot } from '@/components/ui/AlergiMascot';

// ─── Donut Chart Component ──────────────────────────────────────────────────
interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

function DonutChart({ segments, size = 160 }: { segments: DonutSegment[]; size?: number }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 14, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: FontFamily.nunitoBlack, fontSize: 28, color: Colors.textPrimary }}>0</Text>
          <Text style={{ fontFamily: FontFamily.interRegular, fontSize: 11, color: Colors.textTertiary }}>escaneos</Text>
        </View>
      </View>
    );
  }

  const radius = (size / 2) - 14;
  const center = size / 2;
  const strokeWidth = 28;

  // Build arcs
  let startAngle = -90; // Start from top
  const arcs = segments
    .filter(s => s.value > 0)
    .map((seg) => {
      const angle = (seg.value / total) * 360;
      const endAngle = startAngle + angle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

      startAngle = endAngle;
      return { d, color: seg.color, key: seg.label };
    });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <Circle cx={center} cy={center} r={radius} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
        {/* Segments */}
        {arcs.map((arc) => (
          <Path
            key={arc.key}
            d={arc.d}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        ))}
      </Svg>
      {/* Center text */}
      <View style={StyleSheet.absoluteFill as any}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: FontFamily.nunitoBlack, fontSize: 30, color: Colors.textPrimary }}>{total}</Text>
          <Text style={{ fontFamily: FontFamily.interRegular, fontSize: 11, color: Colors.textTertiary }}>escaneos</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function SummaryScreen() {
  const router = useRouter();
  const { history, allergens } = useAppStore();
  const { user } = useAuthStore();

  const safeCount = useAppStore(selectSafeCount);
  const dangerCount = useAppStore(selectDangerCount);
  const warningCount = useAppStore(selectWarningCount);
  const totalScans = history.length;

  const userName = user?.user_metadata?.full_name || 'Usuario';

  // ─── Top allergens found across all scans ─────────────────────────────────
  const topAllergens = useMemo(() => {
    const freq: Record<string, number> = {};
    history.forEach((item) => {
      (item.allergens || []).forEach((a) => {
        const name = a.trim().toLowerCase();
        if (name) freq[name] = (freq[name] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
      }));
  }, [history]);

  // ─── Recent danger items ──────────────────────────────────────────────────
  const recentDangers = useMemo(
    () => history.filter((h) => h.status === 'danger').slice(0, 3),
    [history]
  );

  // ─── Protection message ───────────────────────────────────────────────────
  const protectionMessage = useMemo(() => {
    if (totalScans === 0) return '¡Empieza a escanear productos para ver tus estadísticas!';
    if (dangerCount === 0 && totalScans > 0) return `¡Excelente! Has escaneado ${totalScans} producto${totalScans !== 1 ? 's' : ''} y todos han sido seguros.`;
    if (dangerCount > 0) return `SmartAllergen te ha protegido de ${dangerCount} producto${dangerCount !== 1 ? 's' : ''} con alérgenos. ¡Sigue escaneando!`;
    return `Has escaneado ${totalScans} productos este mes.`;
  }, [totalScans, dangerCount]);

  // Donut data
  const donutSegments: DonutSegment[] = [
    { value: safeCount, color: Colors.success, label: 'Seguros' },
    { value: warningCount, color: Colors.warning, label: 'Precaución' },
    { value: dangerCount, color: Colors.danger, label: 'Peligrosos' },
  ];

  // Safe percentage
  const safePercent = totalScans > 0 ? Math.round((safeCount / totalScans) * 100) : 0;

  // Max count for bar charts
  const maxAllergenCount = topAllergens.length > 0 ? topAllergens[0].count : 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2" strokeLinecap="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Estadísticas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── PROTECTION CARD ─── */}
        <View style={styles.protectionCard}>
          <View style={styles.protectionLeft}>
            <AlergiMascot state={dangerCount > 0 ? 'green' : 'blue'} size={56} />
          </View>
          <View style={styles.protectionRight}>
            <Text style={styles.protectionTitle}>
              {dangerCount > 0 ? '¡Buen trabajo!' : '¡Todo en orden!'}
            </Text>
            <Text style={styles.protectionMsg}>{protectionMessage}</Text>
          </View>
        </View>

        {/* ─── DONUT CHART SECTION ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de Escaneos</Text>
          <View style={styles.donutCard}>
            <DonutChart segments={donutSegments} size={160} />
            <View style={styles.donutLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.legendLabel}>Seguros</Text>
                <Text style={styles.legendValue}>{safeCount}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                <Text style={styles.legendLabel}>Precaución</Text>
                <Text style={styles.legendValue}>{warningCount}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
                <Text style={styles.legendLabel}>Peligrosos</Text>
                <Text style={styles.legendValue}>{dangerCount}</Text>
              </View>
            </View>
          </View>

          {/* Safe percentage highlight */}
          {totalScans > 0 && (
            <View style={styles.safePercentCard}>
              <Text style={styles.safePercentValue}>{safePercent}%</Text>
              <Text style={styles.safePercentLabel}>
                de tus productos escaneados han sido seguros
              </Text>
            </View>
          )}
        </View>

        {/* ─── TOP ALLERGENS ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alérgenos Más Encontrados</Text>
          {topAllergens.length === 0 ? (
            <View style={styles.emptyBox}>
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round">
                <Circle cx="11" cy="11" r="8" />
                <Path d="M21 21l-4.35-4.35" />
              </Svg>
              <Text style={styles.emptyText}>
                Aún no se han detectado alérgenos.{'\n'}Escanea más productos para ver estadísticas.
              </Text>
            </View>
          ) : (
            <View style={styles.barChartCard}>
              {topAllergens.map((item, idx) => {
                const pct = (item.count / maxAllergenCount) * 100;
                return (
                  <View key={idx} style={styles.barRow}>
                    <Text style={styles.barLabel}>{item.name}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.max(pct, 8)}%`,
                            backgroundColor:
                              idx === 0 ? Colors.danger
                              : idx === 1 ? Colors.warning
                              : Colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barCount}>
                      {item.count}x
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ─── RECENT DANGERS ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimas Alertas</Text>
          {recentDangers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round">
                <Path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
                <Path d="M9 12l2 2 4-4" />
              </Svg>
              <Text style={[styles.emptyText, { color: '#059669' }]}>
                ¡No se han detectado productos peligrosos!{'\n'}Tu perfil está protegido.
              </Text>
            </View>
          ) : (
            <View style={styles.dangerList}>
              {recentDangers.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.dangerItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    useAppStore.getState().setActiveScan({
                      name: item.name,
                      brand: item.brand,
                      status: item.status,
                      confidence: item.confidence || 0,
                      allergens: item.allergens,
                      rawIngredients: item.rawIngredients,
                    });
                    router.push('/result');
                  }}
                >
                  <View style={styles.dangerDot}>
                    <AlergiMascot state="red" size={28} />
                  </View>
                  <View style={styles.dangerInfo}>
                    <Text style={styles.dangerName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.dangerDetail}>
                      {item.allergens?.join(', ') || 'Alérgeno detectado'} · {item.time}
                    </Text>
                  </View>
                  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B0BAD0" strokeWidth="2">
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ─── PROFILE ALLERGENS CARD ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu Perfil de Alergias</Text>
          <View style={styles.profileAllergenCard}>
            <View style={styles.profileAllergenRow}>
              <View style={[styles.profileAllergenBadge, { backgroundColor: Colors.dangerSurface }]}>
                <Text style={[styles.profileAllergenBadgeNum, { color: Colors.danger }]}>
                  {allergens.filter(a => a.severity === 'HIGH').length}
                </Text>
              </View>
              <Text style={styles.profileAllergenLabel}>Severidad Alta</Text>
            </View>
            <View style={styles.profileAllergenDivider} />
            <View style={styles.profileAllergenRow}>
              <View style={[styles.profileAllergenBadge, { backgroundColor: Colors.warningSurface }]}>
                <Text style={[styles.profileAllergenBadgeNum, { color: Colors.warning }]}>
                  {allergens.filter(a => a.severity === 'MED').length}
                </Text>
              </View>
              <Text style={styles.profileAllergenLabel}>Severidad Media</Text>
            </View>
            <View style={styles.profileAllergenDivider} />
            <View style={styles.profileAllergenRow}>
              <View style={[styles.profileAllergenBadge, { backgroundColor: Colors.successSurface }]}>
                <Text style={[styles.profileAllergenBadgeNum, { color: Colors.success }]}>
                  {allergens.filter(a => a.severity === 'LOW').length}
                </Text>
              </View>
              <Text style={styles.profileAllergenLabel}>Severidad Baja</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editProfileBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.editProfileBtnText}>Editar perfil de alergias</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgApp,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // ─── Protection Card ───
  protectionCard: {
    flexDirection: 'row',
    backgroundColor: '#EEF3FF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#D6E4FF',
  },
  protectionLeft: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5A7BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  protectionRight: {
    flex: 1,
  },
  protectionTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 17,
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  protectionMsg: {
    fontFamily: FontFamily.interRegular,
    fontSize: 13,
    color: '#4B63A8',
    lineHeight: 19,
  },

  // ─── Section ───
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 12,
  },

  // ─── Donut Card ───
  donutCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  donutLegend: {
    flex: 1,
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontFamily: FontFamily.interMedium,
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  legendValue: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },

  // ─── Safe Percent Card ───
  safePercentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successSurface,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  safePercentValue: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: 28,
    color: Colors.success,
  },
  safePercentLabel: {
    fontFamily: FontFamily.interMedium,
    fontSize: 13,
    color: Colors.successDark,
    flex: 1,
    lineHeight: 18,
  },

  // ─── Bar Chart ───
  barChartCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barLabel: {
    fontFamily: FontFamily.interSemiBold,
    fontSize: 14,
    color: Colors.textPrimary,
    width: 90,
  },
  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  barCount: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 14,
    color: Colors.textTertiary,
    width: 30,
    textAlign: 'right',
  },

  // ─── Empty State ───
  emptyBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderCard,
  },
  emptyText: {
    fontFamily: FontFamily.interRegular,
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ─── Danger List ───
  dangerList: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderCard,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  dangerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dangerSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerInfo: {
    flex: 1,
  },
  dangerName: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dangerDetail: {
    fontFamily: FontFamily.interRegular,
    fontSize: 12,
    color: Colors.textTertiary,
  },

  // ─── Profile Allergen Card ───
  profileAllergenCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: Colors.borderCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  profileAllergenRow: {
    alignItems: 'center',
    gap: 8,
  },
  profileAllergenBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAllergenBadgeNum: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: 22,
  },
  profileAllergenLabel: {
    fontFamily: FontFamily.interMedium,
    fontSize: 12,
    color: Colors.textTertiary,
  },
  profileAllergenDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.divider,
  },

  // ─── Edit profile button ───
  editProfileBtn: {
    marginTop: 12,
    backgroundColor: Colors.primarySurface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6E4FF',
  },
  editProfileBtnText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 14,
    color: Colors.primary,
  },
});
