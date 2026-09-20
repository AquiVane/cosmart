import { Hono } from "hono";
import type { CommentRule, Env, FlowDefinition } from "../types";
import { requireAdmin } from "../security";
import {
  getAllSettings,
  setSetting,
  listFlows,
  upsertFlow,
  deleteFlow,
  setFlowActive,
  listContacts,
  listContactsByFilter,
  getContactById,
  getRecentMessages,
  setContactAiEnabled,
  logMessage,
  listCommentRules,
  upsertCommentRule,
  deleteCommentRule,
  setCommentRuleActive,
} from "../db";
import { sendToChannel } from "../channels/send";
import { VERTICALS, DEFAULT_FALLBACK_MESSAGE, DEFAULT_HANDOFF_KEYWORDS, DEFAULT_FLOW } from "../knowledge/verticals";

export const adminRoutes = new Hono<{ Bindings: Env }>();

adminRoutes.use("*", requireAdmin);

adminRoutes.get("/me", (c) => c.json({ ok: true }));

// Carga los ajustes y el flujo de bienvenida por defecto. Es seguro llamarla varias
// veces: solo completa lo que todavía esté vacío, nunca pisa ediciones ya hechas.
adminRoutes.post("/seed", async (c) => {
  const settings = await getAllSettings(c.env.DB);
  if (!settings.fallback_message) await setSetting(c.env.DB, "fallback_message", DEFAULT_FALLBACK_MESSAGE);
  if (!settings.handoff_keywords) await setSetting(c.env.DB, "handoff_keywords", DEFAULT_HANDOFF_KEYWORDS);
  if (!settings.ai_enabled) await setSetting(c.env.DB, "ai_enabled", "1");

  const existingFlows = await listFlows(c.env.DB);
  if (existingFlows.length === 0) {
    await upsertFlow(c.env.DB, DEFAULT_FLOW);
  }

  return c.json({ ok: true });
});

// ---------- Verticales (personas de IA) ----------

adminRoutes.get("/verticals", async (c) => {
  const settings = await getAllSettings(c.env.DB);
  const list = VERTICALS.map((v) => ({
    ...v,
    knowledge: settings["vertical_kb_" + v.id] || v.knowledge,
    isCustom: Boolean(settings["vertical_kb_" + v.id]),
  }));
  return c.json(list);
});

adminRoutes.put("/verticals/:id/knowledge", async (c) => {
  const id = c.req.param("id");
  const { knowledge } = await c.req.json<{ knowledge: string }>();
  await setSetting(c.env.DB, "vertical_kb_" + id, knowledge || "");
  return c.json({ ok: true });
});

// ---------- Settings ----------

adminRoutes.get("/settings", async (c) => {
  const settings = await getAllSettings(c.env.DB);
  return c.json(settings);
});

adminRoutes.put("/settings", async (c) => {
  const body = await c.req.json<Record<string, string>>();
  for (const [key, value] of Object.entries(body)) {
    await setSetting(c.env.DB, key, String(value));
  }
  return c.json({ ok: true });
});

// ---------- Flows ----------

adminRoutes.get("/flows", async (c) => {
  const flows = await listFlows(c.env.DB);
  return c.json(flows);
});

adminRoutes.post("/flows", async (c) => {
  const body = await c.req.json<FlowDefinition>();
  if (!body.name || !body.entry_step_key || !body.steps || !body.steps[body.entry_step_key]) {
    return c.json({ error: "Faltan campos: name, entry_step_key y su paso correspondiente en steps" }, 400);
  }
  const flow = await upsertFlow(c.env.DB, {
    id: body.id,
    name: body.name,
    trigger_keywords: body.trigger_keywords || [],
    active: body.active !== false,
    entry_step_key: body.entry_step_key,
    steps: body.steps,
  });
  return c.json(flow);
});

adminRoutes.put("/flows/:id/active", async (c) => {
  const id = c.req.param("id");
  const { active } = await c.req.json<{ active: boolean }>();
  await setFlowActive(c.env.DB, id, !!active);
  return c.json({ ok: true });
});

adminRoutes.delete("/flows/:id", async (c) => {
  await deleteFlow(c.env.DB, c.req.param("id"));
  return c.json({ ok: true });
});

// ---------- Reglas de comentarios (Instagram) ----------

adminRoutes.get("/comment-rules", async (c) => {
  const rules = await listCommentRules(c.env.DB);
  return c.json(rules);
});

adminRoutes.post("/comment-rules", async (c) => {
  const body = await c.req.json<CommentRule>();
  if (!body.name || !body.dm_message) {
    return c.json({ error: "Faltan campos: name y dm_message" }, 400);
  }
  const rule = await upsertCommentRule(c.env.DB, {
    id: body.id,
    name: body.name,
    media_id: body.media_id || null,
    keyword: body.keyword || null,
    public_reply: body.public_reply || null,
    dm_message: body.dm_message,
    vertical: body.vertical || null,
    active: body.active !== false,
  });
  return c.json(rule);
});

adminRoutes.put("/comment-rules/:id/active", async (c) => {
  const { active } = await c.req.json<{ active: boolean }>();
  await setCommentRuleActive(c.env.DB, c.req.param("id"), !!active);
  return c.json({ ok: true });
});

adminRoutes.delete("/comment-rules/:id", async (c) => {
  await deleteCommentRule(c.env.DB, c.req.param("id"));
  return c.json({ ok: true });
});

// ---------- Difusiones ----------

adminRoutes.get("/broadcasts/preview", async (c) => {
  const channel = c.req.query("channel") || "all";
  const vertical = c.req.query("vertical") || "all";
  const contacts = await listContactsByFilter(c.env.DB, channel, vertical);
  return c.json({ count: contacts.length });
});

adminRoutes.post("/broadcasts/send", async (c) => {
  const { channel, vertical, text } = await c.req.json<{ channel: string; vertical: string; text: string }>();
  if (!text?.trim()) return c.json({ error: "Falta el mensaje" }, 400);

  const contacts = await listContactsByFilter(c.env.DB, channel || "all", vertical || "all");
  let sent = 0;
  let failed = 0;
  for (const contact of contacts) {
    try {
      await sendToChannel(c.env, contact.channel, contact.external_id, { text, buttons: [] });
      await logMessage(c.env.DB, contact.id, "out", "human", text);
      sent++;
    } catch (err) {
      console.error("Fallo al enviar difusión a un contacto", contact.id, err);
      failed++;
    }
  }
  return c.json({ sent, failed, total: contacts.length });
});

// ---------- Conversaciones ----------

adminRoutes.get("/contacts", async (c) => {
  const contacts = await listContacts(c.env.DB);
  return c.json(contacts);
});

adminRoutes.get("/contacts/:id/messages", async (c) => {
  const messages = await getRecentMessages(c.env.DB, c.req.param("id"), 100);
  return c.json(messages);
});

adminRoutes.post("/contacts/:id/reply", async (c) => {
  const contact = await getContactById(c.env.DB, c.req.param("id"));
  if (!contact) return c.json({ error: "No existe ese contacto" }, 404);

  const { text } = await c.req.json<{ text: string }>();
  if (!text?.trim()) return c.json({ error: "Falta el texto" }, 400);

  await sendToChannel(c.env, contact.channel, contact.external_id, { text, buttons: [] });
  await logMessage(c.env.DB, contact.id, "out", "human", text);
  await setContactAiEnabled(c.env.DB, contact.id, false);

  return c.json({ ok: true });
});

adminRoutes.post("/contacts/:id/takeover", async (c) => {
  const { enabled } = await c.req.json<{ enabled: boolean }>();
  await setContactAiEnabled(c.env.DB, c.req.param("id"), !!enabled);
  return c.json({ ok: true });
});
