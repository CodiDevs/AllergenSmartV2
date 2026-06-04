import { create } from 'zustand';

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
  dateRaw: Date;
  status: 'safe' | 'warning' | 'danger';
  warningType?: 'blurry' | 'partial';
  confidence?: number;
  allergens: string[];
  rawIngredients: string;
}

export interface FavoriteItem {
  id: string;
  name: string;
  category: 'Todos' | 'Sin gluten' | 'Sin lácteos' | 'Cereales' | string;
  detail: string;
  status: 'safe';
  typeIcon: 'sprout' | 'lock' | 'circle' | 'menu' | string;
}

interface AppState {
  // User Profile
  userName: string;
  userEmail: string;
  isPremium: boolean;
  allergens: Allergen[];
  
  // App Data
  history: HistoryItem[];
  favorites: FavoriteItem[];
  
  // Navigation / Processing State
  activeScan: {
    name: string;
    brand: string;
    status: 'safe' | 'warning' | 'danger';
    warningType?: 'blurry' | 'partial';
    confidence?: number;
    allergens: string[];
    rawIngredients: string;
  } | null;

  // Actions
  setProfile: (name: string, email: string) => void;
  addAllergen: (allergen: Allergen) => void;
  removeAllergen: (id: string) => void;
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (item: FavoriteItem) => void;
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'dateRaw'>) => void;
  clearHistory: () => void;
  setActiveScan: (scan: AppState['activeScan']) => void;
}

export const useAppStore = create<AppState>((set) => ({
  userName: 'María García',
  userEmail: 'maria@ejemplo.com',
  isPremium: true,
  allergens: [
    { id: 'gluten', name: 'Gluten', severity: 'HIGH', note: 'Celiaquía confirmada', icon: 'droplet' },
    { id: 'lacteos', name: 'Lácteos', severity: 'HIGH', note: 'Intolerancia severa', icon: 'disc' },
    { id: 'mani', name: 'Maní', severity: 'MED', note: 'Sensibilidad media', icon: 'droplet' },
    { id: 'huevo', name: 'Huevo', severity: 'MED', note: 'Sensibilidad media', icon: 'circle' },
  ],
  favorites: [
    { id: 'fav_1', name: 'Avena Natural OatLife', category: 'Cereales', detail: 'Cereales · 0 alérgenos', status: 'safe', typeIcon: 'sprout' },
    { id: 'fav_2', name: 'Leche de Almendra Alpro', category: 'Sin lácteos', detail: 'Lácteos veg. · 0 alérgenos', status: 'safe', typeIcon: 'lock' },
    { id: 'fav_3', name: 'Yogur Coco Sin Lácteos', category: 'Sin lácteos', detail: 'Postres · 0 alérgenos', status: 'safe', typeIcon: 'circle' },
    { id: 'fav_4', name: 'Pan Artesano Sin Gluten', category: 'Sin gluten', detail: 'Panadería · 0 alérgenos', status: 'safe', typeIcon: 'menu' },
  ],
  history: [
    {
      id: 'h_1',
      name: 'Galletas Integrales NutriSnack',
      brand: 'NutriSnack',
      detail: '2 alérgenos HIGH · hace 2h',
      time: 'hace 2h',
      date: 'Hoy',
      dateRaw: new Date(),
      status: 'danger',
      allergens: ['Gluten', 'Lácteos'],
      rawIngredients: 'aceite de girasol, sal, azúcar, gluten de trigo, emulsionante E471, leche entera, extracto de vainilla'
    },
    {
      id: 'h_2',
      name: 'Yogur Griego Natural',
      brand: 'YogurGriego',
      detail: 'Lectura parcial · hace 5h',
      time: 'hace 5h',
      date: 'Hoy',
      dateRaw: new Date(),
      status: 'warning',
      warningType: 'partial',
      confidence: 68,
      allergens: ['Lácteos', 'Frutos secos'],
      rawIngredients: 'avena, aceite de coco, miel, azúcar morena, sal — [zona cortada: ~3 líneas]'
    },
    {
      id: 'h_3',
      name: 'Avena Natural OatLife',
      brand: 'OatLife',
      detail: 'Sin alérgenos · ayer 18:20',
      time: 'ayer 18:20',
      date: 'Ayer',
      dateRaw: new Date(Date.now() - 86400000),
      status: 'safe',
      allergens: [],
      rawIngredients: 'copos de avena certificada, agua, sal marina, sin conservantes, sin gluten, sin lácteos, trazas: ninguna'
    },
    {
      id: 'h_4',
      name: 'Leche de Almendra Alpro',
      brand: 'Alpro',
      detail: 'Sin alérgenos · ayer 12:05',
      time: 'ayer 12:05',
      date: 'Ayer',
      dateRaw: new Date(Date.now() - 86400000),
      status: 'safe',
      allergens: [],
      rawIngredients: 'agua, almendras, fosfato tricálcico, sal marina, estabilizadores, vitaminas'
    },
    {
      id: 'h_5',
      name: 'Pasta Italiana Barilla',
      brand: 'Barilla',
      detail: 'Gluten · ayer 09:40',
      time: 'ayer 09:40',
      date: 'Ayer',
      dateRaw: new Date(Date.now() - 86400000),
      status: 'danger',
      allergens: ['Gluten'],
      rawIngredients: 'sémola de trigo candeal, agua, gluten'
    }
  ],
  activeScan: null,

  setProfile: (name, email) => set({ userName: name, userEmail: email }),
  addAllergen: (allergen) => set((state) => ({ allergens: [...state.allergens, allergen] })),
  removeAllergen: (id) => set((state) => ({ allergens: state.allergens.filter(a => a.id !== id) })),
  addFavorite: (item) => set((state) => ({ favorites: [...state.favorites, item] })),
  removeFavorite: (id) => set((state) => ({ favorites: state.favorites.filter(f => f.id !== id) })),
  toggleFavorite: (item) => set((state) => {
    const exists = state.favorites.some(f => f.name === item.name);
    if (exists) {
      return { favorites: state.favorites.filter(f => f.name !== item.name) };
    } else {
      return { favorites: [...state.favorites, item] };
    }
  }),
  addHistoryItem: (item) => set((state) => {
    const newItem: HistoryItem = {
      ...item,
      id: `h_${Date.now()}`,
      dateRaw: new Date(),
    };
    return { history: [newItem, ...state.history] };
  }),
  clearHistory: () => set({ history: [] }),
  setActiveScan: (scan) => set({ activeScan: scan }),
}));
