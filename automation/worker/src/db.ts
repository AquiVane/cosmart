import type { Channel, Contact, FlowDefinition } from "./types";

function newId(): string {
  return crypto.randomUUID();
}

export async function getOrCreateContact(
  db: D1Database,
  channel: Channel,
  externalId: string,
  name: string | null
): Promise<Contact> {
  const existing = await db
    .prepare("SELECT * FROM contacts WHERE channel = ? AND external_id = ?")
    .bind(channel, externalId)
    .first<Contact>();

  if (existing) {
    if (name && name !== existing.name) {
      await db.prepare("UPDATE contacts SET name = ? WHERE id = ?").bind(name, existing.id).run();
      existing.name = name;
    }
    return existing;
  }

  const id = newId();
  await db
    .prepare(
      "INSERT INTO contacts (id, channel, external_id, name, ai_enabled) VALUES (?, ?, ?, ?, 1)"
    )
    .bind(id, channel, externalId, name)
    .run();

  return {
    id,
    channel,
    external_id: externalId,
    name,
    ai_enabled: 1,
    current_flow_id: null,
    current_step_key: null,
    created_at: new Date().toISOString(),
    last_message_at: null,
  };
}

export async function touchContact(db: D1Database, contactId: string): Promise<void> {
  await db
    .prepare("UPDATE contacts SET last_message_at = datetime('now') WHERE id = ?")
    .bind(contactId)
    .run();
}

export async function setContactFlowState(
  db: D1Database,
  contactId: string,
  flowId: string | null,
  stepKey: string | null
): Promise<void> {
  await db
    .prepare("UPDATE contacts SET current_flow_id = ?, current_step_key = ? WHERE id = ?")
    .bind(flowId, stepKey, contactId)
    .run();
}

export async function setContactAiEnabled(
  db: D1Database,
  contactId: string,
  enabled: boolean
): Promise<void> {
  await db
    .prepare("UPDATE contacts SET ai_enabled = ? WHERE id = ?")
    .bind(enabled ? 1 : 0, contactId)
    .run();
}

export async function logMessage(
  db: D1Database,
  contactId: string,
  direction: "in" | "out",
  source: "contact" | "flow" | "ai" | "human",
  body: string
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO messages (id, contact_id, direction, source, body) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(newId(), contactId, direction, source, body)
    .run();
}

export async function getRecentMessages(
  db: D1Database,
  contactId: string,
  limit = 12
): Promise<{ direction: "in" | "out"; body: string }[]> {
  const { results } = await db
    .prepare(
      "SELECT direction, body FROM messages WHERE contact_id = ? ORDER BY created_at DESC LIMIT ?"
    )
    .bind(contactId, limit)
    .all<{ direction: "in" | "out"; body: string }>();
  return (results || []).reverse();
}

export async function listContacts(db: D1Database, limit = 100) {
  const { results } = await db
    .prepare(
      `SELECT c.*, (
         SELECT body FROM messages m WHERE m.contact_id = c.id ORDER BY m.created_at DESC LIMIT 1
       ) AS last_message
       FROM contacts c
       ORDER BY (c.last_message_at IS NULL), c.last_message_at DESC
       LIMIT ?`
    )
    .bind(limit)
    .all();
  return results || [];
}

export async function getContactById(db: D1Database, id: string): Promise<Contact | null> {
  return db.prepare("SELECT * FROM contacts WHERE id = ?").bind(id).first<Contact>();
}

// ---------- Settings ----------

export async function getSetting(db: D1Database, key: string): Promise<string | null> {
  const row = await db.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first<{
    value: string;
  }>();
  return row ? row.value : null;
}

export async function setSetting(db: D1Database, key: string, value: string): Promise<void> {
  await db
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .bind(key, value)
    .run();
}

export async function getAllSettings(db: D1Database): Promise<Record<string, string>> {
  const { results } = await db.prepare("SELECT key, value FROM settings").all<{
    key: string;
    value: string;
  }>();
  const out: Record<string, string> = {};
  for (const r of results || []) out[r.key] = r.value;
  return out;
}

// ---------- Flows ----------

interface FlowRow {
  id: string;
  name: string;
  trigger_keywords: string;
  active: number;
  entry_step_key: string;
  steps_json: string;
}

function rowToFlow(row: FlowRow): FlowDefinition {
  return {
    id: row.id,
    name: row.name,
    trigger_keywords: row.trigger_keywords
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean),
    active: row.active === 1,
    entry_step_key: row.entry_step_key,
    steps: JSON.parse(row.steps_json),
  };
}

export async function listFlows(db: D1Database): Promise<FlowDefinition[]> {
  const { results } = await db
    .prepare("SELECT * FROM flows ORDER BY created_at DESC")
    .all<FlowRow>();
  return (results || []).map(rowToFlow);
}

export async function listActiveFlows(db: D1Database): Promise<FlowDefinition[]> {
  const { results } = await db
    .prepare("SELECT * FROM flows WHERE active = 1 ORDER BY created_at DESC")
    .all<FlowRow>();
  return (results || []).map(rowToFlow);
}

export async function getFlow(db: D1Database, id: string): Promise<FlowDefinition | null> {
  const row = await db.prepare("SELECT * FROM flows WHERE id = ?").bind(id).first<FlowRow>();
  return row ? rowToFlow(row) : null;
}

export async function upsertFlow(
  db: D1Database,
  flow: Omit<FlowDefinition, "id"> & { id?: string }
): Promise<FlowDefinition> {
  const id = flow.id || newId();
  const triggerKeywords = flow.trigger_keywords.join(",");
  const stepsJson = JSON.stringify(flow.steps);

  const existing = flow.id
    ? await db.prepare("SELECT id FROM flows WHERE id = ?").bind(flow.id).first()
    : null;

  if (existing) {
    await db
      .prepare(
        `UPDATE flows SET name = ?, trigger_keywords = ?, active = ?, entry_step_key = ?, steps_json = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(flow.name, triggerKeywords, flow.active ? 1 : 0, flow.entry_step_key, stepsJson, id)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO flows (id, name, trigger_keywords, active, entry_step_key, steps_json)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(id, flow.name, triggerKeywords, flow.active ? 1 : 0, flow.entry_step_key, stepsJson)
      .run();
  }

  return { ...flow, id, trigger_keywords: flow.trigger_keywords };
}

export async function deleteFlow(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM flows WHERE id = ?").bind(id).run();
}

export async function setFlowActive(db: D1Database, id: string, active: boolean): Promise<void> {
  await db.prepare("UPDATE flows SET active = ? WHERE id = ?").bind(active ? 1 : 0, id).run();
}
