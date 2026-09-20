import type { Env } from "../types";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export async function generateAiReply(
  env: Env,
  systemPrompt: string,
  model: string | null,
  history: { direction: "in" | "out"; body: string }[]
): Promise<string> {
  const messages = history.map((m) => ({
    role: m.direction === "in" ? ("user" as const) : ("assistant" as const),
    content: m.body,
  }));

  // Anthropic exige que el primer mensaje sea del usuario.
  while (messages.length && messages[0].role !== "user") messages.shift();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      max_tokens: 500,
      system: systemPrompt,
      messages: messages.length ? messages : [{ role: "user", content: "Hola" }],
    }),
  });

  if (!res.ok) {
    console.error("Error de la API de Anthropic", res.status, await res.text());
    return "Gracias por tu mensaje. En breve te responde alguien del equipo.";
  }

  const data = (await res.json()) as {
    content: { type: string; text?: string }[];
  };

  const text = data.content?.find((c) => c.type === "text")?.text;
  return text?.trim() || "Gracias por tu mensaje. En breve te responde alguien del equipo.";
}
