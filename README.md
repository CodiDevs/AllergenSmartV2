# 🛡️ AllergenSmart V2

AllergenSmart V2 es una plataforma móvil y backend diseñada para proteger a las personas con alergias alimentarias mediante el escaneo inteligente de etiquetas con OCR y algoritmos de coincidencia (Fuzzy Matching).

## 📁 Estructura del Proyecto

- `backend/`: El código del servidor escrito en **Python 3.14** usando **FastAPI**. Implementa arquitectura limpia (Clean Architecture).
- `docs/`: Documentación del proyecto.
  - `AllergenSmart_Technical_Bible.md`: La Biblia Técnica con todas las decisiones arquitectónicas.
  - `SECURITY_GUIDELINES.md`: Políticas de seguridad estrictas (Row Level Security, validaciones, etc).
  - `FRONTEND_AUTH_GUIDE.md`: Guía de integración de autenticación para el equipo de frontend.
- `frontend/`: (Próximamente) Código de React Native / Expo.

## 🚀 Guía de Inicio Rápido (Backend)

Nuestro backend utiliza un entorno virtual de Python. No hay un comando como `npm run dev` ya que usamos `uvicorn` directamente.

### 1. Activar el Entorno Virtual
Para empezar a trabajar, debes abrir tu terminal en la carpeta principal del proyecto y activar el entorno virtual donde están instaladas todas las dependencias.

**En Windows (PowerShell):**
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
```

**En Windows (CMD):**
```cmd
cd backend
.venv\Scripts\activate.bat
```

*(Sabrás que funcionó porque aparecerá `(.venv)` al inicio de tu línea de comandos).*

### 2. Iniciar el Servidor
Una vez activado el entorno, levantas el servidor en modo desarrollo (con auto-recarga al guardar archivos) ejecutando:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Verificar el Servidor
Abre tu navegador y entra a:
- **Swagger UI (Pruebas de API):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check:** [http://localhost:8000/](http://localhost:8000/)

### Variables de Entorno (.env)
Asegúrate de que en la carpeta `backend/` exista un archivo `.env` configurado con tus credenciales de Supabase. Copia `.env.example` y renómbralo si es necesario.
