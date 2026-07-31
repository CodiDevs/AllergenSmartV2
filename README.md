# 🛡️ AllergenSmart V2 - Proyecto de Sistemas de Información

Plataforma móvil + backend diseñada para salvaguardar la salud de personas con alergias e intolerancias alimentarias. El sistema permite escanear etiquetas de productos mediante **cámara (OCR)** o **código de barras (EAN-13)** y procesar de forma inmediata los ingredientes mediante un motor inteligente de coincidencia difusa (**Fuzzy Matching**) en múltiples idiomas.

**Mercado Objetivo Inicial:** Manta, Ecuador.

---

## 📖 Tabla de Contenidos
1. [Funcionamiento General](#1-funcionamiento-general)
2. [Arquitectura del Software](#2-arquitectura-del-software)
3. [Modelo de Base de Datos (DER)](#3-modelo-de-base-de-datos-der)
4. [Metodología de Desarrollo](#4-metodología-de-desarrollo)
5. [Guía de Despliegue](#5-guía-de-despliegue)
6. [Estructura del Repositorio](#6-estructura-del-repositorio)

---

## 1. Funcionamiento General

AllergenSmart V2 funciona como un asistente de prevención alimentaria en 4 fases clave:
1. **Configuración del Perfil:** El usuario registra su perfil y selecciona del catálogo qué ingredientes o categorías representan un riesgo para su salud (Trigo/Gluten, Lácteos/Lactosa, Maní, etc.), asignando un nivel de severidad (*Alta*, *Media*, *Baja*).
2. **Captura Inteligente (Híbrida):** Desde la app móvil, el usuario puede:
   - Apuntar a un **código de barras** para consultar la base de datos local o la API pública de **Open Food Facts**.
   - Capturar una **foto de los ingredientes** de cualquier producto local si no tiene código de barras.
   - Realizar una **búsqueda manual** con autocompletado en tiempo real.
3. **Análisis en Backend:** El backend recibe el texto extraído por la API de **Google Cloud Vision (OCR)**, normaliza las cadenas (eliminación de tildes, minúsculas, caracteres especiales) y cruza los ingredientes contra el perfil del usuario mediante algoritmos de similitud de texto (*Fuzzy Matching*) y equivalencias multilingües automáticas (ej. *Agua / Aqua / Water*).
4. **Alerta de Nivel de Riesgo:** Muestra semáforos de advertencia inmediatos (*Seguro - Verde*, *Precaución/Trazas - Amarillo*, *Peligro - Rojo*) con animaciones interactivas de la mascota "Alergi".

---

## 2. Arquitectura del Software

El sistema sigue un patrón de **Clean Architecture** estructurado en capas para garantizar la separación de conceptos y alta testeabilidad.

### 2.1 Diagrama de Arquitectura de Bloques (UML)

```mermaid
graph TB
    subgraph "📱 Cliente Móvil (Frontend)"
        A["React Native (Expo)"]
        B["Zustand (State Management)"]
        C["AsyncStorage (Persistencia Offline)"]
    end

    subgraph "☁️ Capa de API / Servicios (Backend)"
        D["FastAPI (Python 3.14)"]
        E["Middleware (Auth JWT / CORS)"]
    end

    subgraph "🧠 Capa de Procesamiento"
        F["Google Cloud Vision API (OCR)"]
        G["Motor de Normalización (RegEx)"]
        H["Motor de Fuzzy Matching (Rapidfuzz)"]
    end

    subgraph "💾 Capa de Datos (Supabase Cloud)"
        I["PostgreSQL Direct DB"]
        J["Supabase Auth (Gestionado)"]
        K["Supabase Storage (Imágenes de Reportes)"]
        L["OCR Cache (TTL 30 días)"]
    end

    A -->|"Peticiones HTTP + JWT"| D
    A <-->|"Persistencia local"| C
    A -->|"Auth / Session"| J
    D -->|"Análisis OCR"| F
    D --> G --> H
    D <-->|"SQL"| I
    D --> L
```

---

## 3. Modelo de Base de Datos (DER)

La base de datos relacional PostgreSQL está desplegada en la nube de Supabase y cuenta con **RLS (Row Level Security)** habilitado para proteger los datos de los usuarios.

### 3.1 Diagrama Entidad-Relación (DER)

```mermaid
erDiagram
    profiles {
        uuid id PK
        varchar full_name
        varchar city
        varchar avatar_url
        boolean notifications_enabled
        timestamptz created_at
        timestamptz updated_at
    }
    allergen_categories {
        uuid id PK
        varchar name
        varchar icon_emoji
        text description
        integer display_order
    }
    allergens {
        uuid id PK
        uuid category_id FK
        varchar name
        varchar[] scientific_names
        varchar[] synonyms
        varchar[] ocr_variants
        boolean is_active
    }
    user_allergies {
        uuid id PK
        uuid user_id FK
        uuid allergen_id FK
        varchar severity
        timestamptz created_at
    }
    products {
        uuid id PK
        varchar barcode
        varchar name
        varchar brand
        text ingredients_raw
        varchar[] ingredients_array
        varchar image_url
        boolean verified_by_admin
        uuid verified_by FK
        timestamptz verified_at
        varchar country_origin
        timestamptz created_at
        timestamptz updated_at
    }
    scan_history {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        varchar barcode
        varchar result_status
        jsonb detected_allergens
        real ocr_confidence
        varchar[] ingredients_found
        integer processing_time_ms
        boolean from_cache
        timestamptz scanned_at
    }
    product_reports {
        uuid id PK
        uuid reported_by FK
        uuid product_id FK
        varchar barcode
        varchar photo_url
        text notes
        varchar status
        uuid reviewed_by FK
        timestamptz reviewed_at
        timestamptz created_at
    }
    ocr_cache {
        uuid id PK
        varchar barcode
        text ocr_text
        varchar[] ingredients_extracted
        varchar[] warnings_extracted
        real ocr_confidence
        timestamptz expires_at
        timestamptz created_at
    }

    profiles ||--o{ user_allergies : "tiene asignadas"
    allergens ||--o{ user_allergies : "se asocia"
    allergen_categories ||--o{ allergens : "contiene"
    profiles ||--o{ scan_history : "realiza"
    products ||--o{ scan_history : "asociado"
    profiles ||--o{ product_reports : "reporta"
    products ||--o{ product_reports : "pertenece"
```

### 3.2 Archivo de Base de Datos
El script estructurado de creación de tablas, índices, triggers y semillas se encuentra en:
👉 [BDD.sql](BDD.sql)

---

## 4. Metodología de Desarrollo

El desarrollo se gestionó de forma ágil bajo el marco de trabajo **Scrum/Kanban** utilizando **Linear** para el seguimiento y priorización de tickets organizados en hitos y épicas de desarrollo:

- **Épica: Detección y Análisis de Productos:** Concentró la lógica de OCR, escaneo y cruce de datos.
- **Épica: Perfil, Historial y Favoritos:** Enfocada en la gestión de alérgenos personales y persistencia.
- **Épica: UX y Diseño:** Creación del logo "Alergi", paleta de colores corporativa y fluidez visual.

---

## 5. Guía de Despliegue

### 5.1 Requisitos Previos
- **Python 3.11** o superior.
- **Node.js** (v18+) & **npm**.
- Cuenta en **Supabase** y un proyecto activo.
- Credenciales de **Google Cloud Service Account** con la API de Cloud Vision habilitada.

### 5.2 Configuración del Backend (FastAPI)
1. Navega al directorio del backend:
   ```bash
   cd backend
   ```
2. Crea y activa tu entorno virtual:
   ```bash
   python -m venv .venv
   # En Windows:
   .venv\Scripts\activate
   # En macOS/Linux:
   source .venv/bin/activate
   ```
3. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Configura tus variables de entorno en un archivo `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
   SUPABASE_URL=https://[project-id].supabase.co
   SUPABASE_ANON_KEY=[tu-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[tu-service-role-key]
   GOOGLE_CLOUD_API_KEY=[tu-google-vision-key]
   ```
5. Corre las migraciones o inicializa el esquema importando [BDD.sql](BDD.sql) en el editor de SQL de Supabase.
6. Poblar datos semilla:
   ```bash
   python -m scripts.seed_allergens
   ```
7. Iniciar el servidor:
   ```bash
   python -m uvicorn app.main:app --reload
   ```

### 5.3 Configuración del Frontend (React Native + Expo)
1. Navega al directorio del frontend:
   ```bash
   cd frontend
   ```
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo de Expo con limpieza de caché:
   ```bash
   npx expo start --clear
   ```
4. Escanea el código QR con la app Expo Go en tu dispositivo móvil iOS/Android.

---

## 6. Estructura del Repositorio

```
.
├── BDD.sql                   # Script SQL estructurado de la Base de Datos
├── README.md                 # Documento principal del repositorio
├── backend/                  # Código fuente de FastAPI (Python)
│   ├── app/                  # Capas de la Clean Architecture
│   │   ├── api/              # Controladores y Endpoints
│   │   ├── models/           # Entidades SQLAlchemy
│   │   ├── services/         # Lógica de Negocio y Detección
│   │   └── repositories/     # Capa de Acceso a Datos
│   └── tests/                # Pruebas Automatizadas (pytest)
└── frontend/                 # Código fuente de React Native (Expo)
    └── src/
        ├── app/              # Enrutamiento basado en archivos (expo-router)
        ├── components/       # Componentes de UI Reutilizables
        └── store/            # Gestión de estado global (Zustand)
```
