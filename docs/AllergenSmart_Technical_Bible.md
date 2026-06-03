# 🛡️ AllergenSmart — Biblia Técnica del Proyecto

> **Documento maestro para el desarrollo completo del proyecto.**
> Versión: 2.0 | Fecha: Junio 2026 | Mercado: Manta, Ecuador
> 
> ✅ **ESTADO DE IMPLEMENTACIÓN:** Base de datos y migraciones (Alembic) implementadas con éxito. RLS policies y Triggers (Supabase Auth) activos. Endpoints base de FastAPI corriendo. Resoluciones aplicadas para compatibilidad con Python 3.14.

---

## Tabla de Contenidos

1. [Visión del Producto](#1-visión-del-producto)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico-definitivo)
4. [Estructura del Backend](#4-estructura-del-backend)
5. [Estructura del Frontend](#5-estructura-del-frontend)
6. [Diseño de Base de Datos](#6-diseño-de-base-de-datos)
7. [Contrato de API (Endpoints)](#7-contrato-de-api-restful)
8. [Modelos y Schemas](#8-modelos-y-schemas)
9. [Estrategia de Caché](#9-estrategia-de-caché)
10. [Sistema de Errores](#10-sistema-de-errores-estandarizado)
11. [Seguridad](#11-seguridad)
12. [DevOps y Despliegue](#12-devops-y-despliegue)
13. [Plan de Testing](#13-plan-de-testing)
14. [Script SQL Completo](#14-script-sql-completo)

---

## 1. Visión del Producto

### ¿Qué es AllergenSmart?

Aplicación móvil **preventiva de salud** que escanea etiquetas de alimentos mediante OCR para alertar a los usuarios sobre ingredientes dañinos según sus intolerancias configuradas.

### Problema que resuelve

En Ecuador, el **12% de la población** sufre algún tipo de alergia o intolerancia alimentaria. Leer etiquetas es tedioso, los ingredientes están en letra pequeña, y muchos productos locales usan terminología ambigua ("puede contener trazas de..."). Un error de lectura puede terminar en una reacción alérgica grave.

### Propuesta de valor

| Característica | Descripción |
|---|---|
| **Escaneo instantáneo** | Apunta la cámara → obtén el resultado en < 2 segundos |
| **Perfil personalizado** | Configura tus intolerancias una vez, úsalo siempre |
| **Seguridad primero** | Ante cualquier duda, advierte. Nunca declara "seguro" si hay incertidumbre |
| **Terminología local** | Optimizado para etiquetas ecuatorianas y modismos latinos |
| **Funciona offline** | Cola de operaciones para zonas con conectividad débil en Manta |
| **Crowdsourcing** | Los usuarios agregan productos locales que no están en la base |

### Mercado Objetivo

- **Despliegue inicial**: Manta, Ecuador
- **Idioma**: Español (ecuatoriano)
- **Regulaciones**: Empaque latinoamericano (INEN, ARCSA)
- **Patrones de etiquetado**: "trazas de", "puede contener", "elaborado en líneas que procesan"

---

## 2. Arquitectura del Sistema

### 2.1 Arquitectura de Alto Nivel

```mermaid
graph TB
    subgraph "📱 Cliente Móvil"
        A["React Native + Expo"]
        B["Supabase JS Client"]
        C["AsyncStorage (offline)"]
    end

    subgraph "☁️ Capa de Servicios"
        D["FastAPI (Python 3.11+)"]
        E["Middleware: Auth + RateLimit + CORS"]
    end

    subgraph "🧠 Capa de Procesamiento"
        F["Google Cloud Vision API (OCR)"]
        G["Motor de Normalización"]
        H["Motor de Fuzzy Matching"]
    end

    subgraph "💾 Capa de Datos"
        I["Supabase PostgreSQL"]
        J["Supabase Auth (JWT)"]
        K["Supabase Storage (fotos)"]
        L["OCR Cache (tabla PG)"]
    end

    A -->|"HTTPS + JWT"| D
    A -->|"Realtime/Auth"| J
    A <-->|"Persist local"| C
    
    D -->|"REST"| F
    D --> G --> H
    D <-->|"SQL"| I
    D -->|"R/W"| L
    D -->|"Verify"| J
    B --> J
    B --> K
```

### 2.2 Patrón Arquitectónico: Clean Architecture (Capas)

```mermaid
graph LR
    subgraph "Capa de Presentación (API)"
        R["Routers / Endpoints"]
        M["Middleware"]
    end

    subgraph "Capa de Aplicación (Servicios)"
        S1["ScanService"]
        S2["AllergenService"]
        S3["ProductService"]
        S4["UserService"]
    end

    subgraph "Capa de Dominio (Core)"
        D1["Entidades"]
        D2["Value Objects"]
        D3["Reglas de negocio"]
    end

    subgraph "Capa de Infraestructura"
        I1["SupabaseRepository"]
        I2["VisionAPIClient"]
        I3["CacheRepository"]
    end

    R --> S1
    R --> S3
    R --> S4
    S1 --> S2
    S1 --> D1
    S2 --> D3
    S1 --> I1
    S1 --> I2
    S1 --> I3
```

### 2.3 ¿Por qué Clean Architecture?

| Razón | Beneficio |
|---|---|
| **Separación de responsabilidades** | Cada capa tiene un propósito claro. El servicio de OCR no sabe nada de HTTP. |
| **Testeabilidad** | Puedes testear la lógica de detección de alérgenos sin necesidad de Vision API ni base de datos. |
| **Reemplazabilidad** | Si mañana cambias Vision API por Tesseract local, solo tocas la capa de infraestructura. |
| **Escalabilidad de equipo** | El backend y frontend pueden trabajar en paralelo sin pisarse, gracias a contratos de API claros. |

---

## 3. Stack Tecnológico Definitivo

### 3.1 Backend

| Componente | Tecnología | Versión | Justificación |
|---|---|---|---|
| **Lenguaje** | Python | 3.11+ | Ecosistema maduro para IA/NLP, tipado estático con type hints, mejor rendimiento que 3.10 |
| **Framework** | FastAPI | 0.115+ | Async nativo, validación automática con Pydantic v2, docs auto-generadas (Swagger/ReDoc), mejor rendimiento que Flask/Django para APIs |
| **ORM** | SQLAlchemy 2.0 + asyncpg | 2.0+ | ORM más maduro de Python, soporte async nativo en v2, compatible con Alembic para migraciones |
| **Validación** | Pydantic v2 | 2.9+ | 5-50x más rápido que v1, integración nativa con FastAPI, validación de datos automática |
| **HTTP Client** | httpx | 0.28+ | Async nativo, reemplaza requests para llamadas a Vision API |
| **Auth** | Supabase Auth (JWT) | - | Verificación de tokens JWT en middleware, sin gestionar contraseñas |
| **Rate Limiting** | slowapi | 0.1+ | Rate limiting por usuario/IP basado en token bucket, integrado con FastAPI |
| **Testing** | pytest + pytest-asyncio | 8.0+ | Testing async nativo, fixtures, mocking |
| **Fuzzy Matching** | rapidfuzz | 3.0+ | 10x más rápido que python-Levenshtein, ideal para tolerar errores del OCR |
| **Migraciones** | Alembic | 1.13+ | Versionado de esquema de BD, migraciones reversibles |

> [!IMPORTANT]
> **¿Por qué no Django?** Django es excelente para aplicaciones web completas con admin panel, templates, y ORM integrado. Pero AllergenSmart es una **API pura** — no necesita templates HTML, ni admin panel (Supabase tiene su propio dashboard). FastAPI es 3-10x más rápido en benchmarks para APIs REST y su soporte async nativo es crucial para las llamadas a Vision API sin bloquear el event loop.

> [!IMPORTANT]
> **¿Por qué no Node.js/Express?** Python tiene un ecosistema superior para procesamiento de texto, NLP, y fuzzy matching. Librerías como `rapidfuzz`, `unidecode`, y el manejo de Unicode en español son más maduros en Python. Además, FastAPI iguala o supera el rendimiento de Express para I/O bound workloads.

### 3.2 Frontend (Móvil)

| Componente | Tecnología | Versión | Justificación |
|---|---|---|---|
| **Framework** | React Native + Expo | SDK 54+ | Una base de código → iOS + Android. Expo simplifica cámara, permisos, builds. |
| **Lenguaje** | TypeScript | 5.9+ | Tipo seguro, autocompletado, menos bugs en producción |
| **Navegación** | Expo Router | 6.0+ | File-based routing, similar a Next.js. Más intuitivo que React Navigation. |
| **Cámara** | expo-camera | 17.0+ | CameraView con soporte base64, flash, enfoque |
| **Estado global** | Zustand | 5.0+ | Más simple que Redux, sin boilerplate, ideal para apps medianas |
| **HTTP Client** | Supabase JS + fetch nativo | - | Supabase Client para auth/data, fetch para el backend FastAPI |
| **Almacenamiento local** | AsyncStorage | 2.2+ | Persistencia de perfil, cola offline |
| **Animaciones** | React Native Reanimated | 4.1+ | Animaciones a 60fps en el hilo nativo |
| **BaaS** | Supabase | JS v2 | Auth, Storage, Realtime, PostgreSQL — todo en uno |

> [!IMPORTANT]
> **¿Por qué no Flutter?** React Native con Expo tiene un ecosistema más grande, mejor soporte de paquetes para cámara/OCR, y el equipo ya tiene experiencia con TypeScript/React. Flutter requiere aprender Dart, que tiene menos adopción en el mercado laboral ecuatoriano.

### 3.3 Servicios en la Nube

| Servicio | Plataforma | Uso |
|---|---|---|
| **Base de datos** | Supabase (PostgreSQL 15+) | Datos relacionales, RLS, Auth, Storage |
| **OCR** | Google Cloud Vision API | TEXT_DETECTION en imágenes de etiquetas |
| **Hosting API** | Google Cloud Run | Contenedor Docker serverless, auto-scaling |
| **Hosting frontend** | Expo EAS | Builds nativos (APK/IPA), OTA updates |
| **Monitoreo** | Sentry | Crash reporting para mobile + backend |

### 3.4 ¿Por qué Supabase en lugar de Firebase?

| Criterio | Firebase (Firestore) | Supabase (PostgreSQL) | Ganador |
|---|---|---|---|
| **Modelo de datos** | NoSQL (documentos) | SQL Relacional | ✅ Supabase — Los alérgenos, usuarios y productos tienen relaciones claras (N:M). Firestore no tiene JOINs. |
| **Consultas complejas** | Limitadas (sin JOINs, filtros básicos) | SQL completo, subqueries, CTEs | ✅ Supabase — "Dame todos los escaneos donde se detectó gluten en junio" es un SQL trivial, imposible en Firestore sin desnormalizar. |
| **Seguridad** | Reglas JSON frágiles | Row Level Security (SQL nativo) | ✅ Supabase — RLS es más robusto y auditable. |
| **Costos** | Lectura/escritura por documento | Por tiempo de cómputo y storage | ✅ Supabase — Precio predecible. Firestore cobra por lectura, una query que devuelve 100 docs = 100 lecturas facturadas. |
| **Auth** | Firebase Auth | Supabase Auth (compatible) | Empate — Ambos son excelentes. |
| **Migraciones** | No existen | Alembic / SQL scripts | ✅ Supabase — Esquema versionado. |
| **Open Source** | No | Sí | ✅ Supabase — Sin vendor lock-in. |
| **Free Tier** | Generous but unpredictable | 500MB DB, 1GB storage, 50K MAU | Empate |

---

## 4. Estructura del Backend

```
backend/
├── alembic/                        # Migraciones de base de datos
│   ├── versions/                   # Archivos de migración
│   └── env.py
│
├── app/
│   ├── __init__.py
│   ├── main.py                     # Punto de entrada FastAPI
│   ├── config.py                   # Settings con pydantic-settings
│   │
│   ├── api/                        # 🟢 Capa de Presentación
│   │   ├── __init__.py
│   │   ├── deps.py                 # Dependencias inyectables (get_db, get_current_user)
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py           # Router principal v1
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── scan.py         # POST /scan
│   │           ├── products.py     # GET /products/{barcode}
│   │           ├── allergens.py    # GET /allergens (catálogo)
│   │           ├── users.py        # GET/PUT /users/me
│   │           └── reports.py      # POST /reports
│   │
│   ├── services/                   # 🟡 Capa de Aplicación (lógica de negocio)
│   │   ├── __init__.py
│   │   ├── scan_service.py         # Orquesta el flujo completo de escaneo
│   │   ├── allergen_service.py     # Detección de alérgenos + fuzzy matching
│   │   ├── text_normalizer.py      # Normalización de texto OCR
│   │   ├── product_service.py      # CRUD de productos
│   │   ├── user_service.py         # Gestión de perfiles y alergias
│   │   └── cache_service.py        # Lógica de caché OCR
│   │
│   ├── infrastructure/             # 🔴 Capa de Infraestructura
│   │   ├── __init__.py
│   │   ├── database.py             # Conexión async a PostgreSQL
│   │   ├── vision_client.py        # Cliente Google Cloud Vision API
│   │   └── storage_client.py       # Cliente Supabase Storage
│   │
│   ├── repositories/               # 🔵 Patrón Repository (acceso a datos)
│   │   ├── __init__.py
│   │   ├── base.py                 # Repositorio base genérico
│   │   ├── product_repo.py         # Queries de productos
│   │   ├── allergen_repo.py        # Queries de alérgenos
│   │   ├── scan_history_repo.py    # Queries de historial
│   │   ├── user_repo.py            # Queries de usuarios
│   │   └── cache_repo.py           # Queries de caché OCR
│   │
│   ├── models/                     # 🟣 Modelos SQLAlchemy (mapean a tablas)
│   │   ├── __init__.py
│   │   ├── base.py                 # Base declarativa
│   │   ├── user.py                 # Profile, UserAllergy
│   │   ├── allergen.py             # AllergenCategory, Allergen
│   │   ├── product.py              # Product
│   │   ├── scan.py                 # ScanHistory
│   │   ├── report.py               # ProductReport
│   │   └── cache.py                # OCRCache
│   │
│   ├── schemas/                    # 🟠 Schemas Pydantic (DTOs de entrada/salida)
│   │   ├── __init__.py
│   │   ├── scan.py                 # ScanRequest, ScanResponse
│   │   ├── product.py              # ProductResponse, ProductCreate
│   │   ├── allergen.py             # AllergenResponse, CategoryResponse
│   │   ├── user.py                 # UserProfileResponse, UserAllergyUpdate
│   │   ├── report.py               # ReportCreate, ReportResponse
│   │   ├── error.py                # ErrorResponse (contrato de errores)
│   │   └── common.py               # Enums compartidos (AlertLevel, MatchType)
│   │
│   └── core/                       # ⚙️ Utilidades transversales
│       ├── __init__.py
│       ├── exceptions.py           # Excepciones de dominio
│       ├── security.py             # Verificación JWT, middlewares
│       └── rate_limiter.py         # Configuración de rate limiting
│
├── tests/
│   ├── conftest.py                 # Fixtures compartidos
│   ├── test_allergen_service.py
│   ├── test_text_normalizer.py
│   ├── test_scan_endpoint.py
│   └── test_fuzzy_matching.py
│
├── .env.example
├── .env
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── alembic.ini
```

> [!TIP]
> **Diferencia clave: `models/` vs `schemas/`**
> - `models/` → SQLAlchemy. Representan las **tablas de la base de datos**. Nunca se exponen al frontend.
> - `schemas/` → Pydantic. Representan los **contratos de la API** (request/response). Son lo que el frontend ve.
> - Un endpoint recibe un `ScanRequest` (schema), opera internamente con `Product` (model), y devuelve un `ScanResponse` (schema).

---

## 5. Estructura del Frontend

```
frontend/
├── app/                            # 📱 Pantallas (Expo Router - file-based)
│   ├── _layout.tsx                 # Layout raíz con providers
│   ├── index.tsx                   # Pantalla: Perfil de Salud
│   ├── scanner.tsx                 # Pantalla: Escáner con cámara
│   ├── result.tsx                  # Pantalla: Resultado del escaneo
│   ├── history.tsx                 # Pantalla: Historial de escaneos
│   └── (auth)/                     # Grupo de autenticación
│       ├── login.tsx
│       └── register.tsx
│
├── components/                     # 🧩 Componentes reutilizables
│   ├── ui/                         # Componentes genéricos (Button, Card, Modal)
│   ├── AllergenCheckbox.tsx
│   ├── ResultBanner.tsx
│   ├── ScannerOverlay.tsx
│   └── HistoryCard.tsx
│
├── services/                       # 🔌 Capa de servicios
│   ├── supabaseClient.ts           # Inicialización Supabase
│   ├── supabaseService.ts          # CRUD vía Supabase JS
│   ├── apiService.ts               # Llamadas al backend FastAPI
│   └── offlineQueue.ts             # Cola de operaciones offline
│
├── stores/                         # 📦 Estado global (Zustand)
│   ├── useAuthStore.ts             # Estado de autenticación
│   ├── useAllergenStore.ts         # Restricciones del usuario
│   └── useScanStore.ts             # Estado del escaneo actual
│
├── hooks/                          # 🪝 Hooks personalizados
│   ├── useAllergenProfile.ts
│   └── useNetworkStatus.ts
│
├── types/                          # 📝 Tipos TypeScript
│   └── index.ts
│
├── constants/                      # ⚡ Constantes
│   └── allergens.ts
│
├── utils/                          # 🔧 Utilidades
│   └── formatters.ts
│
└── assets/                         # 🎨 Recursos estáticos
    ├── fonts/
    └── images/
```

---

## 6. Diseño de Base de Datos

### 6.1 Diagrama Entidad-Relación

```mermaid
erDiagram
    profiles ||--o{ user_allergies : "configura"
    profiles ||--o{ scan_history : "registra"
    profiles ||--o{ product_reports : "reporta"
    
    allergen_categories ||--o{ allergens : "agrupa"
    allergens ||--o{ user_allergies : "se asigna"
    
    products ||--o{ scan_history : "es escaneado"
    products ||--o{ product_reports : "es reportado"
    
    products ||--o| ocr_cache : "tiene caché"

    profiles {
        uuid id PK
        text full_name
        text city
        text avatar_url
        boolean notifications_enabled
        timestamptz created_at
        timestamptz updated_at
    }

    allergen_categories {
        uuid id PK
        text name UK
        text icon_emoji
        text description
        int display_order
    }

    allergens {
        uuid id PK
        uuid category_id FK
        text name UK
        text[] scientific_names
        text[] synonyms
        text[] ocr_variants
        boolean is_active
    }

    user_allergies {
        uuid id PK
        uuid user_id FK
        uuid allergen_id FK
        text severity
        timestamptz created_at
    }

    products {
        uuid id PK
        text barcode UK
        text name
        text brand
        text ingredients_raw
        text[] ingredients_array
        text image_url
        boolean verified_by_admin
        uuid verified_by FK
        timestamptz verified_at
        text country_origin
        timestamptz created_at
        timestamptz updated_at
    }

    scan_history {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        text result_status
        jsonb detected_allergens
        float ocr_confidence
        text[] ingredients_found
        int processing_time_ms
        boolean from_cache
        timestamptz scanned_at
    }

    product_reports {
        uuid id PK
        uuid reported_by FK
        uuid product_id FK
        text barcode
        text photo_url
        text notes
        text status
        uuid reviewed_by FK
        timestamptz reviewed_at
        timestamptz created_at
    }

    ocr_cache {
        uuid id PK
        text barcode UK
        text ocr_text
        text[] ingredients_extracted
        text[] warnings_extracted
        float ocr_confidence
        timestamptz expires_at
        timestamptz created_at
    }
```

### 6.2 Detalle de Tablas

#### `profiles` — Perfil del usuario
> Extiende `auth.users` de Supabase. Se crea automáticamente con un trigger al registrarse.

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | PK, FK → auth.users.id, ON DELETE CASCADE | Mismo ID que Supabase Auth |
| `full_name` | `TEXT` | DEFAULT `''` | Nombre completo |
| `city` | `TEXT` | DEFAULT `'Manta'` | Ciudad del usuario |
| `avatar_url` | `TEXT` | NULLABLE | URL de foto de perfil en Supabase Storage |
| `notifications_enabled` | `BOOLEAN` | DEFAULT `true` | Prefiere notificaciones push |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Auto-actualizado por trigger |

---

#### `allergen_categories` — Categorías de alérgenos
> Permite agrupar: "Lácteos" agrupa lactosa, caseína, suero, etc.

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | |
| `name` | `TEXT` | NOT NULL, UNIQUE | Ej: "Lácteos", "Frutos Secos" |
| `icon_emoji` | `TEXT` | | Emoji para la UI: 🥛, 🥜 |
| `description` | `TEXT` | | Descripción para el usuario |
| `display_order` | `INT` | DEFAULT `0` | Orden en la UI |

---

#### `allergens` — Catálogo de alérgenos
> Corazón del sistema. Contiene los sinónimos y variantes OCR que alimentan el motor de detección.

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | |
| `category_id` | `UUID` | FK → allergen_categories.id, ON DELETE SET NULL | Categoría padre |
| `name` | `TEXT` | NOT NULL, UNIQUE | Nombre normalizado: `"gluten"`, `"lactosa"` |
| `scientific_names` | `TEXT[]` | DEFAULT `'{}'` | Ej: `{"Triticum aestivum"}` — para referencia técnica |
| `synonyms` | `TEXT[]` | NOT NULL, DEFAULT `'{}'` | **Clave del sistema.** Términos comerciales que aparecen en etiquetas. Ej: `{"harina de trigo", "sémola", "salvado"}` |
| `ocr_variants` | `TEXT[]` | DEFAULT `'{}'` | Errores comunes del OCR: `{"glten", "gIuten", "g1uten"}` |
| `is_active` | `BOOLEAN` | DEFAULT `true` | Soft-disable sin borrar |

> [!TIP]
> **¿Por qué `synonyms` separado de `scientific_names`?** El motor de fuzzy matching busca en `synonyms` (términos que aparecen en etiquetas reales), mientras que `scientific_names` es para referencia técnica y un futuro módulo educativo. "Harina de trigo" no es un nombre científico.

> [!TIP]
> **¿Por qué `ocr_variants` como columna separada?** Porque la distancia de Levenshtein tiene un costo computacional. Si ya sabemos que el OCR lee "glten" en vez de "gluten", un lookup exacto en `ocr_variants` es O(1) vs. calcular Levenshtein contra todos los sinónimos que es O(n×m). Se usa como **fast path** antes del fuzzy matching costoso.

---

#### `user_allergies` — Restricciones del usuario (tabla pivote N:M)

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | |
| `user_id` | `UUID` | FK → profiles.id, ON DELETE CASCADE, NOT NULL | |
| `allergen_id` | `UUID` | FK → allergens.id, ON DELETE CASCADE, NOT NULL | |
| `severity` | `TEXT` | CHECK IN (`'high'`, `'medium'`, `'low'`), DEFAULT `'high'` | Severidad de la alergia |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | |

**Constraints:** `UNIQUE(user_id, allergen_id)`

> [!NOTE]
> **`severity`** permite que el sistema muestre 🔴 PELIGRO para alergias de severidad `high` y 🟡 ADVERTENCIA para `medium`/`low`. Un paciente celíaco (high) necesita un nivel de alerta distinto a alguien con sensibilidad leve a la lactosa (low).

---

#### `products` — Catálogo de productos escaneados

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | |
| `barcode` | `TEXT` | UNIQUE, NULLABLE | Código de barras. Nullable para productos sin código (suplementos, productos artesanales de Manta) |
| `name` | `TEXT` | | Nombre del producto |
| `brand` | `TEXT` | | Marca |
| `ingredients_raw` | `TEXT` | | Texto crudo completo del OCR |
| `ingredients_array` | `TEXT[]` | DEFAULT `'{}'` | Ingredientes procesados y normalizados |
| `image_url` | `TEXT` | | URL de la foto de la etiqueta en Supabase Storage |
| `verified_by_admin` | `BOOLEAN` | DEFAULT `false` | ¿Un admin verificó los ingredientes? |
| `verified_by` | `UUID` | FK → profiles.id, NULLABLE | Quién verificó |
| `verified_at` | `TIMESTAMPTZ` | NULLABLE | Cuándo se verificó |
| `country_origin` | `TEXT` | DEFAULT `'EC'` | País de origen (ISO 3166-1 alpha-2) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Auto-actualizado por trigger |

---

#### `scan_history` — Historial de escaneos

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | |
| `user_id` | `UUID` | FK → profiles.id, ON DELETE CASCADE, NOT NULL | |
| `product_id` | `UUID` | FK → products.id, NULLABLE | Null si el producto no se pudo identificar/guardar |
| `barcode` | `TEXT` | NULLABLE | Denormalizado para queries rápidos sin JOIN |
| `result_status` | `TEXT` | CHECK IN (`'safe'`, `'warning'`, `'danger'`), NOT NULL | |
| `detected_allergens` | `JSONB` | DEFAULT `'[]'` | Array de `{nombre, tipo_coincidencia, ingrediente_fuente}` |
| `ocr_confidence` | `REAL` | CHECK (>= 0.0 AND <= 1.0) | Confianza del OCR |
| `ingredients_found` | `TEXT[]` | DEFAULT `'{}'` | Ingredientes que el sistema detectó |
| `processing_time_ms` | `INT` | NULLABLE | Tiempo total de procesamiento |
| `from_cache` | `BOOLEAN` | DEFAULT `false` | ¿Se usó caché o Vision API? |
| `scanned_at` | `TIMESTAMPTZ` | DEFAULT `now()` | |

> [!TIP]
> **`detected_allergens` como JSONB:** Para analytics es perfecto. No necesitas JOINs sobre los alérgenos de cada escaneo. PostgreSQL soporta queries tipo `WHERE detected_allergens @> '[{"nombre": "gluten"}]'` para reportes.

---

#### `product_reports` — Crowdsourcing

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | |
| `reported_by` | `UUID` | FK → profiles.id, NOT NULL | |
| `product_id` | `UUID` | FK → products.id, NULLABLE | Si el producto ya existe |
| `barcode` | `TEXT` | NULLABLE | Barcode del producto nuevo |
| `photo_url` | `TEXT` | | URL de la foto en Supabase Storage |
| `notes` | `TEXT` | | Notas del usuario |
| `status` | `TEXT` | CHECK IN (`'pending'`, `'approved'`, `'rejected'`), DEFAULT `'pending'` | |
| `reviewed_by` | `UUID` | FK → profiles.id, NULLABLE | Admin que revisó |
| `reviewed_at` | `TIMESTAMPTZ` | NULLABLE | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | |

---

#### `ocr_cache` — Caché de resultados OCR

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | |
| `barcode` | `TEXT` | UNIQUE, NOT NULL | Barcode como clave de caché |
| `ocr_text` | `TEXT` | | Texto completo extraído |
| `ingredients_extracted` | `TEXT[]` | DEFAULT `'{}'` | Ingredientes ya procesados |
| `warnings_extracted` | `TEXT[]` | DEFAULT `'{}'` | Frases de advertencia detectadas |
| `ocr_confidence` | `REAL` | | Confianza del OCR |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now() + interval '30 days'` | TTL de 30 días |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | |

> [!NOTE]
> **¿Por qué una tabla PostgreSQL y no Redis?** Para el MVP con cientos de usuarios en Manta, una tabla con índice en `barcode` y limpieza periódica por `expires_at` es suficiente (latencia < 5ms). Redis agrega un servicio más que configurar, mantener y pagar. Cuando escales a miles de usuarios concurrentes, pones Redis delante sin cambiar la lógica.

---

### 6.3 Índices de Rendimiento

```sql
-- Productos por barcode (query más frecuente del sistema)
-- Ya es UNIQUE, PostgreSQL crea índice automáticamente

-- Historial por usuario, ordenado por fecha (pantalla de historial)
CREATE INDEX idx_scan_history_user_date ON scan_history(user_id, scanned_at DESC);

-- Caché: limpieza por expiración (cron job)
CREATE INDEX idx_ocr_cache_expires ON ocr_cache(expires_at);

-- Búsqueda en arrays de sinónimos (GIN = Generalized Inverted Index)
CREATE INDEX idx_allergens_synonyms ON allergens USING GIN(synonyms);
CREATE INDEX idx_allergens_ocr_variants ON allergens USING GIN(ocr_variants);

-- Reportes pendientes (panel admin)
CREATE INDEX idx_reports_pending ON product_reports(status) WHERE status = 'pending';

-- Alergias del usuario (JOINs frecuentes al escanear)
CREATE INDEX idx_user_allergies_user ON user_allergies(user_id);

-- Productos por marca (búsquedas futuras)
CREATE INDEX idx_products_brand ON products(brand) WHERE brand IS NOT NULL;
```

### 6.4 Row Level Security (RLS)

```sql
-- profiles: solo tu propio perfil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- user_allergies: solo tus propias alergias
ALTER TABLE user_allergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own allergies" ON user_allergies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own allergies" ON user_allergies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own allergies" ON user_allergies FOR DELETE USING (auth.uid() = user_id);

-- scan_history: solo tu propio historial
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scans" ON scan_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans" ON scan_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- products: lectura pública, escritura solo via service_role (backend)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read products" ON products FOR SELECT USING (true);

-- allergens & categories: lectura pública (catálogo)
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergen_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read allergens" ON allergens FOR SELECT USING (true);
CREATE POLICY "Anyone can read categories" ON allergen_categories FOR SELECT USING (true);

-- product_reports: crear y ver los propios
ALTER TABLE product_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON product_reports FOR SELECT USING (auth.uid() = reported_by);
CREATE POLICY "Users can create reports" ON product_reports FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- ocr_cache: solo accesible via service_role (backend)
ALTER TABLE ocr_cache ENABLE ROW LEVEL SECURITY;
-- Sin policies = solo el backend con service_role_key puede leer/escribir
```

---

## 7. Contrato de API RESTful

### Base URL

```
Desarrollo:  http://localhost:8000/api/v1
Producción:  https://api.allergensmart.app/api/v1
```

### Autenticación

Todos los endpoints (excepto los marcados como 🌐 público) requieren un header:
```
Authorization: Bearer <supabase_jwt_token>
```

---

### 7.1 Escaneo

#### `POST /api/v1/scan` — Escanear etiqueta de alimento

> **El endpoint más importante del sistema.** Recibe la imagen, hace OCR, detecta alérgenos y responde.

**Request:**
```json
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
  "barcode": "7861000123456"  // Opcional: si el usuario escaneó un código de barras
}
```

> [!IMPORTANT]
> **Cambio vs. versión anterior:** Ya no se envían `restricciones_usuario` en el request. El backend las obtiene directamente de la tabla `user_allergies` usando el `user_id` del JWT. Esto es más seguro (el usuario no puede manipular sus restricciones en el request) y más limpio.

**Response (200 OK):**
```json
{
  "success": true,
  "alert_level": "danger",
  "message": "⚠️ PELIGRO: Se detectaron los siguientes alérgenos: gluten, lactosa. Este producto NO es seguro para tu perfil.",
  "confidence": 0.87,
  "from_cache": false,
  "processing_time_ms": 1432,
  "product": {
    "barcode": "7861000123456",
    "name": "Galletas Amor",
    "brand": "Nestlé"
  },
  "detected_text": "ingredientes: harina de trigo, azúcar, aceite vegetal, leche en polvo...",
  "ingredients": ["harina de trigo", "azúcar", "aceite vegetal", "leche en polvo", "sal"],
  "allergens_found": [
    {
      "name": "gluten",
      "match_type": "direct",
      "source_ingredient": "harina de trigo",
      "severity": "high"
    },
    {
      "name": "lactosa",
      "match_type": "direct",
      "source_ingredient": "leche en polvo",
      "severity": "medium"
    }
  ],
  "warnings": ["puede contener trazas de maní y soya"]
}
```

---

### 7.2 Productos

#### `GET /api/v1/products/{barcode}` — Buscar producto por código de barras 🌐

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "barcode": "7861000123456",
  "name": "Galletas Amor",
  "brand": "Nestlé",
  "ingredients_array": ["harina de trigo", "azúcar", "aceite vegetal"],
  "verified_by_admin": true,
  "country_origin": "EC"
}
```

**Response (404 Not Found):**
```json
{
  "error_code": "PRODUCT_NOT_FOUND",
  "message": "No se encontró un producto con el código de barras proporcionado.",
  "action_required": "SCAN_LABEL"
}
```

---

### 7.3 Alérgenos

#### `GET /api/v1/allergens` — Obtener catálogo de alérgenos 🌐

> El frontend carga esta lista al iniciar para mostrar los checkboxes de selección. Reemplaza la constante hardcodeada `ALERGENOS_DISPONIBLES`.

**Response (200 OK):**
```json
{
  "categories": [
    {
      "id": "uuid-1",
      "name": "Cereales con Gluten",
      "icon_emoji": "🌾",
      "description": "Trigo, cebada, centeno, avena y derivados",
      "allergens": [
        {
          "id": "uuid-a",
          "name": "gluten",
          "synonyms": ["trigo", "cebada", "centeno", "harina de trigo"],
          "is_active": true
        }
      ]
    },
    {
      "id": "uuid-2",
      "name": "Lácteos",
      "icon_emoji": "🥛",
      "allergens": [
        {
          "id": "uuid-b",
          "name": "lactosa",
          "synonyms": ["leche", "caseína", "suero de leche"]
        }
      ]
    }
  ]
}
```

---

### 7.4 Usuario

#### `GET /api/v1/users/me` — Obtener perfil del usuario autenticado

**Response (200 OK):**
```json
{
  "id": "uuid-user",
  "full_name": "Juan Pérez",
  "city": "Manta",
  "notifications_enabled": true,
  "allergies": [
    {
      "allergen_id": "uuid-a",
      "allergen_name": "gluten",
      "category_name": "Cereales con Gluten",
      "severity": "high"
    },
    {
      "allergen_id": "uuid-b",
      "allergen_name": "lactosa",
      "category_name": "Lácteos",
      "severity": "medium"
    }
  ]
}
```

#### `PUT /api/v1/users/me` — Actualizar perfil

**Request:**
```json
{
  "full_name": "Juan Pérez",
  "city": "Manta",
  "notifications_enabled": false
}
```

#### `PUT /api/v1/users/me/allergies` — Actualizar restricciones alimentarias

**Request:**
```json
{
  "allergies": [
    { "allergen_id": "uuid-a", "severity": "high" },
    { "allergen_id": "uuid-b", "severity": "medium" },
    { "allergen_id": "uuid-c", "severity": "low" }
  ]
}
```

> [!NOTE]
> Esta operación es **idempotente**: reemplaza todas las alergias del usuario con la nueva lista. No es incremental (agregar/quitar una). Esto evita problemas de concurrencia si el usuario cambia su perfil en dos dispositivos.

---

### 7.5 Historial

#### `GET /api/v1/users/me/scans?limit=20&offset=0` — Historial de escaneos

**Response (200 OK):**
```json
{
  "total": 47,
  "items": [
    {
      "id": "uuid-scan",
      "barcode": "7861000123456",
      "product_name": "Galletas Amor",
      "result_status": "danger",
      "allergens_found": ["gluten", "lactosa"],
      "confidence": 0.87,
      "from_cache": true,
      "scanned_at": "2026-06-02T14:30:00Z"
    }
  ]
}
```

---

### 7.6 Reportes

#### `POST /api/v1/reports` — Reportar producto nuevo (crowdsourcing)

**Request (multipart/form-data):**
```
barcode: "7861000654321"
notes: "Producto local de Manta, panadería Don José"
photo: <archivo de imagen>
```

**Response (201 Created):**
```json
{
  "id": "uuid-report",
  "status": "pending",
  "message": "Gracias por tu reporte. Será revisado por nuestro equipo."
}
```

---

### 7.7 Health Check

#### `GET /` — Estado del servidor 🌐

```json
{
  "status": "healthy",
  "app": "AllergenSmart API",
  "version": "2.0.0",
  "environment": "production"
}
```

---

## 8. Modelos y Schemas

### 8.1 Schemas Pydantic (DTOs de la API)

```python
# ================================================
# schemas/common.py — Enums compartidos
# ================================================
from enum import Enum

class AlertLevel(str, Enum):
    SAFE = "safe"
    WARNING = "warning"
    DANGER = "danger"

class MatchType(str, Enum):
    DIRECT = "direct"       # Ingrediente contiene el alérgeno
    TRACE = "trace"         # "contiene trazas de..."
    POSSIBLE = "possible"   # "puede contener..."

class Severity(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class ReportStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# ================================================
# schemas/scan.py — Escaneo
# ================================================
from pydantic import BaseModel, Field
from typing import Optional
from .common import AlertLevel, MatchType, Severity

class ScanRequest(BaseModel):
    image_base64: str = Field(
        ...,
        min_length=100,
        description="Imagen de la etiqueta codificada en base64",
    )
    barcode: Optional[str] = Field(
        None,
        description="Código de barras (opcional, si se escaneó por separado)",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJR...",
                "barcode": "7861000123456"
            }]
        }
    }

class AllergenMatch(BaseModel):
    name: str = Field(..., description="Nombre del alérgeno detectado")
    match_type: MatchType = Field(..., description="Tipo de coincidencia")
    source_ingredient: str = Field(..., description="Ingrediente fuente")
    severity: Severity = Field(Severity.HIGH, description="Severidad de la alergia del usuario")

class ProductBrief(BaseModel):
    barcode: Optional[str] = None
    name: Optional[str] = None
    brand: Optional[str] = None

class ScanResponse(BaseModel):
    success: bool
    alert_level: AlertLevel
    message: str
    confidence: float = Field(ge=0.0, le=1.0)
    from_cache: bool = False
    processing_time_ms: Optional[int] = None
    product: Optional[ProductBrief] = None
    detected_text: str = ""
    ingredients: list[str] = []
    allergens_found: list[AllergenMatch] = []
    warnings: list[str] = []


# ================================================
# schemas/allergen.py — Catálogo de alérgenos
# ================================================
class AllergenResponse(BaseModel):
    id: str
    name: str
    synonyms: list[str] = []
    is_active: bool = True

class CategoryResponse(BaseModel):
    id: str
    name: str
    icon_emoji: Optional[str] = None
    description: Optional[str] = None
    allergens: list[AllergenResponse] = []

class AllergenCatalogResponse(BaseModel):
    categories: list[CategoryResponse]


# ================================================
# schemas/user.py — Usuario
# ================================================
class UserAllergyItem(BaseModel):
    allergen_id: str
    allergen_name: Optional[str] = None
    category_name: Optional[str] = None
    severity: Severity = Severity.HIGH

class UserProfileResponse(BaseModel):
    id: str
    full_name: str
    city: str
    notifications_enabled: bool
    allergies: list[UserAllergyItem] = []

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    city: Optional[str] = None
    notifications_enabled: Optional[bool] = None

class UserAllergiesUpdate(BaseModel):
    allergies: list[dict]  # [{allergen_id, severity}]


# ================================================
# schemas/error.py — Contrato de errores
# ================================================
class ErrorResponse(BaseModel):
    error_code: str = Field(
        ..., description="Código de error legible por máquina"
    )
    message: str = Field(
        ..., description="Mensaje de error legible por humano (español)"
    )
    action_required: Optional[str] = Field(
        None, description="Acción que el frontend debe ejecutar"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "error_code": "OCR_UNREADABLE",
                "message": "La imagen está demasiado borrosa. Por favor, intenta de nuevo.",
                "action_required": "RETAKE_PHOTO"
            }]
        }
    }
```

### 8.2 Modelos SQLAlchemy (Mapeo a tablas)

```python
# ================================================
# models/base.py
# ================================================
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import func
from datetime import datetime
import uuid

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())


# ================================================
# models/allergen.py
# ================================================
from sqlalchemy import String, Integer, Boolean, ForeignKey, ARRAY
from sqlalchemy.orm import relationship

class AllergenCategory(Base):
    __tablename__ = "allergen_categories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    icon_emoji: Mapped[str | None] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String)
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    allergens: Mapped[list["Allergen"]] = relationship(back_populates="category")

class Allergen(Base):
    __tablename__ = "allergens"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("allergen_categories.id"))
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    scientific_names: Mapped[list[str]] = mapped_column(ARRAY(String), default=[])
    synonyms: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=[])
    ocr_variants: Mapped[list[str]] = mapped_column(ARRAY(String), default=[])
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    category: Mapped["AllergenCategory"] = relationship(back_populates="allergens")


# ================================================
# models/user.py
# ================================================
class Profile(Base, TimestampMixin):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)  # = auth.users.id
    full_name: Mapped[str] = mapped_column(String, default="")
    city: Mapped[str] = mapped_column(String, default="Manta")
    avatar_url: Mapped[str | None] = mapped_column(String)
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    allergies: Mapped[list["UserAllergy"]] = relationship(back_populates="user")
    scans: Mapped[list["ScanHistory"]] = relationship(back_populates="user")

class UserAllergy(Base):
    __tablename__ = "user_allergies"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"))
    allergen_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("allergens.id", ondelete="CASCADE"))
    severity: Mapped[str] = mapped_column(String, default="high")
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    user: Mapped["Profile"] = relationship(back_populates="allergies")
    allergen: Mapped["Allergen"] = relationship()


# ================================================
# models/product.py
# ================================================
class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    barcode: Mapped[str | None] = mapped_column(String, unique=True)
    name: Mapped[str | None] = mapped_column(String)
    brand: Mapped[str | None] = mapped_column(String)
    ingredients_raw: Mapped[str | None] = mapped_column(String)
    ingredients_array: Mapped[list[str]] = mapped_column(ARRAY(String), default=[])
    image_url: Mapped[str | None] = mapped_column(String)
    verified_by_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("profiles.id"))
    verified_at: Mapped[datetime | None] = mapped_column()
    country_origin: Mapped[str] = mapped_column(String, default="EC")


# ================================================
# models/scan.py
# ================================================
from sqlalchemy import Float, JSON

class ScanHistory(Base):
    __tablename__ = "scan_history"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"))
    product_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("products.id"))
    barcode: Mapped[str | None] = mapped_column(String)
    result_status: Mapped[str] = mapped_column(String, nullable=False)
    detected_allergens: Mapped[dict] = mapped_column(JSON, default=[])
    ocr_confidence: Mapped[float | None] = mapped_column(Float)
    ingredients_found: Mapped[list[str]] = mapped_column(ARRAY(String), default=[])
    processing_time_ms: Mapped[int | None] = mapped_column(Integer)
    from_cache: Mapped[bool] = mapped_column(Boolean, default=False)
    scanned_at: Mapped[datetime] = mapped_column(default=func.now())

    user: Mapped["Profile"] = relationship(back_populates="scans")
    product: Mapped["Product"] = relationship()


# ================================================
# models/cache.py
# ================================================
class OCRCache(Base):
    __tablename__ = "ocr_cache"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    barcode: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    ocr_text: Mapped[str | None] = mapped_column(String)
    ingredients_extracted: Mapped[list[str]] = mapped_column(ARRAY(String), default=[])
    warnings_extracted: Mapped[list[str]] = mapped_column(ARRAY(String), default=[])
    ocr_confidence: Mapped[float | None] = mapped_column(Float)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
```

---

## 9. Estrategia de Caché

### Flujo de decisión de caché

```mermaid
flowchart TD
    A["📱 Llega imagen + barcode (opcional)"] --> B{"¿Tiene barcode?"}
    
    B -->|No| F["🔍 Enviar a Cloud Vision API"]
    B -->|Sí| C{"¿Existe en tabla products\ny verified_by_admin = true?"}
    
    C -->|Sí| D["✅ Cache L1: Leer ingredientes de products\nLatencia: ~5ms | Costo: $0"]
    C -->|No| E{"¿Existe en ocr_cache\ny expires_at > now()?"}
    
    E -->|Sí| G["✅ Cache L2: Leer OCR procesado\nLatencia: ~5ms | Costo: $0"]
    E -->|No| F
    
    F --> H["📝 Procesar texto OCR\nLatencia: ~1500ms | Costo: ~$0.0015/imagen"]
    H --> I["💾 Guardar en ocr_cache\n(TTL: 30 días)"]
    
    D --> J["⚡ Cruzar con user_allergies"]
    G --> J
    I --> J
    
    J --> K["📤 Responder al usuario"]
    
    style D fill:#00c853,color:#fff
    style G fill:#00c853,color:#fff
    style F fill:#f44336,color:#fff
```

### Niveles de caché

| Nivel | Fuente | Latencia | Costo | Confiabilidad |
|---|---|---|---|---|
| **L1** | `products` con `verified_by_admin = true` | ~5ms | $0 | ⭐⭐⭐⭐⭐ (verificado por admin) |
| **L2** | `ocr_cache` con TTL de 30 días | ~5ms | $0 | ⭐⭐⭐ (OCR automático, no verificado) |
| **L3** | Google Cloud Vision API (miss) | ~1500ms | ~$0.0015 | ⭐⭐⭐⭐ (depende de calidad de imagen) |

### Ahorro estimado

Si 100 usuarios en Manta escanean las mismas "Ruffles sabor queso":
- **Sin caché**: 100 × $0.0015 = $0.15 y 100 × 1500ms de espera
- **Con caché**: $0.0015 (1 llamada) + 99 × ~5ms = $0.0015 total

---

## 10. Sistema de Errores Estandarizado

### Formato obligatorio

Todos los errores HTTP 400+ **deben** devolver esta estructura:

```json
{
  "error_code": "STRING_CONSTANTE",
  "message": "Mensaje para el usuario en español",
  "action_required": "ACCIÓN_PARA_EL_FRONTEND"
}
```

### Catálogo de errores

| HTTP | `error_code` | `message` | `action_required` |
|---|---|---|---|
| 400 | `INVALID_IMAGE` | "La imagen proporcionada no es válida o está corrupta." | `RETAKE_PHOTO` |
| 400 | `IMAGE_TOO_LARGE` | "La imagen excede el tamaño máximo de 5 MB." | `COMPRESS_IMAGE` |
| 400 | `MISSING_IMAGE` | "No se proporcionó una imagen para escanear." | `RETAKE_PHOTO` |
| 401 | `UNAUTHORIZED` | "Tu sesión ha expirado. Inicia sesión nuevamente." | `REDIRECT_LOGIN` |
| 404 | `PRODUCT_NOT_FOUND` | "No se encontró un producto con ese código de barras." | `SCAN_LABEL` |
| 422 | `OCR_UNREADABLE` | "La imagen está demasiado borrosa. Intenta con mejor iluminación." | `RETAKE_PHOTO` |
| 422 | `OCR_NO_TEXT` | "No se detectó texto en la imagen. Enfoca la sección de ingredientes." | `RETAKE_PHOTO` |
| 429 | `RATE_LIMITED` | "Has excedido el límite de 10 escaneos por minuto. Espera un momento." | `WAIT_AND_RETRY` |
| 502 | `VISION_API_ERROR` | "El servicio de reconocimiento de texto no está disponible. Intenta más tarde." | `RETRY_LATER` |
| 503 | `SERVICE_UNAVAILABLE` | "El servidor está en mantenimiento. Intenta en unos minutos." | `RETRY_LATER` |

> [!IMPORTANT]
> **Regla para el backend:** Nunca devolver errores genéricos HTTP 500 con trazas de Python. El frontend necesita `error_code` y `action_required` para mostrar la UI correcta (ej: botón "Volver a tomar foto" vs. "Reintentar" vs. "Iniciar sesión").

---

## 11. Seguridad

### 11.1 Autenticación (JWT via Supabase Auth)

```mermaid
sequenceDiagram
    participant App as 📱 App Móvil
    participant Supa as 🔐 Supabase Auth
    participant API as ⚡ FastAPI

    App->>Supa: signUp(email, password)
    Supa-->>App: JWT access_token + refresh_token
    
    App->>API: POST /api/v1/scan (Authorization: Bearer JWT)
    API->>Supa: Verificar JWT (supabase.auth.get_user)
    Supa-->>API: user_id válido
    API-->>App: ScanResponse
```

### 11.2 Middleware de Seguridad del Backend

```python
# core/security.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Verifica el JWT de Supabase y extrae el user_id."""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        user = supabase.auth.get_user(credentials.credentials)
        return {"user_id": user.user.id, "email": user.user.email}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "UNAUTHORIZED",
                "message": "Token inválido o expirado.",
                "action_required": "REDIRECT_LOGIN"
            }
        )
```

### 11.3 Rate Limiting

```python
# core/rate_limiter.py
from slowapi import Limiter
from slowapi.util import get_remote_address

# Limitar por IP y por user_id del JWT
limiter = Limiter(key_func=get_remote_address)

# En el endpoint:
@router.post("/scan")
@limiter.limit("10/minute")  # 10 escaneos por minuto por IP
async def scan(request: Request, ...):
    ...
```

### 11.4 Validación de imágenes

| Validación | Valor | Razón |
|---|---|---|
| Tamaño máximo | 5 MB | Evitar abuso de almacenamiento y memoria |
| Formatos permitidos | JPEG, PNG, WebP | Los que soporta Vision API |
| Base64 válido | Decodificable sin errores | Evitar payloads malformados |
| Strip data URI prefix | `data:image/...;base64,` | Normalizar input |

---

## 12. DevOps y Despliegue

### 12.1 Dockerfile (Backend)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Puerto
EXPOSE 8000

# Comando de inicio
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 12.2 docker-compose.yml (Desarrollo local)

```yaml
version: "3.8"

services:
  api:
    build: ./backend
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/app  # Hot reload
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    depends_on:
      - db

  db:
    image: supabase/postgres:15.6
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: allergensmart
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### 12.3 requirements.txt (Actualizado)

```
# Framework
fastapi==0.115.12
uvicorn[standard]==0.34.2
pydantic-settings==2.9.1

# Database
sqlalchemy[asyncio]==2.0.36
asyncpg==0.30.0
alembic==1.14.1

# Supabase
supabase==2.12.0

# HTTP Client (para Vision API)
httpx==0.28.1

# Text Processing
rapidfuzz==3.10.0
unidecode==1.3.8

# Security
python-jose[cryptography]==3.3.0
slowapi==0.1.9

# File handling
python-multipart==0.0.20

# Environment
python-dotenv==1.1.0

# Monitoring
sentry-sdk[fastapi]==2.19.0
```

### 12.4 Variables de Entorno (.env)

```bash
# === Supabase ===
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
DATABASE_URL=postgresql+asyncpg://postgres:password@db.xxxxx.supabase.co:5432/postgres

# === Google Cloud ===
GOOGLE_CLOUD_API_KEY=AIzaSy...

# === App ===
ENVIRONMENT=development
APP_NAME=AllergenSmart API
APP_VERSION=2.0.0
CORS_ORIGINS=http://localhost:8081,http://localhost:19006

# === Rate Limiting ===
RATE_LIMIT_PER_MINUTE=10

# === Monitoring ===
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 12.5 Despliegue en Google Cloud Run

```bash
# Build & push
gcloud builds submit --tag gcr.io/PROJECT_ID/allergensmart-api

# Deploy
gcloud run deploy allergensmart-api \
  --image gcr.io/PROJECT_ID/allergensmart-api \
  --platform managed \
  --region us-east1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "ENVIRONMENT=production"
```

---

## 13. Plan de Testing

### 13.1 Testing del Backend

| Tipo | Herramienta | Qué testea | Ejemplo |
|---|---|---|---|
| **Unitarios** | pytest | Lógica pura (normalización, detección) | `test_normalizar_texto("1ngredientes") == "ingredientes"` |
| **Integración** | pytest + httpx | Endpoints completos | `POST /scan` con imagen mock |
| **Fuzzy Matching** | pytest + parametrize | Variantes OCR → alérgeno correcto | `"glten" → "gluten"` con confianza > 0.8 |
| **Carga** | locust | Concurrencia y latencia | 50 usuarios simultáneos, latencia < 2s |

### 13.2 Tests prioritarios

```python
# test_allergen_service.py

@pytest.mark.parametrize("input_text,expected_allergen", [
    ("harina de trigo", "gluten"),
    ("leche en polvo", "lactosa"),
    ("lecitina de soya", "soya"),
    ("mantequilla de maní", "maní"),
    ("suero de leche", "lactosa"),
    ("proteína vegetal hidrolizada", "soya"),
])
def test_deteccion_directa(input_text, expected_allergen):
    """Verifica detección directa de sinónimos."""
    ...

@pytest.mark.parametrize("ocr_error,expected_correction", [
    ("glten", "gluten"),
    ("1actosa", "lactosa"),
    ("mantequiIla", "mantequilla"),
])
def test_fuzzy_matching_errores_ocr(ocr_error, expected_correction):
    """Verifica que el fuzzy matching corrige errores del OCR."""
    ...

def test_seguridad_primero_confianza_baja():
    """Si la confianza del OCR es < 0.6, resultado debe ser WARNING."""
    ...

def test_cache_hit_no_llama_vision_api():
    """Si el barcode existe en caché, no debe llamar a Vision API."""
    ...
```

---

## 14. Script SQL Completo

> **Instrucción:** Copiar y pegar este script completo en **Supabase → SQL Editor → New Query → Run**

```sql
-- =====================================================================
-- AllergenSmart — Database Schema v2.0
-- Target: Supabase (PostgreSQL 15+)
-- =====================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. ALLERGEN CATEGORIES
-- =====================================================================
CREATE TABLE IF NOT EXISTS allergen_categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL UNIQUE,
    icon_emoji    TEXT,
    description   TEXT,
    display_order INT DEFAULT 0
);

-- =====================================================================
-- 2. ALLERGENS
-- =====================================================================
CREATE TABLE IF NOT EXISTS allergens (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id      UUID REFERENCES allergen_categories(id) ON DELETE SET NULL,
    name             TEXT NOT NULL UNIQUE,
    scientific_names TEXT[] DEFAULT '{}',
    synonyms         TEXT[] NOT NULL DEFAULT '{}',
    ocr_variants     TEXT[] DEFAULT '{}',
    is_active        BOOLEAN DEFAULT true
);

-- =====================================================================
-- 3. USER PROFILES
-- =====================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name              TEXT DEFAULT '',
    city                   TEXT DEFAULT 'Manta',
    avatar_url             TEXT,
    notifications_enabled  BOOLEAN DEFAULT true,
    created_at             TIMESTAMPTZ DEFAULT now(),
    updated_at             TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 4. USER ALLERGIES (Pivot)
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_allergies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
    severity    TEXT CHECK (severity IN ('high', 'medium', 'low')) DEFAULT 'high',
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, allergen_id)
);

-- =====================================================================
-- 5. PRODUCTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS products (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode           TEXT UNIQUE,
    name              TEXT,
    brand             TEXT,
    ingredients_raw   TEXT,
    ingredients_array TEXT[] DEFAULT '{}',
    image_url         TEXT,
    verified_by_admin BOOLEAN DEFAULT false,
    verified_by       UUID REFERENCES profiles(id),
    verified_at       TIMESTAMPTZ,
    country_origin    TEXT DEFAULT 'EC',
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 6. SCAN HISTORY
-- =====================================================================
CREATE TABLE IF NOT EXISTS scan_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id          UUID REFERENCES products(id),
    barcode             TEXT,
    result_status       TEXT NOT NULL CHECK (result_status IN ('safe', 'warning', 'danger')),
    detected_allergens  JSONB DEFAULT '[]',
    ocr_confidence      REAL CHECK (ocr_confidence >= 0.0 AND ocr_confidence <= 1.0),
    ingredients_found   TEXT[] DEFAULT '{}',
    processing_time_ms  INT,
    from_cache          BOOLEAN DEFAULT false,
    scanned_at          TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 7. PRODUCT REPORTS (Crowdsourcing)
-- =====================================================================
CREATE TABLE IF NOT EXISTS product_reports (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_by UUID NOT NULL REFERENCES profiles(id),
    product_id  UUID REFERENCES products(id),
    barcode     TEXT,
    photo_url   TEXT,
    notes       TEXT,
    status      TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 8. OCR CACHE
-- =====================================================================
CREATE TABLE IF NOT EXISTS ocr_cache (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode               TEXT UNIQUE NOT NULL,
    ocr_text              TEXT,
    ingredients_extracted  TEXT[] DEFAULT '{}',
    warnings_extracted    TEXT[] DEFAULT '{}',
    ocr_confidence        REAL,
    expires_at            TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    created_at            TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_scan_history_user_date ON scan_history(user_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_ocr_cache_expires ON ocr_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_allergens_synonyms ON allergens USING GIN(synonyms);
CREATE INDEX IF NOT EXISTS idx_allergens_ocr_variants ON allergens USING GIN(ocr_variants);
CREATE INDEX IF NOT EXISTS idx_reports_pending ON product_reports(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_user_allergies_user ON user_allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand) WHERE brand IS NOT NULL;

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, city)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'Manta'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_products ON products;
CREATE TRIGGER set_updated_at_products
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Cache cleanup function (call via pg_cron or external cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ocr_cache WHERE expires_at < now();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE user_allergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own allergies" ON user_allergies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own allergies" ON user_allergies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own allergies" ON user_allergies FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scans" ON scan_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans" ON scan_history FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read products" ON products FOR SELECT USING (true);

ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read allergens" ON allergens FOR SELECT USING (true);

ALTER TABLE allergen_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON allergen_categories FOR SELECT USING (true);

ALTER TABLE product_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON product_reports FOR SELECT USING (auth.uid() = reported_by);
CREATE POLICY "Users can create reports" ON product_reports FOR INSERT WITH CHECK (auth.uid() = reported_by);

ALTER TABLE ocr_cache ENABLE ROW LEVEL SECURITY;
-- No policies = solo accesible via service_role (backend)

-- =====================================================================
-- SEED DATA: Allergen Categories
-- =====================================================================
INSERT INTO allergen_categories (name, icon_emoji, description, display_order) VALUES
    ('Cereales con Gluten',  '🌾', 'Trigo, cebada, centeno, avena y derivados', 1),
    ('Lácteos',              '🥛', 'Leche, queso, yogur y derivados lácteos', 2),
    ('Frutos de Cáscara',    '🥜', 'Maní, almendras, nueces y frutos secos', 3),
    ('Soya',                 '🫘', 'Soja, lecitina de soya y derivados', 4),
    ('Huevos',               '🥚', 'Huevo, albúmina, ovoalbúmina', 5),
    ('Mariscos',             '🦐', 'Camarón, langosta, cangrejo', 6),
    ('Pescados',             '🐟', 'Atún, sardina, anchoa y derivados', 7),
    ('Sulfitos',             '🧪', 'Dióxido de azufre y sulfitos', 8),
    ('Apio',                 '🥬', 'Apio y extractos de apio', 9),
    ('Mostaza',              '🟡', 'Mostaza y semillas de mostaza', 10),
    ('Sésamo',               '🫓', 'Ajonjolí, tahini y derivados', 11)
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- SEED DATA: Allergens with Synonyms
-- =====================================================================
INSERT INTO allergens (category_id, name, scientific_names, synonyms, ocr_variants)
SELECT id, 'gluten',
    ARRAY['Triticum aestivum', 'Hordeum vulgare', 'Secale cereale'],
    ARRAY['trigo', 'cebada', 'centeno', 'avena', 'espelta', 'harina de trigo',
          'almidón de trigo', 'harina', 'sémola', 'salvado', 'germen de trigo',
          'almidón modificado', 'proteína de trigo', 'gluten'],
    ARRAY['glten', 'gIuten', 'g1uten', 'giuten', 'glutem']
FROM allergen_categories WHERE name = 'Cereales con Gluten'
ON CONFLICT (name) DO NOTHING;

INSERT INTO allergens (category_id, name, scientific_names, synonyms, ocr_variants)
SELECT id, 'lactosa',
    ARRAY['Beta-D-galactopyranosyl-(1-4)-D-glucose'],
    ARRAY['leche', 'lácteo', 'lácteos', 'suero de leche', 'caseína', 'lactosuero',
          'crema', 'mantequilla', 'queso', 'yogur', 'nata', 'leche en polvo',
          'leche descremada', 'leche entera', 'proteína de leche', 'caseinato',
          'lactosa', 'suero lácteo', 'grasa láctea', 'sólidos lácteos'],
    ARRAY['1actosa', 'lactossa', 'Iactosa']
FROM allergen_categories WHERE name = 'Lácteos'
ON CONFLICT (name) DO NOTHING;

INSERT INTO allergens (category_id, name, scientific_names, synonyms, ocr_variants)
SELECT id, 'maní',
    ARRAY['Arachis hypogaea'],
    ARRAY['maní', 'cacahuete', 'cacahuate', 'mantequilla de maní',
          'pasta de maní', 'aceite de maní'],
    ARRAY['mani', 'manl']
FROM allergen_categories WHERE name = 'Frutos de Cáscara'
ON CONFLICT (name) DO NOTHING;

INSERT INTO allergens (category_id, name, scientific_names, synonyms, ocr_variants)
SELECT id, 'soya',
    ARRAY['Glycine max'],
    ARRAY['soya', 'soja', 'lecitina de soya', 'lecitina de soja',
          'proteína de soya', 'aceite de soya', 'salsa de soya',
          'proteína vegetal hidrolizada', 'tofu'],
    ARRAY['s0ya', 'soia']
FROM allergen_categories WHERE name = 'Soya'
ON CONFLICT (name) DO NOTHING;

INSERT INTO allergens (category_id, name, scientific_names, synonyms, ocr_variants)
SELECT id, 'huevo',
    ARRAY['Gallus gallus domesticus'],
    ARRAY['huevo', 'albúmina', 'ovoalbúmina', 'yema', 'clara de huevo',
          'lisozima', 'lecitina de huevo', 'huevo en polvo', 'mayonesa'],
    ARRAY['huev0', 'heuvo']
FROM allergen_categories WHERE name = 'Huevos'
ON CONFLICT (name) DO NOTHING;

INSERT INTO allergens (category_id, name, scientific_names, synonyms, ocr_variants)
SELECT id, 'mariscos',
    ARRAY['Crustacea'],
    ARRAY['camarón', 'langosta', 'cangrejo', 'langostino', 'gamba',
          'marisco', 'crustáceo', 'crustáceos'],
    ARRAY['camaron']
FROM allergen_categories WHERE name = 'Mariscos'
ON CONFLICT (name) DO NOTHING;

INSERT INTO allergens (category_id, name, scientific_names, synonyms, ocr_variants)
SELECT id, 'pescado',
    ARRAY['Osteichthyes'],
    ARRAY['anchoa', 'atún', 'sardina', 'bacalao', 'tilapia',
          'pescado', 'aceite de pescado', 'salsa de pescado', 'surimi'],
    ARRAY['pescad0', 'pexcado']
FROM allergen_categories WHERE name = 'Pescados'
ON CONFLICT (name) DO NOTHING;

INSERT INTO allergens (category_id, name, scientific_names, synonyms, ocr_variants)
SELECT id, 'frutos_secos',
    ARRAY['Prunus dulcis', 'Juglans regia', 'Corylus avellana'],
    ARRAY['almendra', 'nuez', 'avellana', 'pistacho', 'anacardo',
          'castaña', 'nuez de brasil', 'macadamia', 'pecana',
          'nuez de la india', 'frutos secos'],
    ARRAY['almenda', 'aImendra']
FROM allergen_categories WHERE name = 'Frutos de Cáscara'
ON CONFLICT (name) DO NOTHING;

INSERT INTO allergens (category_id, name, scientific_names, synonyms, ocr_variants)
SELECT id, 'sulfitos',
    ARRAY['Sulfur dioxide', 'E220-E228'],
    ARRAY['sulfito', 'dióxido de azufre', 'metabisulfito',
          'sulfito de sodio', 'bisulfito'],
    ARRAY['suIfito']
FROM allergen_categories WHERE name = 'Sulfitos'
ON CONFLICT (name) DO NOTHING;

INSERT INTO allergens (category_id, name, scientific_names, synonyms, ocr_variants)
SELECT id, 'apio',
    ARRAY['Apium graveolens'],
    ARRAY['apio', 'extracto de apio', 'sal de apio'],
    ARRAY['api0']
FROM allergen_categories WHERE name = 'Apio'
ON CONFLICT (name) DO NOTHING;

INSERT INTO allergens (category_id, name, scientific_names, synonyms, ocr_variants)
SELECT id, 'mostaza',
    ARRAY['Sinapis alba', 'Brassica nigra'],
    ARRAY['mostaza', 'semilla de mostaza', 'aceite de mostaza'],
    ARRAY['m0staza']
FROM allergen_categories WHERE name = 'Mostaza'
ON CONFLICT (name) DO NOTHING;

INSERT INTO allergens (category_id, name, scientific_names, synonyms, ocr_variants)
SELECT id, 'sésamo',
    ARRAY['Sesamum indicum'],
    ARRAY['sésamo', 'ajonjolí', 'aceite de sésamo', 'tahini',
          'semilla de sésamo'],
    ARRAY['sesamo']
FROM allergen_categories WHERE name = 'Sésamo'
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- ✅ Schema deployment complete!
-- Run: SELECT count(*) FROM allergens; -- Should return 12
-- Run: SELECT count(*) FROM allergen_categories; -- Should return 11
-- =====================================================================
```
