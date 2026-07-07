import React, { forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';

const CARD_WIDTH = 420;

// ─── Theme configs ──────────────────────────────────────────────────────────
const themes = {
  danger: {
    gradStart: '#991B1B',
    gradMid: '#DC2626',
    gradEnd: '#EF4444',
    headerLabel: '¡PELIGRO DETECTADO!',
    statusIcon: 'danger',
    statusEmoji: '🚫',
    messageBg: '#FEF2F2',
    messageBorder: '#FECACA',
    messageColor: '#991B1B',
    messageText: 'NO es seguro para el perfil de alergias actual.',
    allergenBg: '#FEF2F2',
    allergenBorder: '#FECACA',
    allergenDot: '#EF4444',
    allergenTextColor: '#991B1B',
  },
  warning: {
    gradStart: '#92400E',
    gradMid: '#D97706',
    gradEnd: '#F59E0B',
    headerLabel: 'PRECAUCIÓN',
    statusIcon: 'warning',
    statusEmoji: '⚠️',
    messageBg: '#FFFBEB',
    messageBorder: '#FDE68A',
    messageColor: '#92400E',
    messageText: 'Contiene posibles trazas o advertencias.',
    allergenBg: '#FFFBEB',
    allergenBorder: '#FDE68A',
    allergenDot: '#F59E0B',
    allergenTextColor: '#92400E',
  },
  safe: {
    gradStart: '#064E3B',
    gradMid: '#059669',
    gradEnd: '#10B981',
    headerLabel: '¡PRODUCTO SEGURO!',
    statusIcon: 'safe',
    statusEmoji: '✅',
    messageBg: '#ECFDF5',
    messageBorder: '#A7F3D0',
    messageColor: '#064E3B',
    messageText: 'No se detectaron alérgenos del perfil.',
    allergenBg: '#ECFDF5',
    allergenBorder: '#A7F3D0',
    allergenDot: '#10B981',
    allergenTextColor: '#064E3B',
  },
};

interface ProductShareCardProps {
  productName: string;
  brand: string;
  status: 'safe' | 'warning' | 'danger';
  allergens: string[];
  confidence?: number;
  userName?: string;
}

export const ProductShareCard = forwardRef<View, ProductShareCardProps>(
  ({ productName, brand, status, allergens, confidence, userName }, ref) => {
    const theme = themes[status] || themes.safe;
    const isSafe = status === 'safe';

    const today = new Date();
    const dateStr = today.toLocaleDateString('es-EC', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    const timeStr = today.toLocaleTimeString('es-EC', {
      hour: '2-digit', minute: '2-digit',
    });

    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        {/* ─── HEADER GRADIENT ─── */}
        <View style={styles.header}>
          <Svg width={CARD_WIDTH} height={170} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="prodGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={theme.gradStart} />
                <Stop offset="0.5" stopColor={theme.gradMid} />
                <Stop offset="1" stopColor={theme.gradEnd} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={CARD_WIDTH} height="170" fill="url(#prodGrad)" />
            {/* Decorative elements */}
            <Circle cx="370" cy="40" r="90" fill="rgba(255,255,255,0.06)" />
            <Circle cx="30" cy="150" r="70" fill="rgba(255,255,255,0.04)" />
          </Svg>

          {/* Big status icon */}
          <View style={styles.statusCircle}>
            <Text style={styles.statusEmoji}>{theme.statusEmoji}</Text>
          </View>

          <Text style={styles.headerLabel}>{theme.headerLabel}</Text>
          <Text style={styles.headerSub}>{theme.messageText}</Text>
        </View>

        {/* ─── PRODUCT INFO CARD ─── */}
        <View style={styles.productCard}>
          <View style={styles.productTop}>
            <View style={styles.productInfo}>
              <Text style={styles.productBrand}>{brand || 'Marca desconocida'}</Text>
              <Text style={styles.productName} numberOfLines={2}>{productName}</Text>
            </View>
            {confidence !== undefined && confidence > 0 && (
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceValue}>{confidence}%</Text>
                <Text style={styles.confidenceLabel}>precisión</Text>
              </View>
            )}
          </View>

          {/* Scan metadata */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2}>
                <Rect x="3" y="4" width="18" height="18" rx="2" />
                <Path d="M16 2v4M8 2v4M3 10h18" />
              </Svg>
              <Text style={styles.metaText}>{dateStr}</Text>
            </View>
            <View style={styles.metaItem}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2}>
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 6v6l4 2" />
              </Svg>
              <Text style={styles.metaText}>{timeStr}</Text>
            </View>
            {userName ? (
              <View style={styles.metaItem}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2}>
                  <Circle cx="12" cy="7" r="4" />
                  <Path d="M5.5 21c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" />
                </Svg>
                <Text style={styles.metaText}>{userName}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ─── ALLERGENS SECTION ─── */}
        {!isSafe && allergens.length > 0 ? (
          <View style={styles.body}>
            <Text style={styles.sectionTitle}>
              🔍 Alérgenos Detectados ({allergens.length})
            </Text>
            <View style={styles.allergenList}>
              {allergens.map((name, idx) => (
                <View
                  key={idx}
                  style={[styles.allergenItem, {
                    backgroundColor: theme.allergenBg,
                    borderColor: theme.allergenBorder,
                  }]}
                >
                  <View style={[styles.allergenDot, { backgroundColor: theme.allergenDot }]} />
                  <Text style={[styles.allergenText, { color: theme.allergenTextColor }]}>
                    {name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : isSafe ? (
          <View style={styles.body}>
            <View style={styles.safeBox}>
              <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" fill="#D1FAE5" stroke="#10B981" strokeWidth="1.5" />
                <Path d="M8 12l3 3 5-5" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.safeTitle}>Sin riesgos detectados</Text>
              <Text style={styles.safeDesc}>
                Este producto no contiene ninguno de los alérgenos registrados en el perfil.{'\n'}¡Es seguro para consumir!
              </Text>
            </View>
          </View>
        ) : null}

        {/* ─── FOOTER ─── */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
                fill="#93C5FD"
                stroke="#3B82F6"
                strokeWidth="1.2"
              />
            </Svg>
            <Text style={styles.footerBrand}>SmartAllergen</Text>
          </View>
          <Text style={styles.footerSub}>Escaneo verificado</Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },

  // ─── Header ───
  header: {
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  statusCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statusEmoji: {
    fontSize: 32,
  },
  headerLabel: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  headerSub: {
    fontFamily: FontFamily.interMedium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // ─── Product Card ───
  productCard: {
    margin: 20,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  productTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  productInfo: {
    flex: 1,
    marginRight: 16,
  },
  productBrand: {
    fontFamily: FontFamily.interSemiBold,
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  productName: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: 20,
    color: '#1E293B',
    lineHeight: 26,
  },
  confidenceBadge: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    minWidth: 60,
  },
  confidenceValue: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: 18,
    color: '#0284C7',
  },
  confidenceLabel: {
    fontFamily: FontFamily.interRegular,
    fontSize: 10,
    color: '#7DD3FC',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: FontFamily.interRegular,
    fontSize: 12,
    color: '#94A3B8',
  },

  // ─── Body ───
  body: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 12,
  },
  allergenList: {
    gap: 8,
  },
  allergenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  allergenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  allergenText: {
    fontFamily: FontFamily.interSemiBold,
    fontSize: 15,
    flex: 1,
  },

  // ─── Safe section ───
  safeBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  safeTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 18,
    color: '#059669',
  },
  safeDesc: {
    fontFamily: FontFamily.interRegular,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // ─── Footer ───
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerBrand: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 14,
    color: '#3B82F6',
  },
  footerSub: {
    fontFamily: FontFamily.interRegular,
    fontSize: 12,
    color: '#94A3B8',
  },
});
