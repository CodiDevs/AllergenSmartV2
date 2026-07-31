# 🔒 Guía de Autenticación para el Frontend (React Native / Expo)

Esta guía explica cómo el equipo de Frontend debe manejar el Registro, Login y Logout de usuarios en AllergenSmart V2.

Nuestro backend (FastAPI) es **Stateless**. Esto significa que no guarda sesiones. Toda la autenticación es manejada de forma nativa por **Supabase Auth**.

## 1. Instalación de Supabase en el Frontend
Debes usar el cliente oficial de Supabase para Javascript/Typescript.

```bash
npm install @supabase/supabase-js
```

Inicializa tu cliente de Supabase apuntando al mismo proyecto que usamos en el backend:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'TU_SUPABASE_URL'
const supabaseAnonKey = 'TU_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 2. Registro (Sign Up)
Para registrar a un usuario, NO debes enviar una petición a nuestro backend FastAPI. Debes llamar directamente a Supabase desde la app móvil.

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'usuario@correo.com',
  password: 'PasswordFuerte123',
  options: {
    data: {
      full_name: 'Juan Perez' // IMPORTANTE: Enviar el nombre aquí
    }
  }
})
```
**¿Qué pasa en el servidor?**
Cuando ejecutas esto, Supabase guarda al usuario. Inmediatamente, la base de datos dispara un **Trigger** que nosotros creamos en el backend, el cual genera automáticamente el perfil del usuario en nuestra tabla `profiles`.

## 3. Inicio de Sesión (Login)
De igual manera, el login va directo a Supabase.

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@correo.com',
  password: 'PasswordFuerte123',
})

if (data.session) {
  const token = data.session.access_token;
  // Guarda este token de forma segura (ej. SecureStore en Expo)
}
```

## 4. Consumir el Backend FastAPI
Una vez que tienes el `access_token` del login, debes enviarlo en las cabeceras (headers) de cada petición que hagas a nuestro backend.

```javascript
const response = await fetch('http://TU_BACKEND_IP:8000/api/v1/users/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${data.session.access_token}`,
    'Content-Type': 'application/json'
  }
});
```
Nuestro backend validará ese Token y te dará acceso a los datos.

## 5. Cerrar Sesión (Logout)
El backend FastAPI no tiene un endpoint para hacer logout, ya que no guardamos las sesiones. El logout es responsabilidad del Frontend.

**Paso 1:** Borrar el token JWT de tu almacenamiento local (AsyncStorage o SecureStore).
**Paso 2:** Avisarle a Supabase que cierre la sesión.

```javascript
const { error } = await supabase.auth.signOut()
```
¡Listo! Sin el token en el celular, el usuario ya no puede acceder a las rutas protegidas.
