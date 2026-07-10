/**
 * appStore.ts — Estado global de la aplicación (Zustand).
 *
 * IMPORTANTE: Este store ya NO contiene datos hardcodeados/mock.
 * - El store arranca VACÍO.
 * - El nombre y email del usuario se leen de Supabase Auth (user_metadata).
 * - Los alérgenos, favoritos e historial los agrega el usuario en tiempo real.
 * - Las estadísticas (safeCount, preventedCount, etc.) se calculan dinámicamente
 *   desde el array `history` usando selectores, no se guardan como estado separado.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AllergenMatch, ScanSource } from '@/services/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Allergen {
  id: string;
  name: string;
  severity: 'HIGH' | 'MED' | 'LOW';
  note: string;
  icon: 'droplet' | 'disc' | 'circle' | 'sprout' | 'menu';
}

export interface HistoryItem {
  id: string;
  name: string;
  brand: string;
  detail: string;
  time: string;
  date: 'Hoy' | 'Ayer' | string;
  dateRaw: string | Date;
  status: 'safe' | 'warning' | 'danger';
  warningType?: 'blurry' | 'partial';
  confidence?: number;
  allergens: string[];
  rawIngredients: string;
  /** ID del escaneo en el backend (si ya fue persistido) */
  backendId?: string;
}

export interface FavoriteItem {
  id: string;
  name: string;
  category: 'Todos' | 'Sin gluten' | 'Sin lácteos' | 'Cereales' | string;
  detail: string;
  status: 'safe';
  typeIcon: 'sprout' | 'lock' | 'circle' | 'menu' | string;
}

// ─── Estado activo del escaneo (se setea antes de navegar a /processing) ──────

/**
 * ActiveScan — resultado completo de un escaneo.
 * Contiene tanto los campos mínimos para las pantallas de UI
 * como los datos enriquecidos del backend (allergens_found detallados).
 */
export interface ActiveScan {
  name: string;
  brand: string;
  status: 'safe' | 'warning' | 'danger';
  warningType?: 'blurry' | 'partial';
  confidence?: number;
  /** Nombres de alérgenos detectados (para compatibilidad con pantallas existentes) */
  allergens: string[];
  rawIngredients: string;
  /** Lista detallada de alérgenos del backend (match_type, severity, source_ingredient) */
  allergensDetailed?: AllergenMatch[];
  /** Advertencias de trazas / "puede contener" */
  warnings?: string[];
  /** Texto detectado por OCR */
  detectedText?: string;
  /** Si el resultado viene de caché */
  fromCache?: boolean;
}

/**
 * PendingScan — input del usuario antes de enviar al backend.
 * Se guarda en el store para que processing.tsx lo lea y llame al API.
 */
export interface PendingScan {
  /** Fuente del escaneo */
  scanSource: ScanSource;
  /** Imagen en base64 (para modo cámara o galería) */
  imageBase64?: string;
  /** Texto de ingredientes ingresado manualmente */
  manualText?: string;
  /** Nombre del producto ingresado manualmente (solo para UI) */
  productName?: string;
  /** Código de barras (opcional) */
  barcode?: string;
}

export type UiScale = 'small' | 'medium' | 'large';

// ─── Interface del store ───────────────────────────────────────────────────────

interface AppState {
  // Accesibilidad
  uiScale: UiScale;

  // Alérgenos del perfil del usuario
  allergens: Allergen[];

  // Historial de escaneos (en memoria — el backend lo persiste)
  history: HistoryItem[];

  // Productos favoritos
  favorites: FavoriteItem[];

  // Escaneo en curso (se usa para pasar datos entre pantallas)
  activeScan: ActiveScan | null;

  // Input pendiente de enviar al backend (se lee en processing.tsx)
  pendingScan: PendingScan | null;

  // ─── Acciones ───────────────────────────────────────────────────────────────

  // Alérgenos
  addAllergen: (allergen: Allergen) => void;
  removeAllergen: (id: string) => void;
  setAllergens: (allergens: Allergen[]) => void;

  // Favoritos
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (item: FavoriteItem) => void;

  // Historial
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'dateRaw'>) => void;
  clearHistory: () => void;
  setHistory: (items: HistoryItem[]) => void;

  // Escaneo activo
  setActiveScan: (scan: ActiveScan | null) => void;

  // Escaneo pendiente
  setPendingScan: (scan: PendingScan | null) => void;

  // Accesibilidad
  setUiScale: (scale: UiScale) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
  // Estado inicial — todo vacío, sin datos inventados
  uiScale: 'medium',
  allergens: [],
  history: [],
  favorites: [],
  activeScan: null,
  pendingScan: null,

  // ─── Alérgenos ──────────────────────────────────────────────────────────────

  addAllergen: (allergen) =>
    set((state) => ({
      allergens: [...state.allergens, allergen],
    })),

  removeAllergen: (id) =>
    set((state) => ({
      allergens: state.allergens.filter((a) => a.id !== id),
    })),

  /** Reemplaza toda la lista (útil al cargar desde backend) */
  setAllergens: (allergens) => set({ allergens }),

  // ─── Favoritos ──────────────────────────────────────────────────────────────

  addFavorite: (item) =>
    set((state) => ({
      favorites: [...state.favorites, item],
    })),

  removeFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.filter((f) => f.id !== id),
    })),

  /** Agrega si no existe, elimina si ya existe (toggle por nombre) */
  toggleFavorite: (item) =>
    set((state) => {
      const exists = state.favorites.some((f) => f.name === item.name);
      if (exists) {
        return { favorites: state.favorites.filter((f) => f.name !== item.name) };
      }
      return { favorites: [...state.favorites, item] };
    }),

  // ─── Historial ──────────────────────────────────────────────────────────────

  addHistoryItem: (item) =>
    set((state) => {
      const now = new Date();
      const newItem: HistoryItem = {
        ...item,
        id: item.backendId ?? `h_${Date.now()}`,
        dateRaw: now,
      };
      return { history: [newItem, ...state.history] };
    }),

  clearHistory: () => set({ history: [] }),

  /** Reemplaza toda la lista (útil al cargar desde backend) */
  setHistory: (items) => set({ history: items }),

  // ─── Escaneo activo ─────────────────────────────────────────────────────────

  setActiveScan: (scan) => set({ activeScan: scan }),

  // ─── Escaneo pendiente ──────────────────────────────────────────────────────

  setPendingScan: (scan) => set({ pendingScan: scan }),

  // ─── Accesibilidad ──────────────────────────────────────────────────────────

  setUiScale: (scale) => set({ uiScale: scale }),
    }),
    {
      name: 'allergensmart-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        uiScale: state.uiScale,
        allergens: state.allergens,
        history: state.history,
        favorites: state.favorites,
      }),
    }
  )
);

// ─── Selectores (estadísticas calculadas) ─────────────────────────────────────
// Úsalos en los componentes en lugar de guardar contadores como estado separado.

/** Número total de escaneos en el historial */
export const selectTotalScans = (state: AppState) => state.history.length;

/** Número de escaneos seguros (status === 'safe') */
export const selectSafeCount = (state: AppState) =>
  state.history.filter((h) => h.status === 'safe').length;

/** Número de peligros detectados (status === 'danger') — "evitados" */
export const selectDangerCount = (state: AppState) =>
  state.history.filter((h) => h.status === 'danger').length;

/** Número de advertencias (status === 'warning') */
export const selectWarningCount = (state: AppState) =>
  state.history.filter((h) => h.status === 'warning').length;

/** Número de alérgenos de severidad HIGH activos en el perfil */
export const selectActiveHighAlerts = (state: AppState) =>
  state.allergens.filter((a) => a.severity === 'HIGH').length;

/** Multiplicador de escala UI basado en la preferencia del usuario */
export const selectUiScaleMultiplier = (state: AppState) => {
  switch (state.uiScale) {
    case 'small': return 1.0;
    case 'large': return 1.5;
    case 'medium':
    default: return 1.15;
  }
};
