import React, { forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { Allergen } from '@/store/appStore';

const CARD_WIDTH = 420;

// ─── Emoji map for allergen categories ──────────────────────────────────────
const allergenEmoji: Record<string, string> = {
  'gluten': '🌾', 'trigo': '🌾', 'wheat': '🌾', 'cebada': '🌾',
  'leche': '🥛', 'lácteo': '🥛', 'lacteo': '🥛', 'lactosa': '🥛', 'dairy': '🥛', 'milk': '🥛', 'caseína': '🥛',
  'maní': '🥜', 'mani': '🥜', 'cacahuete': '🥜', 'peanut': '🥜',
  'nuez': '🌰', 'almendra': '🌰', 'avellana': '🌰', 'pistacho': '🌰', 'tree nut': '🌰', 'frutos secos': '🌰',
  'soya': '🫘', 'soja': '🫘', 'soy': '🫘',
  'huevo': '🥚', 'egg': '🥚',
  'pescado': '🐟', 'fish': '🐟',
  'mariscos': '🦐', 'camarón': '🦐', 'shellfish': '🦐', 'crustáceo': '🦐',
  'apio': '🥬', 'celery': '🥬',
  'mostaza': '🟡', 'mustard': '🟡',
  'sésamo': '⚪', 'sesamo': '⚪', 'sesame': '⚪',
  'sulfito': '🧪', 'sulfite': '🧪', 'dióxido de azufre': '🧪',
  'molusco': '🐚', 'mollusk': '🐚',
  'altramuz': '🌱', 'lupin': '🌱',
};

function getEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(allergenEmoji)) {
    if (lower.includes(key)) return emoji;
  }
  return '⚠️';
}

function getSeverityConfig(severity: string) {
  switch (severity) {
    case 'HIGH':
      return { label: 'ALTA', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444' };
    case 'MED':
      return { label: 'MEDIA', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B' };
    case 'LOW':
      return { label: 'BAJA', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', dot: '#10B981' };
    default:
      return { label: 'N/A', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', dot: '#94A3B8' };
  }
}

interface ProfileShareCardProps {
  userName: string;
  allergens: Allergen[];
  totalScans?: number;
  safeCount?: number;
  dangerCount?: number;
}

export const ProfileShareCard = forwardRef<View, ProfileShareCardProps>(
  ({ userName, allergens, totalScans = 0, safeCount = 0, dangerCount = 0 }, ref) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('es-EC', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const highCount = allergens.filter(a => a.severity === 'HIGH').length;
    const medCount = allergens.filter(a => a.severity === 'MED').length;
    const lowCount = allergens.filter(a => a.severity === 'LOW').length;

    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        {/* ─── HEADER GRADIENT ─── */}
        <View style={styles.header}>
          <Svg width={CARD_WIDTH} height={160} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#1E3A8A" />
                <Stop offset="0.5" stopColor="#2563EB" />
                <Stop offset="1" stopColor="#3B82F6" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={CARD_WIDTH} height="160" fill="url(#headerGrad)" />
            {/* Decorative circles */}
            <Circle cx="350" cy="30" r="80" fill="rgba(255,255,255,0.06)" />
            <Circle cx="50" cy="140" r="60" fill="rgba(255,255,255,0.04)" />
            <Circle cx="380" cy="140" r="40" fill="rgba(255,255,255,0.05)" />
          </Svg>

          {/* Shield icon */}
          <View style={styles.shieldBadge}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
                fill="#FFFFFF"
              />
              <Path d="M9 12l2 2 4-4" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>

          <Text style={styles.headerLabel}>PERFIL DE ALERGIAS</Text>
          <Text style={styles.headerName}>{userName}</Text>
          <Text style={styles.headerDate}>Actualizado: {dateStr}</Text>
        </View>

        {/* ─── STATS BAR ─── */}
        {totalScans > 0 && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalScans}</Text>
              <Text style={styles.statLabel}>Escaneos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{safeCount}</Text>
              <Text style={styles.statLabel}>Seguros</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{dangerCount}</Text>
              <Text style={styles.statLabel}>Alertas</Text>
            </View>
          </View>
        )}

        {/* ─── SEVERITY SUMMARY ─── */}
        {allergens.length > 0 && (
          <View style={styles.severitySummary}>
            {highCount > 0 && (
              <View style={[styles.sevBadge, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <View style={[styles.sevDot, { backgroundColor: '#EF4444' }]} />
                <Text style={[styles.sevBadgeText, { color: '#DC2626' }]}>
                  {highCount} alta{highCount !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {medCount > 0 && (
              <View style={[styles.sevBadge, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                <View style={[styles.sevDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.sevBadgeText, { color: '#D97706' }]}>
                  {medCount} media{medCount !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {lowCount > 0 && (
              <View style={[styles.sevBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <View style={[styles.sevDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.sevBadgeText, { color: '#059669' }]}>
                  {lowCount} baja{lowCount !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ─── ALLERGENS LIST ─── */}
        <View style={styles.body}>
          <Text style={styles.sectionTitle}>
            {allergens.length > 0
              ? `⚠️ Alérgenos Registrados (${allergens.length})`
              : '✅ Sin alérgenos configurados'}
          </Text>

          {allergens.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Este usuario aún no ha registrado alérgenos en su perfil.
              </Text>
            </View>
          ) : (
            <View style={styles.allergenGrid}>
              {allergens.map((a, idx) => {
                const sev = getSeverityConfig(a.severity);
                const emoji = getEmoji(a.name);
                return (
                  <View key={idx} style={[styles.allergenCard, { borderLeftColor: sev.dot }]}>
                    <View style={styles.allergenTop}>
                      <Text style={styles.allergenEmoji}>{emoji}</Text>
                      <Text style={styles.allergenName}>{a.name}</Text>
                    </View>
                    <View style={styles.allergenBottom}>
                      <View style={[styles.severityPill, { backgroundColor: sev.bg, borderColor: sev.border }]}>
                        <View style={[styles.sevDotSmall, { backgroundColor: sev.dot }]} />
                        <Text style={[styles.severityText, { color: sev.color }]}>
                          {sev.label}
                        </Text>
                      </View>
                      {a.note ? (
                        <Text style={styles.allergenNote} numberOfLines={1}>
                          {a.note}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ─── WARNING MESSAGE ─── */}
        <View style={styles.warningBox}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={2.5} strokeLinecap="round">
            <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <Path d="M12 9v4M12 17h.01" />
          </Svg>
          <Text style={styles.warningText}>
            Por favor, revisa siempre las etiquetas antes de darle alimentos a {userName.split(' ')[0]}.
          </Text>
        </View>

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
          <Text style={styles.footerSub}>by CodiDevs</Text>
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
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  shieldBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  headerLabel: {
    fontFamily: FontFamily.interSemiBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerName: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerDate: {
    fontFamily: FontFamily.interRegular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },

  // ─── Stats Bar ───
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: 22,
    color: '#1E293B',
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: FontFamily.interRegular,
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },

  // ─── Severity Summary ───
  severitySummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FAFBFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sevBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  sevDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sevBadgeText: {
    fontFamily: FontFamily.interSemiBold,
    fontSize: 12,
  },

  // ─── Body ───
  body: {
    padding: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
  },
  emptyBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  emptyText: {
    fontFamily: FontFamily.interRegular,
    fontSize: 14,
    color: '#16A34A',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ─── Allergen Grid ───
  allergenGrid: {
    gap: 10,
  },
  allergenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  allergenTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  allergenEmoji: {
    fontSize: 22,
  },
  allergenName: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
  allergenBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 32,
  },
  severityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  sevDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  severityText: {
    fontFamily: FontFamily.interSemiBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  allergenNote: {
    fontFamily: FontFamily.interRegular,
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
  },

  // ─── Warning Box ───
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontFamily: FontFamily.interMedium,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 19,
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
