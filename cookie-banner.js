// Aviso de cookies de COSMART -- un solo archivo, cargado desde
// cosmart.com.ar por todos los sitios del ecosistema (training, euforia,
// hub, cosmart.com.ar mismo), así se actualiza en un solo lugar.
// Pedido de Vaneh (30/09): "me olvidé en todas las verticales la política
// de cookies" -- el texto de la política ya existía (politica-de-
// privacidad.html, sección 8), lo que faltaba era este aviso visible.
// No bloquea nada ni pide elegir categorías: los sitios de COSMART solo
// usan cookies/localStorage técnicos (sesión, carrito) -- no hay cookies
// de seguimiento publicitario de terceros que requieran opt-in.
(function () {
  try {
    if (localStorage.getItem('cosmart_cookies_ok')) return;
  } catch (e) { return; } // localStorage bloqueado (modo privado estricto, etc.) -- no insistir

  var bar = document.createElement('div');
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Aviso de cookies');
  bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#111827;color:#f3f4f6;'
    + 'padding:14px 18px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:14px;'
    + 'font:14px/1.5 -apple-system,"Segoe UI",Arial,sans-serif;box-shadow:0 -2px 12px rgba(0,0,0,.25);';

  var texto = document.createElement('span');
  texto.style.cssText = 'max-width:640px;';
  texto.innerHTML = 'Usamos cookies técnicas necesarias para el funcionamiento del sitio (como mantener tu sesión iniciada). '
    + 'No usamos cookies de seguimiento publicitario de terceros. '
    + '<a href="https://cosmart.com.ar/politica-de-privacidad#cookies" target="_blank" style="color:#93c5fd;text-decoration:underline;">Más información</a>';

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Entendido';
  btn.style.cssText = 'background:#E02020;color:#fff;border:none;border-radius:6px;padding:8px 18px;'
    + 'font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap;flex-shrink:0;';
  btn.addEventListener('click', function () {
    try { localStorage.setItem('cosmart_cookies_ok', '1'); } catch (e) {}
    bar.remove();
  });

  bar.appendChild(texto);
  bar.appendChild(btn);

  function montar() { document.body.appendChild(bar); }
  if (document.body) montar();
  else document.addEventListener('DOMContentLoaded', montar);
})();
