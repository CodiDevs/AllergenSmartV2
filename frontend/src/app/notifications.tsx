/**
 * Notifications Screen — Centro de notificaciones de AllergenSmart.
 * Muestra las notificaciones inteligentes del usuario con diseño premium
 * y acciones de deslizar para borrar.
 */
import React, { useCallback } from 'react';
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
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { useNotificationStore, type AppNotification, type NotificationType } from '@/stores/notificationStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formato relativo del tiempo */
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
}

/** Configuración visual por tipo de notificación */
function getTypeConfig(type: NotificationType) {
  switch (type) {
    case 'scan_result':
      return { bg: '#FFF0F0', accent: '#E24B4A', iconBg: '#FFE0DF' };
    case 'welcome':
      return { bg: '#F0F7FF', accent: '#3B82F6', iconBg: '#DBEAFE' };
    case 'milestone':
      return { bg: '#FFF9EB', accent: '#F59E0B', iconBg: '#FEF3C7' };
    case 'tip':
      return { bg: '#ECFDF5', accent: '#1D9E75', iconBg: '#D1FAE5' };
    case 'safety_alert':
      return { bg: '#FFF0F0', accent: '#DC2626', iconBg: '#FEE2E2' };
    case 'reminder':
    default:
      return { bg: '#F0F7FF', accent: '#6366F1', iconBg: '#E0E7FF' };
  }
}

/** Icono SVG por tipo */
function NotifIcon({ type }: { type: NotificationType }) {
  const { accent } = getTypeConfig(type);
  switch (type) {
    case 'scan_result':
    case 'safety_alert':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
          <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <Path d="M12 9v4M12 17h.01" />
        </Svg>
      );
    case 'welcome':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
          <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
        </Svg>
      );
    case 'milestone':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
          <Circle cx="12" cy="8" r="7" />
          <Path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
        </Svg>
      );
    case 'tip':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
          <Path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2zM9 21h6" />
        </Svg>
      );
    case 'reminder':
    default:
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
          <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <Path d="M13.73 21a2 2 0 01-3.46 0" />
        </Svg>
      );
  }
}

// ─── Componente de cada notificación ──────────────────────────────────────────

function NotificationCard({ notif, onPress, onRemove }: {
  notif: AppNotification;
  onPress: () => void;
  onRemove: () => void;
}) {
  const config = getTypeConfig(notif.type);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: notif.read ? '#FFFFFF' : config.bg },
        !notif.read && styles.cardUnread,
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Left accent bar */}
      {!notif.read && <View style={[styles.accentBar, { backgroundColor: config.accent }]} />}

      <View style={styles.cardContent}>
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
          <NotifIcon type={notif.type} />
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, !notif.read && styles.cardTitleBold]} numberOfLines={1}>
              {notif.title}
            </Text>
            <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B0BAD0" strokeWidth="2" strokeLinecap="round">
                <Path d="M18 6L6 18M6 6l12 12" />
              </Svg>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardBody} numberOfLines={3}>
            {notif.body}
          </Text>
          <Text style={[styles.cardTime, { color: config.accent }]}>{timeAgo(notif.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotificationStore();

  const handlePress = useCallback((notif: AppNotification) => {
    markAsRead(notif.id);
  }, [markAsRead]);

  const handleRemove = useCallback((id: string) => {
    removeNotification(id);
  }, [removeNotification]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={Colors.textPrimary} strokeWidth="2" strokeLinecap="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </View>

        {notifications.length > 0 && (
          <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.7}>
            <Text style={styles.markAllText}>Leer todo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B0BAD0" strokeWidth="1.5" strokeLinecap="round">
              <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <Path d="M13.73 21a2 2 0 01-3.46 0" />
            </Svg>
          </View>
          <Text style={styles.emptyTitle}>Sin notificaciones</Text>
          <Text style={styles.emptyBody}>
            Aquí aparecerán las alertas de tus escaneos, consejos de salud y logros. ¡Comienza escaneando un producto!
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((notif) => (
            <NotificationCard
              key={notif.id}
              notif={notif}
              onPress={() => handlePress(notif)}
              onRemove={() => handleRemove(notif.id)}
            />
          ))}

          {notifications.length > 2 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearAll} activeOpacity={0.7}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round">
                <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </Svg>
              <Text style={styles.clearBtnText}>Borrar todas</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0F7',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F0F3FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 8,
  },
  headerTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '800',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: '#E24B4A',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '800',
    fontSize: 11,
    color: '#FFFFFF',
  },
  markAllText: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '700',
    fontSize: 13,
    color: Colors.primary,
  },

  // ── List ──
  list: {
    padding: 16,
    gap: 10,
    paddingBottom: 32,
  },

  // ── Card ──
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0E3E5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUnread: {
    borderWidth: 1,
    borderColor: 'rgba(14, 62, 91, 0.06)',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    paddingLeft: 18,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontFamily: FontFamily.interRegular,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  cardTitleBold: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '700',
  },
  cardBody: {
    fontFamily: FontFamily.interRegular,
    fontSize: 13,
    color: '#5B7083',
    lineHeight: 18,
  },
  cardTime: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '600',
    fontSize: 11,
    marginTop: 4,
  },

  // ── Empty state ──
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#EDF0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '800',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: FontFamily.interRegular,
    fontSize: 14,
    color: '#5B7083',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Clear button ──
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 4,
  },
  clearBtnText: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '700',
    fontSize: 13,
    color: '#E24B4A',
  },
});
