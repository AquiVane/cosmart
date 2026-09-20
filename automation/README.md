# COSMART Bot — tu propio "ManyChat" para WhatsApp e Instagram

Sistema propio de automatización de ventas por WhatsApp e Instagram, hecho a medida para COSMART y para la marca personal de Vaneh. Corre entero en **Cloudflare Workers** (gratis para este volumen) y se despliega solo desde **GitHub** cada vez que hacés push. No depende de ManyChat ni de ningún servicio pago por conversación además de lo que cobra Meta y Anthropic (IA), que son centavos por conversación.

## Qué incluye

- **Un número de WhatsApp Business + una cuenta de Instagram** contestando automáticamente, 24/7.
- **IA (Claude)** que responde preguntas libres usando una base de conocimiento sobre COSMART y Vaneh que vos escribís y editás cuando quieras, desde un panel web. La podés prender o apagar con un click.
- **Flujos de botones** (como los de ManyChat) que vos mismo creás: elegís qué palabra los activa ("hola", "precios", "productos ganadores", etc.), armás los botones y los mensajes de cada paso, y podés activarlos/desactivarlos cuando quieras.
- **Panel de administración** (`/admin`) protegido por contraseña, para ver conversaciones, tomar el control manualmente cuando quieras responder vos, y editar todo lo anterior.
- **Base de datos propia** (Cloudflare D1) con todas las conversaciones, contactos y configuración. Es tuya, no de un tercero.

## Cómo está armado (arquitectura)

```
WhatsApp / Instagram (Meta)
        │  webhook (mensajes entrantes)
        ▼
Cloudflare Worker (automation/worker)
   ├─ /webhook/meta   → recibe y procesa mensajes
   ├─ /admin          → panel web (login + conversaciones + flujos + IA)
   └─ D1 (base de datos: contactos, mensajes, flujos, ajustes)
        │
        ▼
   Claude (Anthropic) → responde con IA cuando no hay un flujo de botones que aplique
```

Todo el código vive en `automation/worker/`. El despliegue es automático: cada `git push` a `main` que toque esa carpeta dispara `.github/workflows/deploy-bot.yml`, que sube los secretos y hace `wrangler deploy` a Cloudflare. No hace falta tocar la terminal después de la puesta en marcha inicial.

---

## Puesta en marcha (una sola vez)

### 1. Cloudflare

1. Si no tenés cuenta de Cloudflare, creá una en https://dash.cloudflare.com/sign-up (tiene plan gratuito).
2. Andá a **My Profile → API Tokens → Create Token** y creá uno con permisos de **Edit Cloudflare Workers** (podés usar la plantilla "Edit Cloudflare Workers"). Guardalo, lo vas a necesitar en el paso 4.
3. Buscá tu **Account ID**: aparece en el panel principal de Cloudflare, a la derecha, o en la URL cuando entrás a cualquier sitio de tu cuenta.
4. En tu computadora (una sola vez, para crear la base de datos):
   ```bash
   cd automation/worker
   npm install
   npx wrangler login
   npx wrangler d1 create cosmart-bot-db
   ```
   Esto te va a devolver un `database_id`. Copialo y pegalo en `automation/worker/wrangler.toml`, reemplazando `REEMPLAZAR_CON_TU_DATABASE_ID`.
5. Cargá las tablas en la base de datos remota:
   ```bash
   npm run db:init:remote
   ```
6. Commiteá y pusheá el cambio de `wrangler.toml` (con el `database_id` real) a `main`.

### 2. Meta (WhatsApp + Instagram)

Ambos productos se manejan desde la misma "App" de Meta, así que es una sola configuración.

1. Entrá a https://developers.facebook.com/ y creá una App de tipo **Business**.
2. Agregá el producto **WhatsApp**:
   - Te da un número de prueba gratis para empezar a probar ya mismo, o podés conectar tu número real de WhatsApp Business.
   - Anotá el **Phone Number ID** (aparece en la configuración de WhatsApp de tu App).
   - Generá un **token permanente**: creá un "System User" en Meta Business Suite (Configuración del negocio → Usuarios → Usuarios del sistema), asignale la App y el activo de WhatsApp, y generá un token sin vencimiento con permiso `whatsapp_business_messaging`.
3. Agregá el producto **Instagram** (Instagram Messaging API):
   - Necesitás una cuenta de Instagram **profesional** (empresa o creador) conectada a una **Página de Facebook**.
   - Desde esa Página, generá un **Page Access Token** con permisos `pages_messaging` e `instagram_manage_messages` (también se genera con el System User de arriba, asignándole la Página).
4. Guardá tu **App Secret** (Configuración de la App → Básica → Mostrar).
5. Todavía no configures el Webhook: lo hacemos en el paso 4, una vez que el bot ya esté desplegado y tengamos la URL.

### 3. Secretos en GitHub

En tu repo de GitHub: **Settings → Secrets and variables → Actions → New repository secret**. Cargá estos (los nombres son exactos):

| Secret en GitHub | Qué va ahí |
|---|---|
| `CLOUDFLARE_API_TOKEN` | El token del paso 1.2 |
| `CLOUDFLARE_ACCOUNT_ID` | Tu Account ID del paso 1.3 |
| `BOT_ADMIN_TOKEN` | Inventá una contraseña larga: es la que vas a usar para entrar al panel `/admin` |
| `BOT_META_VERIFY_TOKEN` | Inventá cualquier palabra (por ejemplo `cosmart-verify-2026`); la vas a repetir en el paso 4 |
| `BOT_META_APP_SECRET` | El App Secret del paso 2.4 |
| `BOT_WHATSAPP_TOKEN` | El token permanente del paso 2.2 |
| `BOT_WHATSAPP_PHONE_NUMBER_ID` | El Phone Number ID del paso 2.2 |
| `BOT_IG_PAGE_ACCESS_TOKEN` | El Page Access Token del paso 2.3 |
| `BOT_ANTHROPIC_API_KEY` | Tu API key de Anthropic (consola.anthropic.com → API Keys) |

Con esto cargado, hacé `git push` a `main` (o simplemente re-ejecutá el workflow desde la pestaña **Actions** de GitHub). El bot queda publicado en una URL del tipo:

```
https://cosmart-bot.<tu-subdominio>.workers.dev
```

Esa URL te la confirma el log del deploy en GitHub Actions, o corriendo `npx wrangler deploy` una vez en tu computadora.

> **¿Querés usar tu propio dominio?** Como ya tenés Cloudflare, es un paso extra simple: en el dashboard de Cloudflare → Workers & Pages → tu Worker → Settings → Domains & Routes, agregá algo como `bot.cosmart.lat` (si ese dominio ya está en tu cuenta de Cloudflare). No es obligatorio para que funcione.

### 4. Configurar el Webhook en Meta

Con el Worker ya desplegado:

1. En tu App de Meta → WhatsApp → Configuración, y también en Instagram → Configuración: agregá el mismo webhook para ambos productos:
   - **Callback URL:** `https://<tu-worker>.workers.dev/webhook/meta`
   - **Verify Token:** el mismo valor que pusiste en `BOT_META_VERIFY_TOKEN`
2. Suscribite a los campos:
   - WhatsApp: `messages`
   - Instagram: `messages`, `messaging_postbacks`
3. Meta va a hacer una llamada de verificación automática a esa URL; si el token coincide, queda verificado al instante.

### 5. Primeros pasos en el panel

1. Entrá a `https://<tu-worker>.workers.dev/admin` e iniciá sesión con el `BOT_ADMIN_TOKEN`.
2. Andá a **Ajustes de IA** y hacé click en **"Cargar contenido de ejemplo de COSMART"**: esto carga un texto base con tus verticales (consultoría, Fractional CMO, auditoría gratis, asesoría 1:1, Productos Ganadores, Talent) y un flujo de bienvenida de ejemplo con botones.
3. Editá ese texto para afinarlo a tu gusto (precios exactos, tono, lo que quieras que priorice).
4. Andá a **Flujos** para revisar o modificar el flujo de bienvenida, y crear los que quieras (por ejemplo, uno específico para Vaneh personal, o uno para una campaña puntual).
5. Escribile "hola" al número de WhatsApp (o al Instagram) conectado y probá el menú.

---

## Cómo funciona el bot en el día a día

Cuando alguien te escribe:

1. Si un humano ya tomó esa conversación (porque vos le respondiste manualmente desde el panel), el bot no contesta hasta que la reactivés.
2. Si el mensaje activa un flujo (por palabra clave) o el contacto está en medio de uno, se le muestran los botones de ese paso.
3. Si no aplica ningún flujo y la IA está activada, le contesta Claude usando la base de conocimiento que cargaste.
4. Si la IA está apagada y no hay flujo, se manda el "mensaje por defecto" configurable.
5. Si alguien escribe algo como "hablar con una persona", el bot deja de responder automáticamente en esa conversación y queda marcada para que la sigas vos desde el panel.

Desde **Conversaciones** podés ver todo el historial, apagar/prender el bot por contacto puntual, y responder manualmente en cualquier momento (eso apaga el bot automáticamente para esa conversación).

## Costos esperados

- **Cloudflare Workers + D1:** gratis en el plan free hasta 100.000 requests/día, más que suficiente para empezar.
- **WhatsApp Cloud API:** las conversaciones iniciadas por el cliente son gratis hasta un volumen mensual generoso; después cobra Meta centavos de dólar por conversación (no por mensaje).
- **Instagram Messaging:** gratis.
- **Anthropic (Claude):** con el modelo por defecto (Haiku 4.5) el costo por respuesta es de fracciones de centavo. Podés cambiar a un modelo más potente (Sonnet 5) desde Ajustes de IA si preferís más calidad a mayor costo.

## Limitaciones actuales (para tener en cuenta)

- Solo procesa mensajes de **texto y botones**; no transcribe audios ni analiza imágenes (se puede sumar más adelante).
- No envía mensajes masivos/broadcasts todavía (eso requiere plantillas aprobadas por Meta); hoy resuelve la conversación entrante automática.
- Un solo panel de administración (un usuario/contraseña compartida); si más adelante necesitás varios accesos con permisos distintos, se puede extender.

## Desarrollo local

```bash
cd automation/worker
cp .dev.vars.example .dev.vars   # completá los valores de prueba
npm install
npm run db:init:local
npm run dev
```

`wrangler dev` te da una URL local; para probar webhooks reales de Meta necesitás una URL pública (por ejemplo con un túnel), así que lo más simple para probar de punta a punta es desplegar a Cloudflare y probar ahí directamente.
