/**
 * api.ts — Capa de servicio para el backend FastAPI de AllergenSmart.
 *
 * Centraliza todas las llamadas HTTP. El frontend nunca llama a fetch() directamente.
 * Usa el token JWT de Supabase para autenticación Bearer.
 *
 * BASE_URL apunta al backend local. Cuando el backend se despliegue a producción,
 * solo hay que cambiar esta constante (o usar una variable de entorno).
 */

import { supabase } from './supabase';

// ─── Configuración ────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:8000/api/v1';

// ─── Tipos de respuesta del backend ──────────────────────────────────────────

export type AlertLevel = 'SAFE' | 'WARNING' | 'DANGER';

export interface AllergenFound {
  name: string;
  confidence: number;
  matched_text: string;
  severity: 'HIGH' | 'MED' | 'LOW';
}

export interface ScanResponse {
  success: boolean;
  alert_level: AlertLevel;
  message: string;
  confidence: number;
  from_cache: boolean;
  processing_time_ms: number;
  detected_text: string;
  ingredients: string[];
  allergens_found: AllergenFound[];
  warnings: string[];
}

export interface ScanRequest {
  /** Imagen en base64 (sin prefijo data:image/...) */
  image_base64?: string;
  /** Texto manual de ingredientes */
  manual_text?: string;
  /** Código de barras si está disponible */
  barcode?: string;
}

export interface UserProfileResponse {
  id: string;
  full_name: string;
  city: string;
  language: string;
  notifications_enabled: boolean;
  is_admin: boolean;
  allergies: string[];
}

export interface ScanHistoryItem {
  id: string;
  product_name: string;
  brand?: string;
  alert_level: AlertLevel;
  allergens_found: string[];
  raw_ingredients: string;
  confidence: number;
  scanned_at: string; // ISO date string
}

export interface ScanHistoryResponse {
  total: number;
  items: ScanHistoryItem[];
}

// ─── Helper: obtener headers con el token de Supabase ────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// ─── Helper: petición genérica con manejo de errores ─────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    let errorMessage = `Error ${response.status}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorMessage;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

/**
 * POST /scan
 * Envía imagen o texto al backend para análisis de alérgenos.
 * El backend hace OCR + detección + cruce con perfil del usuario.
 */
export async function scanLabel(body: ScanRequest): Promise<ScanResponse> {
  return apiFetch<ScanResponse>('/scan', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * GET /users/me
 * Obtiene el perfil completo del usuario autenticado.
 */
export async function getUserProfile(): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>('/users/me');
}

/**
 * PUT /users/me/allergies
 * Reemplaza TODAS las alergias del usuario (idempotente).
 * Recibe un array de IDs de alérgenos del catálogo.
 */
export async function updateUserAllergies(allergyIds: string[]): Promise<void> {
  await apiFetch<{ message: string }>('/users/me/allergies', {
    method: 'PUT',
    body: JSON.stringify({ allergies: allergyIds }),
  });
}

/**
 * GET /users/me/scans
 * Historial de escaneos paginado del usuario.
 */
export async function getUserScanHistory(
  limit = 20,
  offset = 0
): Promise<ScanHistoryResponse> {
  return apiFetch<ScanHistoryResponse>(
    `/users/me/scans?limit=${limit}&offset=${offset}`
  );
}

/**
 * GET /allergens
 * Catálogo completo de alérgenos disponibles (endpoint público).
 */
export async function getAllergenCatalog() {
  return apiFetch('/allergens');
}

/**
 * Verifica que el backend esté activo.
 * Útil para mostrar un banner de "sin conexión" si falla.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8000/', {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}
