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
import Constants from 'expo-constants';
import { useAuthStore } from '@/stores/authStore';

// ─── Configuración ────────────────────────────────────────────────────────────

/**
 * BASE_URL — Apunta al servidor de producción en Render.
 */
const BASE_URL = 'https://allergensmart-backend.onrender.com/api/v1';

// ─── Enums (deben coincidir con app/schemas/common.py) ───────────────────────

/** Nivel de alerta — coincide con AlertLevel del backend (minúsculas) */
export type AlertLevel = 'safe' | 'warning' | 'danger';

/** Tipo de coincidencia de alérgeno — coincide con MatchType del backend */
export type MatchType = 'direct' | 'trace' | 'possible' | 'fuzzy';

/** Severidad — coincide con Severity del backend (minúsculas) */
export type Severity = 'high' | 'medium' | 'low';

/** Fuente del escaneo — coincide con ScanSource del backend */
export type ScanSource = 'camera' | 'barcode_only' | 'manual';

// ─── Tipos de request/response del backend ───────────────────────────────────

/**
 * ScanRequest — coincide con app/schemas/scan.py ScanRequest.
 * image_base64 es OBLIGATORIO (min 100 chars). Para modo manual se
 * codifica el texto de ingredientes en base64.
 */
export interface ScanRequest {
  /** Imagen en base64 (con o sin prefijo data:image/...). OBLIGATORIO. */
  image_base64: string;
  /** Código de barras (opcional) */
  barcode?: string;
  /** Fuente del escaneo */
  scan_source: ScanSource;
  /** Versión de la app (opcional, para analytics) */
  app_version?: string;
}

/**
 * AllergenMatch — coincide con app/schemas/scan.py AllergenMatch.
 * NOTA: El backend usa "source_ingredient", no "matched_text".
 *       La severidad viene en minúsculas: "high" | "medium" | "low".
 */
export interface AllergenMatch {
  name: string;
  match_type: MatchType;
  source_ingredient: string;
  severity: Severity;
  confidence: number | null;
}

/**
 * ProductBrief — información básica del producto en la respuesta del escaneo.
 * Coincide con app/schemas/scan.py ProductBrief.
 */
export interface ProductBrief {
  barcode: string | null;
  name: string | null;
  brand: string | null;
}

/**
 * ScanResponse — coincide con app/schemas/scan.py ScanResponse.
 */
export interface ScanResponse {
  success: boolean;
  alert_level: AlertLevel;
  message: string;
  confidence: number;
  from_cache: boolean;
  processing_time_ms: number | null;
  product: ProductBrief | null;
  detected_text: string;
  ingredients: string[];
  allergens_found: AllergenMatch[];
  warnings: string[];
}

/**
 * UserAllergyItem — una alergia dentro del perfil del usuario.
 * Coincide con app/schemas/user.py UserAllergyItem.
 */
export interface UserAllergyItem {
  allergen_id: string;
  allergen_name: string | null;
  category_name: string | null;
  severity: Severity;
}

/**
 * UserProfileResponse — perfil completo del usuario autenticado.
 * Coincide con app/schemas/user.py UserProfileResponse.
 */
export interface UserProfileResponse {
  id: string;
  full_name: string;
  city: string;
  language: string;
  notifications_enabled: boolean;
  is_admin: boolean;
  allergies: UserAllergyItem[];
}

/**
 * UserProfileUpdate — campos actualizables del perfil.
 * Coincide con app/schemas/user.py UserProfileUpdate.
 */
export interface UserProfileUpdate {
  full_name?: string;
  city?: string;
  language?: string;
  notifications_enabled?: boolean;
}

/**
 * UserAllergyEntry — entrada individual para actualizar alergias.
 * Coincide con app/schemas/user.py UserAllergyEntry.
 */
export interface UserAllergyEntry {
  allergen_id: string;
  severity: Severity;
}

/**
 * ScanHistoryItem — elemento del historial de escaneos.
 * Coincide con la respuesta de GET /users/me/scans.
 */
export interface ScanHistoryItem {
  id: string;
  product_name: string;
  brand: string | null;
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

// ─── Tipos del catálogo de alérgenos ─────────────────────────────────────────

/** Alérgeno individual del catálogo — coincide con app/schemas/allergen.py */
export interface AllergenResponse {
  id: string;
  name: string;
  synonyms: string[];
  is_active: boolean;
}

/** Categoría con sus alérgenos */
export interface CategoryResponse {
  id: string;
  name: string;
  icon_emoji: string | null;
  description: string | null;
  allergens: AllergenResponse[];
}

/** Catálogo completo */
export interface AllergenCatalogResponse {
  categories: CategoryResponse[];
}

// ─── Tipos de productos ───────────────────────────────────────────────────────

/** Producto devuelto por GET /products/{barcode} (resultado de búsqueda simple) */
export interface ProductResponse {
  id: string;
  barcode: string | null;
  name: string | null;
  brand: string | null;
  ingredients_array: string[];
  ingredients_text: string | null;
  verified_by_admin: boolean;
  country_origin: string;
  image_url: string | null;
}

/**
 * BarcodeProductResult — respuesta enriquecida del endpoint GET /products/{barcode}.
 * Incluye from_cache para saber si vino de la BD o de Open Food Facts.
 */
export interface BarcodeProductResult {
  id: string;
  barcode: string | null;
  name: string | null;
  brand: string | null;
  ingredients_text: string | null;
  ingredients_array: string[];
  allergens_tags: string[];   // ej. ["milk", "gluten"] — solo si viene de OFF
  verified_by_admin: boolean;
  from_cache: boolean;        // true = BD local, false = Open Food Facts
  image_url: string | null;
}

// ─── Tipos de reportes ────────────────────────────────────────────────────────

export interface ReportResponse {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
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

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string> | undefined),
      },
    });
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw new Error('No hay conexión a internet. Verifica tu red e intenta de nuevo.');
    }
    throw error;
  }

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().signOut();
      throw new Error('Tu sesión ha expirado. Por favor ingresa de nuevo.');
    }

    let errorMessage = `Error ${response.status}`;
    let errorCode: string | undefined;
    let actionRequired: string | undefined;
    try {
      const errorBody = await response.json();
      // El backend puede retornar { error_code, message, action_required }
      // o { detail: { error_code, message, action_required } }
      const detail = errorBody.detail ?? errorBody;
      errorMessage = detail.message || errorBody.message || errorMessage;
      errorCode = detail.error_code || errorBody.error_code;
      actionRequired = detail.action_required || errorBody.action_required;
    } catch {
      // ignorar error de parseo
    }
    const err: any = new Error(errorMessage);
    err.errorCode = errorCode;
    err.actionRequired = actionRequired;
    err.status = response.status;
    throw err;
  }

  return response.json() as Promise<T>;
}

// ─── Endpoints de Escaneo ─────────────────────────────────────────────────────

/**
 * POST /scan
 * Envía imagen o texto al backend para análisis de alérgenos.
 * El backend hace OCR + detección + cruce con perfil del usuario.
 *
 * Para MODO MANUAL (texto): codifica el texto de ingredientes en base64
 * y envía scan_source: "manual". El backend lo procesa como texto plano.
 */
export async function scanLabel(body: ScanRequest): Promise<ScanResponse> {
  return apiFetch<ScanResponse>('/scan', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── Endpoints de Usuario ─────────────────────────────────────────────────────

/**
 * GET /users/me
 * Obtiene el perfil completo del usuario autenticado.
 */
export async function getUserProfile(): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>('/users/me');
}

/**
 * PUT /users/me
 * Actualiza campos del perfil (nombre, ciudad, idioma, notificaciones).
 */
export async function updateUserProfile(body: UserProfileUpdate): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>('/users/me', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * PUT /users/me/allergies
 * Reemplaza TODAS las alergias del usuario (operación idempotente).
 * Recibe la lista completa de alergias con allergen_id y severity.
 */
export async function updateUserAllergies(allergies: UserAllergyEntry[]): Promise<void> {
  await apiFetch<{ message: string }>('/users/me/allergies', {
    method: 'PUT',
    body: JSON.stringify({ allergies }),
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

// ─── Endpoints de Alérgenos ───────────────────────────────────────────────────

/**
 * GET /allergens
 * Catálogo completo de alérgenos agrupados por categoría.
 * Endpoint PÚBLICO — no requiere autenticación.
 */
export async function getAllergenCatalog(): Promise<AllergenCatalogResponse> {
  return apiFetch<AllergenCatalogResponse>('/allergens');
}

// ─── Endpoints de Productos ───────────────────────────────────────────────────

/**
 * GET /products/{barcode}
 * Búsqueda híbrida: BD local → Open Food Facts → 404.
 * Si el producto no se encontró en ninguna fuente lanza error con status=404
 * y actionRequired='SCAN_LABEL'.
 * Endpoint PÚBLICO — no requiere autenticación.
 */
export async function getProductByBarcode(barcode: string): Promise<BarcodeProductResult> {
  return apiFetch<BarcodeProductResult>(`/products/${encodeURIComponent(barcode)}`);
}

/**
 * Versión del lookup de barcode que devuelve null en vez de lanzar cuando
 * el producto no existe (404/SCAN_LABEL), para que el caller pueda decidir
 * mostrar un Alert o redirigir sin un try/catch extra.
 *
 * Returns:
 *   BarcodeProductResult  → producto encontrado
 *   null                  → producto no encontrado (debe redirigir a OCR)
 */
export async function scanProductByBarcode(
  barcode: string
): Promise<BarcodeProductResult | null> {
  try {
    return await getProductByBarcode(barcode);
  } catch (err: any) {
    // Producto no encontrado en ninguna fuente → redirigir a OCR
    if (err?.status === 404 || err?.errorCode === 'PRODUCT_NOT_FOUND') {
      return null;
    }
    // Cualquier otro error (red, servidor) → propagar
    throw err;
  }
}

// ─── Endpoints de Reportes ────────────────────────────────────────────────────

/**
 * POST /reports
 * Reporta un producto no catalogado (crowdsourcing).
 * Envía multipart/form-data (foto opcional + barcode + notes).
 */
export async function createReport(params: {
  barcode?: string;
  notes?: string;
  photo?: { uri: string; type: string; name: string };
}): Promise<ReportResponse> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const formData = new FormData();
  if (params.barcode) formData.append('barcode', params.barcode);
  if (params.notes) formData.append('notes', params.notes);
  if (params.photo) {
    formData.append('photo', {
      uri: params.photo.uri,
      type: params.photo.type,
      name: params.photo.name,
    } as any);
  }

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // No poner Content-Type manualmente — fetch lo setea con el boundary correcto

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw new Error('No hay conexión a internet. Verifica tu red e intenta de nuevo.');
    }
    throw error;
  }

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().signOut();
      throw new Error('Tu sesión ha expirado. Por favor ingresa de nuevo.');
    }

    const errorBody = await response.json().catch(() => ({}));
    const detail = errorBody.detail ?? errorBody;
    throw new Error(detail.message || `Error ${response.status}`);
  }

  return response.json() as Promise<ReportResponse>;
}

// ─── Health Check ─────────────────────────────────────────────────────────────

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

// ─── Utilidades ───────────────────────────────────────────────────────────────

/**
 * Convierte texto de ingredientes a base64 para enviarlo al endpoint /scan
 * en modo manual. El backend lo tratará como texto OCR.
 */
export function encodeTextAsBase64(text: string): string {
  // En React Native, btoa está disponible globalmente
  // Añadimos padding para garantizar min_length=100 del backend
  const padded = text.padEnd(100, ' ');
  return btoa(unescape(encodeURIComponent(padded)));
}

/**
 * Mapea el AlertLevel del backend ('safe'|'warning'|'danger')
 * al status del store ('safe'|'warning'|'danger') — son idénticos.
 */
export function mapAlertLevelToStatus(
  alertLevel: AlertLevel
): 'safe' | 'warning' | 'danger' {
  return alertLevel;
}

/**
 * Mapea la Severity del backend ('high'|'medium'|'low')
 * al formato del store ('HIGH'|'MED'|'LOW').
 */
export function mapSeverityToStore(severity: Severity): 'HIGH' | 'MED' | 'LOW' {
  switch (severity) {
    case 'high':   return 'HIGH';
    case 'medium': return 'MED';
    case 'low':    return 'LOW';
  }
}
