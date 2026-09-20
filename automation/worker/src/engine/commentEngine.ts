import type { Env, InboundComment } from "../types";
import { listActiveCommentRules, getOrCreateContact, touchContact, logMessage, setContactVertical } from "../db";
import { sendInstagramCommentReply, sendInstagramPrivateReply } from "../channels/instagram";
import { getVertical } from "../knowledge/verticals";
import { notifyLeadCapture } from "../integrations/marketingHub";

function matchesRule(rule: { media_id: string | null; keyword: string | null }, comment: InboundComment): boolean {
  if (rule.media_id && rule.media_id !== comment.mediaId) return false;
  if (rule.keyword && !comment.text.toLowerCase().includes(rule.keyword.toLowerCase())) return false;
  return true;
}

/** Comentario -> respuesta pública opcional + DM privado automático (estilo ManyChat). */
export async function handleInboundComment(env: Env, comment: InboundComment): Promise<void> {
  const rules = await listActiveCommentRules(env.DB);
  const rule = rules.find((r) => matchesRule(r, comment));
  if (!rule) return;

  if (rule.public_reply) {
    await sendInstagramCommentReply(env, comment.commentId, rule.public_reply);
  }
  await sendInstagramPrivateReply(env, comment.commentId, rule.dm_message);

  // Registramos el DM como si fuera el inicio de una conversación normal, para que
  // aparezca en Conversaciones y la IA tenga contexto si la persona sigue escribiendo.
  const contact = await getOrCreateContact(env.DB, "instagram", comment.fromId, null);
  await touchContact(env.DB, contact.id);
  await logMessage(env.DB, contact.id, "in", "contact", "[comentó] " + comment.text);
  await logMessage(env.DB, contact.id, "out", "flow", rule.dm_message);

  if (rule.vertical && rule.vertical !== contact.vertical) {
    const wasUntagged = !contact.vertical;
    await setContactVertical(env.DB, contact.id, rule.vertical);
    if (wasUntagged) {
      await notifyLeadCapture({ ...contact, vertical: rule.vertical } as any, getVertical(rule.vertical).label);
    }
  }
}
