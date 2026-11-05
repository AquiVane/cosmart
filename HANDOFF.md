# HANDOFF — cosmart (sitio principal, www.cosmart.com.ar)

## 05/11 — Linktree (`links.html`) rehecho en tres caminos (pedido de Vaneh)
- Orden: 1) estrategia de marketing (plan USD 9, autodiagnóstico gratis, preinscripción al curso en vivo), 2) IA (guía gratuita + "hacer que la IA escriba como tu marca"), 3) precios (libro, `/precio`, con etiquetas "Nuevo libro" y "Oferta lanzamiento"). Después: presentación de Vaneh y botón a Training (`/tienda`). Textos dictados por Vaneh, no cambiarlos sin pedido.
- Se mantuvo la cabecera original (foto 144 px con aro, "Vaneh" sin cursiva y con subrayado animado). Vaneh no usa cursivas.
- Salieron de la portada (las páginas siguen vivas): Calendario (es de pago, USD 7/mes; la tarjeta vieja decía "gratis", error), Plata en Orden, cursos IA, presencial, etc.
- Medición: cada botón dispara `links_click` en `dataLayer`/`gtag` (ids: `libro_precios`, `guia_ia_gratis`, `ia_identidad_marca`, `plan_marketing`, `autodiagnostico_gratis`, `curso_vivo_preinscripcion`, `training_tienda`). **La página no tiene GTM/GA/píxel instalado**: hoy esos eventos no se registran en ningún lado (pendiente de decisión de Vaneh).
- Futuro: dejar un botón para un recurso de búsqueda de potenciales clientes con IA cuando exista (hay comentario en el HTML).

## 27/10 — Linktree (`links.html`, cosmart.com.ar/links) reordenado por necesidad (pedido de Vaneh)
- **Orden actual:** (1) "Quiero usar mejor la IA para mi negocio:" = 5 formas de usar IA (gratis) + guía de marca + curso completo de IA para emprendedores (con lista de 8 capítulos); (2) "¿Estás empezando? Comenzá acá:" = Tu primera ruta de marketing (gratis) + curso Marketing + IA de 0 a 100 con la etiqueta "Prelanzamiento exclusivo" y botón "Quiero aprender marketing desde cero" (va a la lista de espera/preinscripción); (3) "¿Te cuesta organizar tus contenidos?" = app Calendario + Plata en Orden; (4) "Más para vos" = Autodiagnóstico; (5) Capacitaciones presenciales; (6) COSMART Training. Los bloques 1 a 3 son recuadros con encabezado rojo (`.bloque`).
- **Textos nuevos de la cabecera:** "Marketing más claro. / IA más alineada con tu negocio." y el párrafo "Ayudo a emprendedores y dueños de negocios…". Se sacó el texto "COSMART" de arriba de la foto y "Elegí por dónde empezar".
- **Se sacaron del Linktree (a pedido):** tarjeta de Asesoría 1:1 (la landing `cosmart-asesoria-landing` sigue viva), bloque "Recursos gratuitos" (31 ideas de contenido y clase gratuita). Los destinos siguen en `CONFIG.links` por si se vuelven a poner.
- **Pendiente:** el título de la pestaña y la meta description de la página siguen con el texto viejo ("Tu próximo paso empieza aquí"); Vaneh no dijo si cambiarlos. El título del bloque 3 habla de contenidos pero incluye Plata en Orden (dinero).

## 26/10 — Alarma de clon (pedido de Vaneh)
- Todas las páginas HTML llevan, justo después del `<meta charset>` del `<head>`, un `<script data-anticlon>`: si la página se muestra desde un dominio que no es el oficial (ni uno de los `*.pages.dev` propios), corta la carga, reemplaza todo por un cartel "ATENCIÓN: esta NO es la página oficial de …" con botón a la oficial, y avisa pidiendo `<oficial>/_clon/<dominio-del-clon>` (aparece como 404 en Analíticas de Cloudflare → rutas más pedidas). **No sacarlo ni tocarlo; toda página HTML nueva tiene que llevarlo** (si hace falta, correr de nuevo el script que lo inserta o copiar el bloque de otra página del mismo repo).

## 22/10 — Hosting migrado de GitHub Pages a Cloudflare Pages
- **Motivo:** los términos de GitHub Pages no permiten usarlo como hosting de un negocio/e-commerce. Pedido de Vaneh: sacar los sitios comerciales de GitHub Pages.
- **Ahora:** proyecto **Cloudflare Pages `cosmart`** (preview `cosmart-6ir.pages.dev`) conectado a `AquiVane/cosmart`, rama `main`, sin build, salida = raíz. Dominio personalizado: `www.cosmart.com.ar`. Cada push a `main` se publica solo. GitHub Pages está **despublicado**; se borró `CNAME`. El repo y el código siguen en GitHub.
- **`cosmart.com.ar` (sin www)** redirige a `www` con una **Regla de redirección de Cloudflare** (plantilla "Redirigir de raíz a WWW", 301, conserva ruta y `?query`) + "Usar siempre HTTPS" activado en la zona. Antes lo hacía GitHub por el `CNAME`. No borrar el registro DNS de la raíz (tiene que seguir proxied).
- **Comportamiento:** `/x.html` redirige (308) a `/x`; una URL inexistente devuelve el `index.html` con 200 (sin `404.html`; GitHub daba 404). `productos-ganadores.html` y `brujula.html` (y sus carpetas homónimas) se sirven igual que antes: verificado byte a byte. Los mails se ocultan con la protección de Cloudflare de la zona (no es del repo).
- **Regla vigente:** `cosmart.com.ar/productos-ganadores` (página vieja) no se toca ni se borra.
- **Pendiente detectado, no tocado:** otras páginas (euforia, etc.) cargan `www.cosmart.com.ar/hm.js` (mapa de calor) y esa dirección da 404 — el archivo no está en este repo.
