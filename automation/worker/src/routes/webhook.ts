import { Hono } from "hono";
import type { Env } from "../types";
import { verifyMetaSignature } from "../security";
import { parseWhatsappWebhook } from "../channels/whatsapp";
import { parseInstagramWebhook } from "../channels/instagram";
import { handleInboundMessage } from "../engine/flowEngine";

export const webhookRoutes = new Hono<{ Bindings: Env }>();

// Meta llama a esta ruta con GET una sola vez, para verificar que el webhook es tuyo.
// La misma URL sirve tanto para el producto WhatsApp como para el producto Instagram.
webhookRoutes.get("/meta", (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  if (mode === "subscribe" && token === c.env.META_VERIFY_TOKEN && challenge) {
    return c.text(challenge, 200);
  }
  return c.text("Verificación fallida", 403);
});

webhookRoutes.post("/meta", async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header("x-hub-signature-256");

  const valid = await verifyMetaSignature(c.env.META_APP_SECRET, rawBody, signature || null);
  if (!valid) {
    return c.text("Firma inválida", 401);
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return c.text("JSON inválido", 400);
  }

  const messages =
    body.object === "instagram" ? parseInstagramWebhook(body) : parseWhatsappWebhook(body);

  for (const msg of messages) {
    try {
      await handleInboundMessage(c.env, msg);
    } catch (err) {
      console.error("Error procesando mensaje entrante", err);
    }
  }

  return c.text("OK", 200);
});
