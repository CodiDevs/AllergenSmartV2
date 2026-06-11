# Guía de Integración y Correcciones Frontend-Backend

Este documento detalla todas las modificaciones y correcciones aplicadas al proyecto para integrar y reparar la cámara, el escáner OCR y el flujo de los alérgenos. Puedes usar esto como guía para replicar los cambios en tu propia rama.

---

## 1. Correcciones en el Backend (Python)

### A. Auto-creación de Alérgenos Manuales (Fallo de UUID)
El principal problema por el cual el backend no detectaba alérgenos como "Aqua" o "Aluminum" era que el frontend mandaba un ID en formato texto y el backend esperaba un **UUID**. Esto causaba que las alergias no se guardaran nunca.

**Archivo a modificar:** `backend/app/services/user_service.py`
**Función:** `replace_allergies`

```python
    async def replace_allergies(
        self, user_id: UUID, data: UserAllergiesUpdate
    ) -> int:
        from app.models.allergen import Allergen
        from sqlalchemy import select

        allergies = []
        for item in data.allergies:
            try:
                allergen_uuid = UUID(item.allergen_id)
            except ValueError:
                # No es un UUID válido. Esto pasa cuando el usuario añade uno manual en la app.
                clean_name = item.allergen_id.strip()
                
                # Buscamos si ya existe (case-insensitive)
                stmt = select(Allergen).where(Allergen.name.ilike(clean_name))
                result = await self.session.execute(stmt)
                existing = result.scalar_one_or_none()
                
                if existing:
                    allergen_uuid = existing.id
                else:
                    # Crear alérgeno personalizado en la DB al vuelo
                    new_allergen = Allergen(
                        name=clean_name.capitalize(),
                        synonyms=[clean_name.lower()],
                        ocr_variants=[],
                    )
                    self.session.add(new_allergen)
                    await self.session.flush() # Obtenemos el UUID generado
                    allergen_uuid = new_allergen.id

            allergies.append({"allergen_id": allergen_uuid, "severity": item.severity.value})

        return await self.repo.replace_allergies(user_id, allergies)
```
*(Nota: Asegúrate de agregar `self.session = session` en el método `__init__` de `UserService` si no lo tenías para poder usar `self.session`)*

### B. Módulo Mock de Google Cloud Vision
Si al escanear ves que **siempre arroja los mismos ingredientes**, es porque está funcionando el modo simulacro (`_mock_response`) de `vision_client.py`.
- **Solución:** Consigue la API Key real de Google Cloud Vision y ponla en la variable `GOOGLE_CLOUD_API_KEY` del archivo `backend/.env`.

---

## 2. Correcciones en el Frontend (React Native / Expo)

### A. Conexión de Red Real (Error: Network Request Failed)
La API estaba configurada para apuntar estáticamente a `localhost`. Esto no funciona cuando pruebas la app en un dispositivo físico.

**Archivo:** `frontend/src/services/api.ts`
**Cambio:** Sustituir la constante fija por una lógica que detecte la IP de la máquina de desarrollo de Expo.

```typescript
import Constants from 'expo-constants';

function getBaseUrl(): string {
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0]; 
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:8000/api/v1`;
      }
    }
  }
  return 'http://localhost:8000/api/v1';
}

const BASE_URL = getBaseUrl();
```

### B. Pantalla Fantasma y Rutas Cruzadas
Existía un archivo viejo llamado `scanner.tsx` que causaba conflictos y aparecía cuando uno le daba al botón de "volver" desde la pantalla de resultados, porque las rutas seguían apuntando allí en vez de al nuevo `scan.tsx`.

1. **Borrar:** El archivo `frontend/src/app/(tabs)/scanner.tsx` fue eliminado por completo.
2. **Actualizar el Layout:** En `frontend/src/app/(tabs)/_layout.tsx`, borramos el `<Tabs.Screen name="scanner" />`.
3. **Corregir referencias:** Buscamos y reemplazamos todos los `router.push('/(tabs)/scanner')` o `router.replace('/(tabs)/scanner')` por `/(tabs)/scan` en los archivos:
   - `result.tsx`
   - `warning.tsx`
   - `processing.tsx`
   - `favorites.tsx`

### C. Arreglos de la UI de la Cámara (`scan.tsx`)
1. **Ocultar Tab Bar de verdad:** Se añadió este efecto para asegurar que el componente de la cámara ocupe el 100% de la pantalla y el Nav (Tab bar) no estorbe por debajo.
   ```typescript
   useEffect(() => {
     const parent = navigation.getParent();
     if (mode === 'camera') {
       parent?.setOptions({ tabBarStyle: { display: 'none' } });
       StatusBar.setHidden(true);
     } else {
       parent?.setOptions({ tabBarStyle: undefined });
       StatusBar.setHidden(false);
     }
     return () => { parent?.setOptions({ tabBarStyle: undefined }); StatusBar.setHidden(false); };
   }, [mode, navigation]);
   ```
2. **Padding inferior:** Se le sumó margen en la parte baja (`Math.max(insets.bottom, 24) + 16`) para que los botones (galería, tomar foto, manual) no se peguen tanto al borde en ciertos dispositivos iOS.
3. **Flash real:** El botón del rayito usaba la propiedad `flash="on"`, que en Expo Camera solo destella al momento de la captura. Se reemplazó por la propiedad de linterna contínua:
   ```typescript
   <CameraView enableTorch={torchOn} flash="off" />
   ```

### D. Textos
- **Home:** En `frontend/src/app/(tabs)/index.tsx`, se cambió el saludo a: `<Text style={styles.heroTitle}>¿Qué producto deseas{'\n'}escanear?</Text>`.
