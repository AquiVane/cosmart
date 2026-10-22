# HANDOFF — cosmart (sitio principal, www.cosmart.com.ar)

## 22/10 — Hosting migrado de GitHub Pages a Cloudflare Pages
- **Motivo:** los términos de GitHub Pages no permiten usarlo como hosting de un negocio/e-commerce. Pedido de Vaneh: sacar los sitios comerciales de GitHub Pages.
- **Ahora:** proyecto **Cloudflare Pages `cosmart`** (preview `cosmart-6ir.pages.dev`) conectado a `AquiVane/cosmart`, rama `main`, sin build, salida = raíz. Dominio personalizado: `www.cosmart.com.ar`. Cada push a `main` se publica solo. GitHub Pages está **despublicado**; se borró `CNAME`. El repo y el código siguen en GitHub.
- **`cosmart.com.ar` (sin www)** redirige a `www` con una **Regla de redirección de Cloudflare** (plantilla "Redirigir de raíz a WWW", 301, conserva ruta y `?query`) + "Usar siempre HTTPS" activado en la zona. Antes lo hacía GitHub por el `CNAME`. No borrar el registro DNS de la raíz (tiene que seguir proxied).
- **Comportamiento:** `/x.html` redirige (308) a `/x`; una URL inexistente devuelve el `index.html` con 200 (sin `404.html`; GitHub daba 404). `productos-ganadores.html` y `brujula.html` (y sus carpetas homónimas) se sirven igual que antes: verificado byte a byte. Los mails se ocultan con la protección de Cloudflare de la zona (no es del repo).
- **Regla vigente:** `cosmart.com.ar/productos-ganadores` (página vieja) no se toca ni se borra.
- **Pendiente detectado, no tocado:** otras páginas (euforia, etc.) cargan `www.cosmart.com.ar/hm.js` (mapa de calor) y esa dirección da 404 — el archivo no está en este repo.
