import type { Env, InboundComment, InboundMessage, OutboundContent } from "../types";

const GRAPH_VERSION = "v21.0";

/** Convierte el payload crudo del webhook de Instagram Messaging en nuestro formato interno. */
export function parseInstagramWebhook(body: any): InboundMessage[] {
  const out: InboundMessage[] = [];
  const entries = body?.entry || [];

  for (const entry of entries) {
    for (const event of entry.messaging || []) {
      // Ignoramos eco de nuestros propios mensajes salientes y "read" receipts
      if (event.message?.is_echo) continue;
      const senderId = event.sender?.id;
      if (!senderId || !event.message) continue;

      const quickReplyPayload = event.message.quick_reply?.payload || null;
      const text = event.message.text || "";

      out.push({
        channel: "instagram",
        externalId: senderId,
        name: null,
        text,
        buttonPayload: quickReplyPayload,
      });
    }
  }

  return out;
}

/**
 * Los comentarios en publicaciones/reels de Instagram llegan en `entry[].changes[]`
 * con field "comments" (a diferencia de los DM, que llegan en `entry[].messaging[]`).
 */
export function parseInstagramCommentWebhook(body: any): InboundComment[] {
  const out: InboundComment[] = [];
  const entries = body?.entry || [];

  for (const entry of entries) {
    for (const change of entry.changes || []) {
      if (change.field !== "comments") continue;
      const value = change.value;
      if (!value?.id || !value?.from?.id) continue;
      out.push({
        commentId: value.id,
        mediaId: value.media?.id || "",
        text: value.text || "",
        fromId: value.from.id,
      });
    }
  }

  return out;
}

/** Respuesta pública debajo del comentario original. */
export async function sendInstagramCommentReply(env: Env, commentId: string, text: string): Promise<void> {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${commentId}/replies?access_token=${encodeURIComponent(
    env.IG_PAGE_ACCESS_TOKEN
  )}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  });
  if (!res.ok) console.error("Error respondiendo comentario de Instagram", res.status, await res.text());
}

/**
 * DM privado a partir de un comentario (Private Replies API de Meta). Solo funciona
 * dentro de los 7 días de hecho el comentario, y una sola vez por comentario.
 */
export async function sendInstagramPrivateReply(env: Env, commentId: string, text: string): Promise<void> {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${commentId}/private_replies?access_token=${encodeURIComponent(
    env.IG_PAGE_ACCESS_TOKEN
  )}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  });
  if (!res.ok) console.error("Error mandando DM privado por comentario", res.status, await res.text());
}

export async function sendInstagramMessage(
  env: Env,
  recipientId: string,
  content: OutboundContent
): Promise<void> {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/me/messages?access_token=${encodeURIComponent(
    env.IG_PAGE_ACCESS_TOKEN
  )}`;

  // Instagram no tiene "listas": si hay más de 13 opciones (límite de quick replies),
  // las mandamos como texto numerado dentro del mismo mensaje.
  const buttons = content.buttons.slice(0, 13);
  let text = content.text;
  let quickReplies: unknown[] | undefined;

  if (content.buttons.length > 13) {
    text +=
      "\n\n" +
      content.buttons.map((b, i) => `${i + 1}. ${b.label}`).join("\n") +
      "\n\nRespondé con el número de la opción.";
  } else if (buttons.length > 0) {
    quickReplies = buttons.map((b, i) => ({
      content_type: "text",
      title: b.label.slice(0, 20),
      payload: b.next_step_key || `end_${i}`,
    }));
  }

  const payload: Record<string, unknown> = {
    recipient: { id: recipientId },
    message: quickReplies ? { text, quick_replies: quickReplies } : { text },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error("Error enviando mensaje de Instagram", res.status, await res.text());
  }
}
