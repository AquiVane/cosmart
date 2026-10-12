/*!
 * hm.js — Mapas de calor de COSMART (se ve en Hub → MAPAS DE CALOR)
 *
 * Analítica propia, sin cookies y sin datos personales:
 *   · visitas, sesiones y cuántas veces vuelve una misma persona (id anónimo en localStorage)
 *   · dónde hace clic (posición + botón/enlace tocado, nunca lo que escribe en un campo)
 *   · hasta dónde hace scroll y cuánto tiempo está realmente en pantalla
 *   · de dónde viene (Instagram, Google, mail, directo...) y a qué otra página nuestra pasa
 *   · acciones: envío de formularios, descargas y eventos propios (window.hm.event('nombre'))
 *
 * Respeta "No rastrear" (DNT / Global Privacy Control). Para NO medir tus propias visitas:
 *   abrí cualquier página con  ?hm_off=1  (y  ?hm_off=0  para volver a medir).
 * Se carga con:  <script defer src="https://cosmart.com.ar/hm.js"></script>
 */
(function () {
  'use strict';
  try {
    if (window.__hm) return; window.__hm = true;
    var nav = navigator, loc = location, doc = document;
    var ENDPOINT = 'https://marketing-hub.conglomeradocosmart.workers.dev/hm/collect';
    // Hosts propios (para pasar el id de visitante/sesión de una página nuestra a otra). Mantener
    // en sincronía con HM_SITIOS de workers/marketing-hub/src/mapas-calor.js.
    var PROPIOS = ['cosmart.com.ar', 'www.cosmart.com.ar', 'training.cosmart.com.ar', 'hub.cosmart.com.ar',
      'design.cosmart.com.ar', 'euforia.cosmart.com.ar', 'comunicos.cosmart.com.ar', 'mpg.cosmart.com.ar',
      'rumbovoraz.cosmart.com.ar', 'shows.cosmart.com.ar', 'talent.cosmart.com.ar', 'germanaquino.com.ar',
      'www.germanaquino.com.ar', 'academy.vamatienda.com.ar'];
    var MAX_CLICS = 60, MAX_EVENTOS = 40, IDLE_MS = 30 * 60 * 1000;

    // ── Almacenamiento seguro (modo privado / bloqueado) ──
    function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin storage */ } }
    function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
    function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* sin storage */ } }

    // ── Parámetros de la URL: opt-out propio y traspaso entre páginas nuestras ──
    var qs = new URLSearchParams(loc.search);
    if (qs.get('hm_off') === '1') lsSet('hm_off', '1');
    if (qs.get('hm_off') === '0') { try { localStorage.removeItem('hm_off'); } catch (e) { /* nada */ } }
    var hmDentro = qs.has('_hv') || qs.has('_hs') || qs.has('_hn') || qs.has('hm_off');
    var pv_ = qs.get('_hv'), ps_ = qs.get('_hs'), pn_ = qs.get('_hn');
    if (hmDentro && history.replaceState) { // limpia la URL (no queda ensuciada ni se comparte)
      ['_hv', '_hs', '_hn', 'hm_off'].forEach(function (k) { qs.delete(k); });
      var limpio = loc.pathname + (qs.toString() ? '?' + qs.toString() : '') + loc.hash;
      try { history.replaceState(history.state, '', limpio); } catch (e) { /* nada */ }
    }
    if (lsGet('hm_off') === '1') return;
    if (nav.doNotTrack === '1' || window.doNotTrack === '1' || nav.globalPrivacyControl === true || nav.webdriver) return;
    var metaOff = doc.querySelector('meta[name="hm-ignore"]'); if (metaOff) return;

    // ── Ids anónimos ──
    function rnd(n) {
      var a = new Uint8Array(n), s = '';
      try { (window.crypto || window.msCrypto).getRandomValues(a); } catch (e) { for (var i = 0; i < n; i++) a[i] = Math.random() * 256; }
      for (var j = 0; j < n; j++) s += (a[j] % 36).toString(36);
      return s;
    }
    var okId = function (v) { return /^[A-Za-z0-9_-]{6,40}$/.test(v || ''); };
    var vid = okId(pv_) ? pv_ : lsGet('hm_v');
    if (!okId(vid)) vid = 'v' + rnd(15);
    lsSet('hm_v', vid);

    var ahora = Date.now(), sid = ssGet('hm_s'), ult = Number(ssGet('hm_t')) || 0, vn = Number(lsGet('hm_n')) || 0;
    var psid = '';
    if (okId(ps_)) { // viene de otra página nuestra: misma sesión, mismo visitante
      sid = ps_; psid = ps_; vn = Math.max(vn, Number(pn_) || 1);
    } else if (!okId(sid) || ahora - ult > IDLE_MS) { // sesión nueva
      sid = 's' + rnd(15); vn = vn + 1;
    } else if (!vn) vn = 1;
    lsSet('hm_n', String(vn)); ssSet('hm_s', sid); ssSet('hm_t', String(ahora));

    var pvid = 'p' + rnd(15);
    var cola = [], clics = 0, eventos = 0, maxScroll = 0, exitTo = '';
    var activo = 0, desde = performance.now(), visible = !doc.hidden;
    var ultEnviado = '', temporizador = 0;

    function alto() { return Math.max(doc.body ? doc.body.scrollHeight : 0, doc.documentElement.scrollHeight, 0); }
    function ancho() { return Math.max(doc.documentElement.clientWidth || 0, 1); }
    function base() {
      return { v: 1, pvid: pvid, sid: sid, vid: vid, vn: vn, psid: psid, host: loc.hostname, path: loc.pathname,
        vw: window.innerWidth || ancho(), vh: window.innerHeight || 0, dh: alto() };
    }
    function enviar(p) {
      var cuerpo = JSON.stringify(p);
      try {
        if (nav.sendBeacon && nav.sendBeacon(ENDPOINT, new Blob([cuerpo], { type: 'text/plain' }))) return;
      } catch (e) { /* cae al fetch */ }
      try { fetch(ENDPOINT, { method: 'POST', body: cuerpo, keepalive: true, mode: 'no-cors', headers: { 'Content-Type': 'text/plain' } }); } catch (e) { /* nada */ }
    }

    // ── Visita: primer envío ──
    function utm() {
      var q = new URLSearchParams(loc.search);
      return { source: q.get('utm_source') || '', medium: q.get('utm_medium') || '', campaign: q.get('utm_campaign') || '' };
    }
    function inicio() {
      var p = base(); p.init = true; p.ref = doc.referrer || ''; p.utm = utm();
      enviar(p);
    }

    // ── Cola de eventos (clics / acciones) ──
    function empujar(ev) { cola.push(ev); if (!temporizador) temporizador = setTimeout(vaciar, 3000); }
    function vaciar() {
      temporizador = 0;
      if (!cola.length) return;
      var p = base(); p.e = cola.splice(0, MAX_EVENTOS); enviar(p);
    }
    function accion(nombre, href) {
      if (eventos >= MAX_EVENTOS) return; eventos++;
      empujar({ type: 'event', name: String(nombre).slice(0, 40), href: href || '' });
    }

    // ── Clics ──
    var INTERACTIVOS = 'a,button,summary,[role="button"],[data-hm],input[type="submit"],input[type="button"],label';
    function texto(el) {
      var t = el.getAttribute('data-hm') || el.getAttribute('aria-label') || '';
      if (!t) t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t && (el.type === 'submit' || el.type === 'button')) t = el.value || '';
      return t.slice(0, 40);
    }
    function descriptor(el) {
      var d = el.tagName.toLowerCase();
      if (el.id) d += '#' + el.id;
      var dl = el.getAttribute('data-link'); if (dl) d += '[data-link=' + dl + ']';
      var dh = el.getAttribute('data-hm'); if (dh) d += '[hm=' + dh + ']';
      if (!dl && !dh) d += ':' + texto(el); // con data-link / data-hm la clave es estable aunque cambie el texto
      return d.slice(0, 120);
    }
    function destino(a) {
      try {
        var u = new URL(a.href, loc.href);
        return (u.hostname === loc.hostname ? '' : u.hostname) + u.pathname.replace(/\/+$/, '');
      } catch (e) { return ''; }
    }
    function alClic(e) {
      try {
        var t = e.target; if (!t || !t.closest) return;
        var inter = t.closest(INTERACTIVOS);
        // Traspaso de visitante/sesión al ir a otra página nuestra
        var a = t.closest('a[href]');
        if (a) {
          try {
            var u = new URL(a.href, loc.href);
            if (PROPIOS.indexOf(u.hostname) > -1 && u.hostname !== loc.hostname && /^https?:$/.test(u.protocol)) {
              u.searchParams.set('_hv', vid); u.searchParams.set('_hs', sid); u.searchParams.set('_hn', String(vn));
              a.href = u.toString();
            }
            var dest = destino(a);
            if (dest && (u.hostname !== loc.hostname || u.pathname !== loc.pathname) && !a.hasAttribute('download')) exitTo = dest.replace(/^\//, '/');
            if (/\.(pdf|xlsx?|zip|docx?|csv)(\?|$)/i.test(u.pathname)) accion('descarga', dest);
          } catch (e2) { /* href raro */ }
        }
        var dEv = t.closest('[data-hm-event]'); if (dEv) accion(dEv.getAttribute('data-hm-event'));
        if (clics >= MAX_CLICS) return; clics++;
        var cw = ancho();
        empujar({ type: 'click', x: Math.round((e.pageX / cw) * 1000) / 1000, y: Math.round(e.pageY),
          el: inter ? descriptor(inter) : '', txt: inter ? texto(inter) : '', href: a ? destino(a) : '' });
      } catch (err) { /* nunca romper la página */ }
    }
    doc.addEventListener('click', alClic, true);
    doc.addEventListener('submit', function (e) {
      try { var f = e.target; accion('form_submit', f && f.id ? '#' + f.id : ''); } catch (err) { /* nada */ }
    }, true);

    // ── Scroll ──
    var raf = 0;
    function medirScroll() {
      raf = 0;
      var h = alto(), vh = window.innerHeight || 0;
      if (h <= 0) return;
      var pct = Math.min(100, Math.round(((window.pageYOffset || doc.documentElement.scrollTop || 0) + vh) / h * 100));
      if (pct > maxScroll) maxScroll = pct;
    }
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(medirScroll); }, { passive: true });

    // ── Tiempo en pantalla (solo cuando la pestaña está visible) ──
    function sumarTiempo() { if (visible) { activo += performance.now() - desde; } desde = performance.now(); }
    function cerrar() {
      sumarTiempo(); medirScroll(); ssSet('hm_t', String(Date.now()));
      var p = base(); p.u = { dur: Math.round(activo), sc: maxScroll, exit: exitTo };
      if (cola.length) p.e = cola.splice(0, MAX_EVENTOS);
      var firma = p.u.dur + '|' + p.u.sc + '|' + p.u.exit + '|' + (p.e ? p.e.length : 0);
      if (firma === ultEnviado) return; ultEnviado = firma;
      enviar(p);
    }
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) { cerrar(); visible = false; } else { visible = true; desde = performance.now(); ssSet('hm_t', String(Date.now())); }
    });
    window.addEventListener('pagehide', function () { cerrar(); });

    // ── API pública mínima ──
    window.hm = { event: function (nombre) { accion(nombre); }, off: function () { lsSet('hm_off', '1'); } };

    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { inicio(); medirScroll(); });
    else { inicio(); medirScroll(); }
  } catch (err) { /* el tracker jamás debe romper una página */ }
})();
