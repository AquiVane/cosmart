-- Esquema D1 para el bot de ventas de COSMART / Vaneh
-- Se aplica con: wrangler d1 execute cosmart-bot-db --file=./schema.sql (--remote para producción)

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,              -- 'whatsapp' | 'instagram'
  external_id TEXT NOT NULL,          -- número de WhatsApp o PSID de Instagram
  name TEXT,
  ai_enabled INTEGER NOT NULL DEFAULT 1,   -- 0 = tomado por un humano, el bot no contesta
  current_flow_id TEXT,
  current_step_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_message_at TEXT,
  UNIQUE(channel, external_id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_last_message ON contacts(last_message_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  direction TEXT NOT NULL,   -- 'in' | 'out'
  source TEXT NOT NULL,      -- 'contact' | 'flow' | 'ai' | 'human'
  body TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages(contact_id, created_at);

CREATE TABLE IF NOT EXISTS flows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_keywords TEXT NOT NULL,  -- palabras clave separadas por coma que activan el flujo
  active INTEGER NOT NULL DEFAULT 1,
  entry_step_key TEXT NOT NULL,
  steps_json TEXT NOT NULL,        -- { [step_key]: { message, buttons: [{label, next_step_key}], is_end } }
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
