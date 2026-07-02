/**
 * notificationStore.ts — Estado global de notificaciones (Zustand).
 * Maneja las notificaciones locales del usuario, su estado de lectura,
 * y genera notificaciones inteligentes basadas en la actividad del usuario.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type NotificationType = 
  | 'welcome'        // Bienvenida al registrarse
  | 'scan_result'    // Resultado de un escaneo (peligro/advertencia)
  | 'tip'            // Consejo de salud
  | 'milestone'      // Logro del usuario (ej: 10 escaneos)
  | 'safety_alert'   // Alerta de seguridad alimentaria
  | 'reminder';      // Recordatorio

export type NotificationPriority = 'high' | 'medium' | 'low';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string; // ISO date string
  /** Datos extra para deep linking o contexto */
  data?: Record<string, string>;
}

interface NotificationState {
  notifications: AppNotification[];
  /** Número de notificaciones no leídas */
  unreadCount: number;

  // ── Acciones ──
  addNotification: (notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  
  // ── Generadores inteligentes ──
  generateWelcomeNotification: (userName: string) => void;
  generateScanAlert: (productName: string, status: 'warning' | 'danger', allergens: string[]) => void;
  generateMilestone: (scanCount: number) => void;
  generateSafetyTip: () => void;
}

// ─── Tips inteligentes rotatorios ─────────────────────────────────────────────

const SAFETY_TIPS = [
  {
    title: '🧊 ¿Sabías esto sobre alérgenos ocultos?',
    body: 'La caseína y el suero de leche son derivados lácteos que a menudo pasan desapercibidos en las etiquetas. AllergenSmart los detecta automáticamente por ti.',
  },
  {
    title: '🔬 Trazas cruzadas',
    body: 'Muchos productos son fabricados en líneas compartidas con alérgenos. Busca la leyenda "Puede contener trazas de..." y escanea siempre antes de consumir.',
  },
  {
    title: '📋 Actualiza tu perfil de alérgenos',
    body: 'Mantén actualizada tu lista de alérgenos en el perfil para que AllergenSmart te avise con mayor precisión en cada escaneo.',
  },
  {
    title: '🛒 Consejo para el supermercado',
    body: 'Escanea los productos antes de meterlos al carrito. Es más fácil devolverlos en la estantería que después de pagarlos.',
  },
  {
    title: '🌿 Alternativas seguras',
    body: 'Guarda tus productos seguros en Favoritos para tener siempre una lista de compras rápida y sin riesgos.',
  },
];

// ─── Milestones ───────────────────────────────────────────────────────────────

const MILESTONES: Record<number, { title: string; body: string }> = {
  1: {
    title: '🎉 ¡Tu primer escaneo!',
    body: '¡Acabas de completar tu primer análisis de producto! Sigue escaneando para mantener tu salud protegida.',
  },
  5: {
    title: '⭐ ¡5 escaneos completados!',
    body: 'Ya llevas 5 productos analizados. Estás tomando el control de tu alimentación. ¡Sigue así!',
  },
  10: {
    title: '🏆 ¡Experto en alérgenos!',
    body: '10 escaneos completados. AllergenSmart ha estado cuidando de ti y ahora eres un experto en leer etiquetas.',
  },
  25: {
    title: '🚀 ¡25 escaneos! Imparable',
    body: 'Has escaneado 25 productos. Tu compromiso con tu salud es inspirador. ¡Comparte AllergenSmart con alguien que lo necesite!',
  },
  50: {
    title: '💎 ¡Medio centenar!',
    body: '50 escaneos completados. Eres un verdadero guardián de la seguridad alimentaria.',
  },
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notif) => {
        const newNotif: AppNotification = {
          ...notif,
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          notifications: [newNotif, ...state.notifications].slice(0, 50), // Máximo 50 notificaciones
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id && !n.read ? { ...n, read: true } : n
          );
          const wasUnread = state.notifications.find((n) => n.id === id && !n.read);
          return {
            notifications: updated,
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const target = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: target && !target.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      },

      clearAll: () => set({ notifications: [], unreadCount: 0 }),

      // ── Generadores inteligentes ──

      generateWelcomeNotification: (userName) => {
        get().addNotification({
          type: 'welcome',
          title: `¡Bienvenido/a, ${userName}! 👋`,
          body: 'Tu cuenta de AllergenSmart está lista. Configura tus alérgenos en tu perfil y comienza a escanear productos para proteger tu salud.',
          priority: 'medium',
        });
      },

      generateScanAlert: (productName, status, allergens) => {
        const allergenList = allergens.slice(0, 3).join(', ');
        if (status === 'danger') {
          get().addNotification({
            type: 'scan_result',
            title: `🚨 ¡Peligro detectado en "${productName}"!`,
            body: `Se encontraron alérgenos directos: ${allergenList}. Este producto NO es seguro para tu consumo.`,
            priority: 'high',
            data: { productName },
          });
        } else if (status === 'warning') {
          get().addNotification({
            type: 'scan_result',
            title: `⚠️ Precaución con "${productName}"`,
            body: `Se detectaron posibles trazas o alérgenos secundarios: ${allergenList}. Revisa la etiqueta con cuidado.`,
            priority: 'medium',
            data: { productName },
          });
        }
      },

      generateMilestone: (scanCount) => {
        const milestone = MILESTONES[scanCount];
        if (milestone) {
          get().addNotification({
            type: 'milestone',
            title: milestone.title,
            body: milestone.body,
            priority: 'low',
          });
        }
      },

      generateSafetyTip: () => {
        const randomTip = SAFETY_TIPS[Math.floor(Math.random() * SAFETY_TIPS.length)];
        // Evitar duplicados: no generar si el último tip tiene el mismo título
        const lastTip = get().notifications.find((n) => n.type === 'tip');
        if (lastTip && lastTip.title === randomTip.title) return;

        get().addNotification({
          type: 'tip',
          title: randomTip.title,
          body: randomTip.body,
          priority: 'low',
        });
      },
    }),
    {
      name: 'allergensmart-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
