# 🛡️ AllergenSmart V2

> Aplicación móvil preventiva de salud que escanea etiquetas de alimentos mediante OCR para alertar sobre alérgenos.

## Estructura del Proyecto

```
AllergenSmartV2/
├── frontend/          # React Native + Expo (TypeScript)
│   ├── app/           # Pantallas (Expo Router)
│   ├── components/    # Componentes reutilizables
│   ├── services/      # Supabase client, API service
│   ├── stores/        # Estado global (Zustand)
│   ├── hooks/         # Hooks personalizados
│   ├── types/         # Tipos TypeScript
│   ├── constants/     # Constantes y config
│   └── assets/        # Fuentes, imágenes
│
├── backend/           # FastAPI (Python 3.11+)
│   ├── app/
│   │   ├── api/       # Endpoints REST
│   │   ├── services/  # Lógica de negocio
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic DTOs
│   │   ├── repositories/ # Data access
│   │   ├── infrastructure/ # External services
│   │   └── core/      # Exceptions, security
│   ├── tests/
│   └── alembic/       # DB migrations
│
└── docs/              # Documentación técnica
```

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React Native + Expo SDK 54 + TypeScript |
| Backend | Python 3.11+ + FastAPI |
| Database | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth (JWT) |
| OCR | Google Cloud Vision API |
| Storage | Supabase Storage |
| Deploy | Docker + Google Cloud Run |

## 📍 Mercado: Manta, Ecuador
