export const DASHBOARD_CSS = `
:root {
  --navy: #0A1A40;
  --navy-2: #0D2B6B;
  --panel: #ffffff;
  --panel-2: #F4F6FA;
  --border: #E4E8F0;
  --text: #101728;
  --muted: #5B6478;
  --accent: #E02020;
  --accent-soft: #FDEAEA;
  --mint: #21A883;
  --mint-soft: #E6F5F0;
  --gold: #F2A900;
  --orange: #F47920;
  --ok: #1a7f4a;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--panel-2); color: var(--text); }
#app { min-height: 100vh; }

.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 20% 20%, #14306e 0%, var(--navy) 45%, #061026 100%);
}
.login-box {
  background: var(--panel);
  padding: 2.2rem;
  border-radius: 16px;
  width: 340px;
  box-shadow: 0 20px 50px rgba(0,0,0,.35);
  text-align: center;
}
.login-logo { width: 64px; height: 64px; object-fit: contain; margin-bottom: .8rem; }
.login-box h1 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.35rem; margin: 0 0 .2rem; font-weight: 800; letter-spacing: -.01em; }
.login-box .tagline { color: var(--mint); font-size: .78rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; margin: 0 0 1rem; }
.login-box p { color: var(--muted); font-size: .85rem; margin: 0 0 1.2rem; text-align: left; }
.login-box input {
  width: 100%; padding: .65rem .8rem; margin-bottom: .8rem;
  border: 1px solid var(--border); border-radius: 10px; font-size: .95rem; font-family: inherit;
}
.login-box button, .btn {
  background: var(--accent); color: #fff; border: none; padding: .65rem 1.1rem;
  border-radius: 10px; cursor: pointer; font-size: .88rem; font-weight: 700; font-family: inherit;
  transition: filter .15s ease;
}
.login-box button:hover, .btn:hover { filter: brightness(1.08); }
.login-box button { width: 100%; }
.btn.secondary { background: var(--mint); }
.btn.warn { background: var(--orange); }
.btn.ghost { background: transparent; color: var(--navy-2); border: 1px solid var(--border); }
.btn.small { padding: .35rem .7rem; font-size: .78rem; }
.error-text { color: var(--accent); font-size: .8rem; margin-top: -.4rem; margin-bottom: .8rem; }

.layout { display: flex; min-height: 100vh; }
.sidebar {
  width: 230px; background: linear-gradient(180deg, var(--navy) 0%, #06102a 100%);
  color: #fff; padding: 1.2rem 0; flex-shrink: 0;
}
.brand { display: flex; align-items: center; gap: .6rem; padding: 0 1.2rem; margin-bottom: 1.4rem; }
.brand img { width: 34px; height: 34px; object-fit: contain; border-radius: 8px; background: #fff; padding: 3px; }
.brand .name { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 1.05rem; line-height: 1.1; }
.brand .tag { display: block; font-size: .62rem; color: var(--mint); text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }
.sidebar nav a {
  display: block; padding: .6rem 1.2rem; color: #c7cfe6; text-decoration: none; font-size: .87rem;
  cursor: pointer; border-left: 3px solid transparent;
}
.sidebar nav a.active { color: #fff; background: rgba(255,255,255,.08); border-left-color: var(--accent); font-weight: 700; }
.sidebar .logout { margin-top: 2rem; }
.sidebar .logout a { color: #8b93ad; }

.main { flex: 1; padding: 1.6rem 2rem; max-width: 1150px; }
.main h1 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.4rem; margin: 0 0 1rem; font-weight: 800; }

.card {
  background: var(--panel); border: 1px solid var(--border); border-radius: 12px;
  padding: 1.2rem; margin-bottom: 1rem;
}

.split { display: flex; gap: 1rem; align-items: flex-start; }
.split .list-col { width: 320px; flex-shrink: 0; }
.split .detail-col { flex: 1; min-width: 0; }

.contact-row {
  padding: .7rem .8rem; border-radius: 10px; cursor: pointer; margin-bottom: .3rem;
  border: 1px solid transparent;
}
.contact-row:hover { background: var(--panel-2); }
.contact-row.active { border-color: var(--accent); background: var(--accent-soft); }
.contact-row .name { font-weight: 700; font-size: .9rem; }
.contact-row .meta { color: var(--muted); font-size: .75rem; }
.contact-row .preview { font-size: .8rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.badge {
  display: inline-block; font-size: .68rem; font-weight: 700; padding: .15rem .55rem; border-radius: 999px;
  background: var(--panel-2); color: var(--muted); margin-left: .35rem; white-space: nowrap;
}
.badge.wa { background: #dcf8e7; color: #12783b; }
.badge.ig { background: #fce4ef; color: #9c1a5f; }
.badge.human { background: #fde7d0; color: #9a5b00; }

.messages { height: 420px; overflow-y: auto; padding: .5rem; background: var(--panel-2); border-radius: 10px; margin-bottom: .8rem; }
.msg { max-width: 75%; padding: .5rem .7rem; border-radius: 12px; margin-bottom: .5rem; font-size: .88rem; white-space: pre-wrap; }
.msg.in { background: #fff; border: 1px solid var(--border); }
.msg.out { background: var(--navy-2); color: #fff; margin-left: auto; }
.msg .src { display: block; font-size: .65rem; opacity: .7; margin-top: .2rem; }

.reply-row { display: flex; gap: .5rem; }
.reply-row input { flex: 1; padding: .6rem .7rem; border-radius: 10px; border: 1px solid var(--border); font-family: inherit; }

.flow-item { border: 1px solid var(--border); border-radius: 10px; padding: .8rem; margin-bottom: .6rem; }
.flow-item .top { display: flex; justify-content: space-between; align-items: center; }
.flow-item .kw { color: var(--muted); font-size: .8rem; margin-top: .2rem; }
.flow-item .actions { display: flex; gap: .4rem; }

.step-block { border: 1px dashed var(--border); border-radius: 10px; padding: .8rem; margin-bottom: .7rem; background: var(--panel-2); }
.step-block .row { display: flex; gap: .5rem; margin-bottom: .5rem; }
.step-block input, .step-block textarea, select, .card input[type=text], .card textarea {
  width: 100%; padding: .5rem .6rem; border-radius: 8px; border: 1px solid var(--border); font-size: .85rem;
  font-family: inherit;
}
.step-block textarea { min-height: 60px; }
.button-row { display: flex; gap: .5rem; margin-bottom: .4rem; align-items: center; }
.button-row input { flex: 1; }
.button-row select { width: 180px; }

label { font-size: .78rem; font-weight: 700; display: block; margin-bottom: .3rem; color: var(--muted); text-transform: uppercase; letter-spacing: .02em; }
.field { margin-bottom: .9rem; }
.toggle-row { display: flex; align-items: center; gap: .5rem; margin-bottom: .8rem; }
.hint { color: var(--muted); font-size: .78rem; margin-top: .2rem; }
.warning-box {
  background: #FEF3E3; border: 1px solid #F7D9A8; color: #7A4B00; border-radius: 10px;
  padding: .8rem 1rem; font-size: .82rem; margin-bottom: 1rem; line-height: 1.5;
}

.vertical-card { display: flex; gap: .9rem; border: 1px solid var(--border); border-radius: 12px; padding: 1rem; margin-bottom: .8rem; }
.vertical-swatch { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
.vertical-card .vname { font-weight: 800; font-size: .95rem; }
.vertical-card .vassist { font-size: .78rem; color: var(--muted); margin-bottom: .5rem; }
.vertical-card textarea { min-height: 90px; }

.count-pill { display: inline-block; background: var(--mint-soft); color: var(--mint); font-weight: 700; padding: .3rem .8rem; border-radius: 999px; font-size: .82rem; margin-left: .5rem; }
`;
