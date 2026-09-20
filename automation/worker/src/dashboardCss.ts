export const DASHBOARD_CSS = `
:root {
  --bg: #0f172a;
  --panel: #ffffff;
  --panel-2: #f4f5f7;
  --border: #e3e5e9;
  --text: #1b1e26;
  --muted: #6b7280;
  --accent: #c0392b;
  --accent-2: #1e3a5f;
  --ok: #1a7f4a;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--panel-2); color: var(--text); }
#app { min-height: 100vh; }

.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent-2), var(--bg));
}
.login-box {
  background: var(--panel);
  padding: 2rem;
  border-radius: 12px;
  width: 320px;
  box-shadow: 0 10px 30px rgba(0,0,0,.25);
}
.login-box h1 { font-size: 1.2rem; margin: 0 0 .3rem; }
.login-box p { color: var(--muted); font-size: .85rem; margin: 0 0 1.2rem; }
.login-box input {
  width: 100%; padding: .6rem .7rem; margin-bottom: .8rem;
  border: 1px solid var(--border); border-radius: 8px; font-size: .95rem;
}
.login-box button, .btn {
  background: var(--accent); color: #fff; border: none; padding: .6rem 1rem;
  border-radius: 8px; cursor: pointer; font-size: .9rem; font-weight: 600;
}
.login-box button { width: 100%; }
.btn.secondary { background: var(--accent-2); }
.btn.ghost { background: transparent; color: var(--accent-2); border: 1px solid var(--border); }
.btn.small { padding: .35rem .7rem; font-size: .8rem; }
.error-text { color: var(--accent); font-size: .8rem; margin-top: -.4rem; margin-bottom: .8rem; }

.layout { display: flex; min-height: 100vh; }
.sidebar {
  width: 220px; background: var(--bg); color: #fff; padding: 1.2rem 0; flex-shrink: 0;
}
.sidebar h2 { font-size: 1rem; padding: 0 1.2rem; margin: 0 0 1.2rem; }
.sidebar nav a {
  display: block; padding: .6rem 1.2rem; color: #cbd5e1; text-decoration: none; font-size: .9rem;
  cursor: pointer; border-left: 3px solid transparent;
}
.sidebar nav a.active { color: #fff; background: rgba(255,255,255,.08); border-left-color: var(--accent); }
.sidebar .logout { margin-top: 2rem; }

.main { flex: 1; padding: 1.6rem 2rem; max-width: 1100px; }
.main h1 { font-size: 1.3rem; margin: 0 0 1rem; }

.card {
  background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
  padding: 1.2rem; margin-bottom: 1rem;
}

.split { display: flex; gap: 1rem; align-items: flex-start; }
.split .list-col { width: 320px; flex-shrink: 0; }
.split .detail-col { flex: 1; min-width: 0; }

.contact-row {
  padding: .7rem .8rem; border-radius: 8px; cursor: pointer; margin-bottom: .3rem;
  border: 1px solid transparent;
}
.contact-row:hover { background: var(--panel-2); }
.contact-row.active { border-color: var(--accent); background: #fdf1f0; }
.contact-row .name { font-weight: 600; font-size: .9rem; }
.contact-row .meta { color: var(--muted); font-size: .75rem; }
.contact-row .preview { font-size: .8rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.badge {
  display: inline-block; font-size: .7rem; padding: .1rem .5rem; border-radius: 999px;
  background: var(--panel-2); color: var(--muted); margin-left: .4rem;
}
.badge.wa { background: #dcf8e7; color: #12783b; }
.badge.ig { background: #fce4ef; color: #9c1a5f; }
.badge.human { background: #fde7d0; color: #9a5b00; }

.messages { height: 420px; overflow-y: auto; padding: .5rem; background: var(--panel-2); border-radius: 8px; margin-bottom: .8rem; }
.msg { max-width: 75%; padding: .5rem .7rem; border-radius: 10px; margin-bottom: .5rem; font-size: .88rem; white-space: pre-wrap; }
.msg.in { background: #fff; border: 1px solid var(--border); }
.msg.out { background: var(--accent-2); color: #fff; margin-left: auto; }
.msg .src { display: block; font-size: .65rem; opacity: .7; margin-top: .2rem; }

.reply-row { display: flex; gap: .5rem; }
.reply-row input { flex: 1; padding: .6rem .7rem; border-radius: 8px; border: 1px solid var(--border); }

.flow-item { border: 1px solid var(--border); border-radius: 8px; padding: .8rem; margin-bottom: .6rem; }
.flow-item .top { display: flex; justify-content: space-between; align-items: center; }
.flow-item .kw { color: var(--muted); font-size: .8rem; margin-top: .2rem; }
.flow-item .actions { display: flex; gap: .4rem; }

.step-block { border: 1px dashed var(--border); border-radius: 8px; padding: .8rem; margin-bottom: .7rem; background: var(--panel-2); }
.step-block .row { display: flex; gap: .5rem; margin-bottom: .5rem; }
.step-block input, .step-block textarea, select, .card input[type=text], .card textarea {
  width: 100%; padding: .5rem .6rem; border-radius: 6px; border: 1px solid var(--border); font-size: .85rem;
  font-family: inherit;
}
.step-block textarea { min-height: 60px; }
.button-row { display: flex; gap: .5rem; margin-bottom: .4rem; align-items: center; }
.button-row input { flex: 1; }
.button-row select { width: 180px; }

label { font-size: .8rem; font-weight: 600; display: block; margin-bottom: .3rem; color: var(--muted); }
.field { margin-bottom: .9rem; }
.toggle-row { display: flex; align-items: center; gap: .5rem; margin-bottom: .8rem; }
.hint { color: var(--muted); font-size: .78rem; margin-top: .2rem; }
`;
