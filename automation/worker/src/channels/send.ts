import type { Channel, Env, OutboundContent } from "../types";
import { sendWhatsappMessage } from "./whatsapp";
import { sendInstagramMessage } from "./instagram";

export async function sendToChannel(
  env: Env,
  channel: Channel,
  externalId: string,
  content: OutboundContent
): Promise<void> {
  if (channel === "whatsapp") {
    await sendWhatsappMessage(env, externalId, content);
  } else {
    await sendInstagramMessage(env, externalId, content);
  }
}
