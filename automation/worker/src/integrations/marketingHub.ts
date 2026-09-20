import type { Contact } from "../types";

/**
 * El CRM de leads vive en el worker `marketing-hub` (repo AquiVane/cosmart-workers),
 * compartido por todo el ecosistema COSMART. Su endpoint /leads/captura es público
 * y sin auth a propósito: "cualquier sitio/worker de cualquier vertical le pega"
 * (Brújula, Training, Design, Shows, ComuniCOS...) — este bot hace lo mismo.
 * Fire-and-forget: si falla, nunca rompe la conversación del contacto.
 */
const LEADS_ENDPOINT = "https://marketing-hub.conglomeradocosmart.workers.dev/leads/captura";

export async function notifyLeadCapture(
  contact: Contact,
  verticalLabel: string
): Promise<void> {
  try {
    const payload: Record<string, unknown> = {
      nombre: contact.name || undefined,
      vertical: verticalLabel,
      origen: contact.channel === "whatsapp" ? "whatsapp-bot" : "instagram-bot",
    };
    if (contact.channel === "whatsapp") payload.telefono = contact.external_id;
    // El CRM exige email o teléfono para no descartar el lead en silencio (204). Instagram
    // solo nos da un PSID, no un teléfono real, así que un lead de Instagram sin que la
    // persona haya dejado su mail/teléfono en la charla no cae ahí — es una limitación de
    // datos, no un bug: falta sumar captura de contacto en la conversación para cerrar esto.
    if (!payload.telefono && !payload.email) return;

    await fetch(LEADS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("No se pudo avisar al CRM de Marketing Hub (no bloquea la conversación)", err);
  }
}
