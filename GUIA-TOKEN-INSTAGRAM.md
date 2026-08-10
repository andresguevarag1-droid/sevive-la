# Guía: obtener el token de Instagram para SeViveLa

**Objetivo:** conseguir un "token de acceso de larga duración" de la cuenta
@sevive.la y pegarlo en Vercel como `IG_ACCESS_TOKEN`. Con eso, el sitio
trae solo los reels publicados en Instagram a la videoteca, todos los días.

Se hace **una sola vez** (después el sistema renueva el token solo).
Tiempo estimado: 15–20 minutos. No cuesta nada.

> Los nombres de botones pueden variar un poco (Meta cambia la interfaz y
> a veces está en inglés). Lo importante es la secuencia.

---

## Antes de empezar (requisitos)

- [ ] Acceso a la cuenta de Instagram **@sevive.la** (usuario y contraseña).
- [ ] La cuenta debe ser **profesional** (Business o Creator). Si es
      personal: app de Instagram → perfil → menú ☰ → **Configuración y
      privacidad** → **Tipo de cuenta y herramientas** → **Cambiar a cuenta
      profesional** (elegí Creator o Business, da igual para esto).
- [ ] Una cuenta de Facebook personal para entrar al portal de
      desarrolladores (cualquiera sirve; solo es la "dueña" de la app).

---

## Parte 1 — Crear la app en Meta (5 min)

1. Entrá a **https://developers.facebook.com** e iniciá sesión con Facebook.
   - Si es tu primera vez, te pide registrarte como desarrollador:
     aceptá los términos y verificá con tu número de teléfono.
2. Arriba a la derecha: **My Apps** (Mis apps) → **Create App** (Crear app).
3. En "¿Qué quieres que haga tu app?" / caso de uso, elegí la opción de
   **Instagram** (puede aparecer como "Access the Instagram API" o
   "Instagram API setup with Instagram login"). → **Next**.
4. Tipo de app: **Business** (Negocios). → **Next**.
5. Nombre de la app: `SeViveLa Reels` · Correo de contacto: el tuyo.
   → **Create App** (te puede pedir tu contraseña de Facebook).
6. Si en algún formulario pide **Privacy Policy URL** (URL de política de
   privacidad), pegá: `https://sevive-la.vercel.app/legal/privacidad`

> **No hace falta** mandar la app a revisión de Meta ni "publicarla".
> Para leer los reels de tu propia cuenta, el modo desarrollo alcanza.

## Parte 2 — Conectar @sevive.la y generar el token (10 min)

1. Ya dentro del panel de la app, en el menú izquierdo buscá
   **Instagram** → **API setup with Instagram login**
   (Configuración de la API con inicio de sesión de Instagram).
2. Paso "**Generate access tokens**" (Generar tokens de acceso):
   botón **Add account** (Agregar cuenta).
3. Se abre una ventana de Instagram: iniciá sesión con **@sevive.la**
   y autorizá los permisos que pide (perfil y contenido).
   - Instagram puede mandarte una notificación a la app del teléfono para
     aprobar la conexión ("Permitir acceso"): aceptala.
4. De vuelta en el panel, la cuenta @sevive.la aparece en la lista.
   A la par: botón **Generate token** (Generar token).
5. Te vuelve a pedir iniciar sesión con @sevive.la → autorizá → te muestra
   el token: un texto larguísimo que empieza con `IG...`.
   Botón **I understand / Copy** → **copialo completo**.

Ese es el **token de larga duración** (vale 60 días; el sitio lo renueva
solo cada día, así que en la práctica no vence nunca).

## Parte 3 — Pegarlo en Vercel (2 min)

1. **vercel.com** → proyecto **sevive-la** → **Settings** →
   **Environment Variables** → **Add / Create new**.
2. - Key: `IG_ACCESS_TOKEN`
   - Value: el token copiado (completo, sin espacios antes o después)
   - Environments: **Production** · marcá **Sensitive**.
3. Guardar → pestaña **Deployments** → tres puntos (⋯) del deployment más
   reciente → **Redeploy** (para que tome la variable).

## Parte 4 — Probar (1 min)

En la terminal de la Mac (cambiá `TU_CRON_SECRET` por el valor real que
está en Vercel):

```
curl -H "Authorization: Bearer TU_CRON_SECRET" https://sevive-la.vercel.app/api/cron/reels
```

- ✅ Respuesta con `"ok":true` y `"creados":[...]` → los reels ya están
  entrando; revisá la videoteca del sitio.
- 💤 `"estado":"dormido"` → falta alguna variable o el redeploy.
- ❌ "token vencido o no es válido" → repetí la Parte 2, paso 4–5.

## Problemas comunes

| Pasa esto | Solución |
|---|---|
| No aparece "Instagram" al crear la app | Verificá que elegiste tipo **Business** en el paso 4 de la Parte 1. |
| "Add account" falla o no autoriza | La cuenta debe ser **profesional** (ver requisitos) y tenés que aprobar la notificación en la app de Instagram del teléfono. |
| El panel pide "App Review" para permisos | Ignoralo: los permisos básicos de tu propia cuenta no requieren revisión. |
| El token dejó de funcionar meses después | Alguien cambió la contraseña de @sevive.la o desconectó la app: repetí la Parte 2 y pegá el token nuevo en Vercel. |
