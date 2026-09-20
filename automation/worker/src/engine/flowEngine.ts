import type { Env, InboundMessage, OutboundContent } from "../types";
import {
  getOrCreateContact,
  touchContact,
  logMessage,
  getRecentMessages,
  setContactFlowState,
  setContactAiEnabled,
  setContactVertical,
  getAllSettings,
  listActiveFlows,
  getFlow,
} from "../db";
import { sendToChannel } from "../channels/send";
import { generateAiReply } from "./ai";
import { getVertical, buildSystemPrompt, DEFAULT_FALLBACK_MESSAGE, DEFAULT_HANDOFF_KEYWORDS } from "../knowledge/verticals";
import { notifyLeadCapture } from "../integrations/marketingHub";

function matchKeyword(text: string, keywords: string[]): boolean {
  const t = text.toLowerCase().trim();
  return keywords.some((k) => k && t.includes(k));
}

async function sendAndLog(
  env: Env,
  channel: InboundMessage["channel"],
  externalId: string,
  contactId: string,
  content: OutboundContent,
  source: "flow" | "ai" | "human"
): Promise<void> {
  await sendToChannel(env, channel, externalId, content);
  const bodyForLog =
    content.buttons.length > 0
      ? `${content.text}\n[opciones: ${content.buttons.map((b) => b.label).join(" | ")}]`
      : content.text;
  await logMessage(env.DB, contactId, "out", source, bodyForLog);
}

/** Si el paso trae `.vertical`, etiqueta la conversación y avisa al CRM la primera vez. */
async function applyStepVertical(
  env: Env,
  contact: { id: string; vertical: string | null; name: string | null; channel: InboundMessage["channel"]; external_id: string },
  stepVertical: string | undefined
): Promise<void> {
  if (!stepVertical || stepVertical === contact.vertical) return;
  const wasUntagged = !contact.vertical;
  await setContactVertical(env.DB, contact.id, stepVertical);
  if (wasUntagged) {
    await notifyLeadCapture(
      { ...contact, vertical: stepVertical } as any,
      getVertical(stepVertical).label
    );
  }
}

export async function handleInboundMessage(env: Env, msg: InboundMessage): Promise<void> {
  const contact = await getOrCreateContact(env.DB, msg.channel, msg.externalId, msg.name);
  await touchContact(env.DB, contact.id);
  await logMessage(env.DB, contact.id, "in", "contact", msg.text);

  if (contact.ai_enabled === 0) {
    // Un humano tomó esta conversación: el bot no contesta hasta que se reactive desde el panel.
    return;
  }

  const settings = await getAllSettings(env.DB);
  const aiEnabled = settings.ai_enabled !== "0"; // por defecto encendida
  const extraInstructions = settings.ai_system_prompt || "";
  const fallback = settings.fallback_message || DEFAULT_FALLBACK_MESSAGE;
  const handoffKeywords = (settings.handoff_keywords || DEFAULT_HANDOFF_KEYWORDS)
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  // Pedido explícito de hablar con una persona: apaga el bot para este contacto.
  if (!msg.buttonPayload && matchKeyword(msg.text, handoffKeywords)) {
    await setContactAiEnabled(env.DB, contact.id, false);
    await sendAndLog(
      env,
      msg.channel,
      msg.externalId,
      contact.id,
      { text: "¡Listo! Ya avisamos al equipo, en breve te responde una persona 🧲🧭", buttons: [] },
      "human"
    );
    return;
  }

  // Convención especial: un botón de flujo con next_step_key = "HANDOFF" deriva a un humano.
  if (msg.buttonPayload === "HANDOFF") {
    await setContactFlowState(env.DB, contact.id, null, null);
    await setContactAiEnabled(env.DB, contact.id, false);
    await sendAndLog(
      env,
      msg.channel,
      msg.externalId,
      contact.id,
      { text: "¡Listo! Ya avisamos al equipo, en breve te responde una persona 🧲🧭", buttons: [] },
      "human"
    );
    return;
  }

  // 1) El contacto tocó un botón/opción de un flujo activo.
  if (msg.buttonPayload && contact.current_flow_id) {
    const flow = await getFlow(env.DB, contact.current_flow_id);
    const step = flow?.steps[msg.buttonPayload];
    if (flow && step) {
      if (step.is_end || step.buttons.length === 0) {
        await setContactFlowState(env.DB, contact.id, null, null);
      } else {
        await setContactFlowState(env.DB, contact.id, flow.id, msg.buttonPayload);
      }
      await applyStepVertical(env, contact, step.vertical);
      await sendAndLog(
        env,
        msg.channel,
        msg.externalId,
        contact.id,
        { text: step.message, buttons: step.buttons },
        "flow"
      );
      return;
    }
    // El flujo o el paso ya no existen (se borró/editó): seguimos como si no hubiera flujo activo.
    await setContactFlowState(env.DB, contact.id, null, null);
  }

  // 2) ¿El texto activa alguno de los flujos por palabra clave?
  const activeFlows = await listActiveFlows(env.DB);
  const triggered = activeFlows.find((f) => matchKeyword(msg.text, f.trigger_keywords));
  if (triggered) {
    const entryStep = triggered.steps[triggered.entry_step_key];
    if (entryStep) {
      await setContactFlowState(
        env.DB,
        contact.id,
        entryStep.is_end ? null : triggered.id,
        entryStep.is_end ? null : triggered.entry_step_key
      );
      await applyStepVertical(env, contact, entryStep.vertical);
      await sendAndLog(
        env,
        msg.channel,
        msg.externalId,
        contact.id,
        { text: entryStep.message, buttons: entryStep.buttons },
        "flow"
      );
      return;
    }
  }

  // 3) Sin flujo que aplique: responde la IA (si está encendida) o el mensaje por defecto.
  if (aiEnabled) {
    const vertical = getVertical(contact.vertical);
    const kbOverride = settings["vertical_kb_" + vertical.id];
    const effectiveVertical = kbOverride ? { ...vertical, knowledge: kbOverride } : vertical;
    const systemPrompt = buildSystemPrompt(effectiveVertical, extraInstructions);

    const history = await getRecentMessages(env.DB, contact.id, 12);
    const reply = await generateAiReply(env, systemPrompt, settings.ai_model || null, history);
    await sendAndLog(env, msg.channel, msg.externalId, contact.id, { text: reply, buttons: [] }, "ai");
  } else {
    await sendAndLog(env, msg.channel, msg.externalId, contact.id, { text: fallback, buttons: [] }, "flow");
  }
}
