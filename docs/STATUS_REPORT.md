# 📊 Estado del Proyecto: Frontend y Backend (AllergenSmart V2)

Este documento resume el progreso actual en el desarrollo de la aplicación móvil (Frontend en React Native/Expo) y el servidor (Backend en FastAPI), señalando qué funcionalidades están listas y cuáles son las tareas pendientes para conectar ambos de manera exitosa.

---

## 📱 Frontend (React Native & Expo)

El frontend se enfoca en una experiencia de usuario (UX) premium con el asistente **Alergi** (mascota con diferentes estados emocionales) y un sistema dinámico de accesibilidad.

### ✅ Implementado y Funcional
1. **Navegación e Interfaz Base (`expo-router`):**
   - Estructura de pestañas principal: Inicio (`index`), Historial (`history`), Favoritos (`favorites`) y Perfil.
   - Pantallas auxiliares de flujo: Procesando (`processing`), Resultado del escaneo (`result`) y Alertas/Advertencias (`warning`).
2. **Autenticación (Supabase Integration):**
   - Pantalla de **Inicio de Sesión** (`login.tsx`) y **Registro** (`register.tsx`) conectadas directamente con Supabase Auth.
   - **Visualización de Contraseñas:** Botón de "ojo" interactivo (SVG con estados activo/inactivo) para mostrar/ocultar contraseña en login y registro.
   - **Sistema de Alertas/Confirmación en Registro:** Flujo visual de éxito que reemplaza el formulario al registrarse satisfactoriamente. Informa al usuario a qué correo se envió el enlace de confirmación y le pide verificar su cuenta antes de iniciar sesión.
3. **Accesibilidad (Escalado de Texto):**
   - Sistema de fuentes centralizado con **Zustand** (`uiScale: 'small' | 'medium' | 'large'`).
   - Multiplicadores fijos por requerimiento de UX: **Pequeño (1.0)**, **Mediano / Predeterminado (1.15)** y **Grande (1.5)**.
   - Componente wrapper `<AppText />` (`src/components/ui/AppText.tsx`) para escalar automáticamente `fontSize` y `lineHeight` sin romper la estructura fija de los contenedores y `TextInput`.
4. **Capa de Servicios de API (`src/services/api.ts`):**
   - Abstracción de todas las llamadas HTTP al backend.
   - Inyección automática del token JWT de la sesión activa de Supabase en la cabecera `Authorization: Bearer <token>`.
   - Mapeo de tipos TypeScript para respuestas y peticiones.

---

## ⚙️ Backend (FastAPI & Clean Architecture)

El backend expone una API estructurada y limpia escrita en Python 3.14 con Clean Architecture, facilitando el procesamiento de OCR y control de acceso seguro.

### ✅ Implementado y Funcional
1. **Arquitectura Limpia:** Estructura modular dividida en `api`, `core`, `infrastructure`, `models`, `repositories`, `schemas` y `services`.
2. **Endpoints de API (v1) Listos:**
   - `GET /allergens`: Catálogo completo de alérgenos disponibles en el sistema.
   - `POST /scan`: Procesamiento de imágenes (OCR) o texto de ingredientes manual para verificar coincidencias.
   - `GET /users/me`: Obtención de datos del perfil del usuario autenticado.
   - `PUT /users/me/allergies`: Configuración e integración de alérgenos personales del usuario.
   - `GET /users/me/scans`: Historial de escaneos guardados de la cuenta del usuario.
3. **Seguridad y Roles:** Integración en `deps.py` para verificar tokens JWT de Supabase, asignación automática de contexto de usuario autenticado y políticas RLS.

---

## 🔗 Tareas Pendientes para la Integración (Conexión Front-End y Back-End)

Estas son las acciones inmediatas recomendadas para conectar ambas partes sin romper la lógica existente:

### 1. Configuración de Red Local (IP / Host)
- **Problema común:** En `api.ts`, `BASE_URL` está definido como `http://localhost:8000/api/v1`. Esto funciona en el navegador, pero fallará en emuladores de Android (requieren `http://10.0.2.2:8000`) o dispositivos físicos en la misma red local (requieren la IP de tu máquina de desarrollo, ej. `http://192.168.1.XX:8000`).
- **Solución backend:** Asegurar que FastAPI corra escuchando en `0.0.0.0` y que los orígenes CORS permitan conexiones desde las IP locales.
- **Solución frontend:** Centralizar el host dinámicamente mediante variables de entorno (`.env`) o configurar un fallback inteligente.

### 2. Sincronización del Perfil de Alérgenos del Usuario
- El frontend debe consumir `GET /users/me` para pintar la lista de alérgenos seleccionados y mandar la actualización a través de `PUT /users/me/allergies` cuando el usuario modifique su perfil en el móvil.

### 3. Enviar Escaneos Reales (OCR)
- Al escanear con la cámara, el frontend debe convertir la foto a Base64 y pasarla al endpoint `POST /scan` del backend bajo el formato `{ image_base64: "..." }`.
- El backend procesará la imagen usando Google Vision API / OCR, comparará con la lista de alérgenos del usuario y retornará el nivel de alerta (`SAFE`, `WARNING` o `DANGER`). El frontend debe renderizar en `result.tsx` o `warning.tsx` según esta respuesta.

### 4. Sincronización del Historial
- Al cargar la pantalla `history.tsx`, el frontend debe invocar `getUserScanHistory` en lugar de mostrar datos estáticos del store local, implementando paginación opcional si la lista es muy larga.
