import type { Env, InboundMessage, OutboundContent } from "../types";

const GRAPH_VERSION = "v21.0";

/** Convierte el payload crudo del webhook de WhatsApp Cloud API en nuestro formato interno. */
export function parseWhatsappWebhook(body: any): InboundMessage[] {
  const out: InboundMessage[] = [];
  const entries = body?.entry || [];

  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (!value?.messages) continue;

      const contactsByWaId = new Map<string, string>();
      for (const c of value.contacts || []) {
        contactsByWaId.set(c.wa_id, c.profile?.name || null);
      }

      for (const msg of value.messages) {
        const from = msg.from as string;
        const name = contactsByWaId.get(from) || null;

        if (msg.type === "text") {
          out.push({ channel: "whatsapp", externalId: from, name, text: msg.text?.body || "", buttonPayload: null });
        } else if (msg.type === "interactive") {
          const reply = msg.interactive?.button_reply || msg.interactive?.list_reply;
          if (reply) {
            out.push({
              channel: "whatsapp",
              externalId: from,
              name,
              text: reply.title || "",
              buttonPayload: reply.id || null,
            });
          }
        } else if (msg.type === "button") {
          out.push({
            channel: "whatsapp",
            externalId: from,
            name,
            text: msg.button?.text || "",
            buttonPayload: msg.button?.payload || null,
          });
        }
      }
    }
  }

  return out;
}

export async function sendWhatsappMessage(
  env: Env,
  to: string,
  content: OutboundContent
): Promise<void> {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const headers = {
    Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
    "Content-Type": "application/json",
  };

  const buttons = content.buttons.slice(0, 10);

  let payload: Record<string, unknown>;

  if (buttons.length === 0) {
    payload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: content.text },
    };
  } else if (buttons.length <= 3) {
    payload = {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: content.text },
        action: {
          buttons: buttons.map((b, i) => ({
            type: "reply",
            reply: { id: b.next_step_key || `end_${i}`, title: b.label.slice(0, 20) },
          })),
        },
      },
    };
  } else {
    payload = {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: content.text },
        action: {
          button: "Ver opciones",
          sections: [
            {
              title: "Opciones",
              rows: buttons.map((b, i) => ({
                id: b.next_step_key || `end_${i}`,
                title: b.label.slice(0, 24),
              })),
            },
          ],
        },
      },
    };
  }

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!res.ok) {
    console.error("Error enviando mensaje de WhatsApp", res.status, await res.text());
  }
}
