export interface Env {
  DB: D1Database;

  // Panel de administración
  ADMIN_TOKEN: string;

  // Meta (WhatsApp Cloud API + Instagram Messaging), una sola app de Meta
  META_VERIFY_TOKEN: string; // el mismo valor que configurás en el webhook de Meta
  META_APP_SECRET: string; // para verificar la firma X-Hub-Signature-256

  WHATSAPP_TOKEN: string; // token permanente del usuario del sistema
  WHATSAPP_PHONE_NUMBER_ID: string;

  IG_PAGE_ACCESS_TOKEN: string; // token de la página de Facebook conectada al Instagram profesional

  // IA
  ANTHROPIC_API_KEY: string;
}

export type Channel = "whatsapp" | "instagram";

export interface ButtonOption {
  label: string;
  /** step_key al que salta el flujo si tocan este botón, o null si es el fin del flujo */
  next_step_key: string | null;
}

export interface FlowStep {
  message: string;
  buttons: ButtonOption[];
  is_end: boolean;
}

export interface FlowDefinition {
  id: string;
  name: string;
  trigger_keywords: string[];
  active: boolean;
  entry_step_key: string;
  steps: Record<string, FlowStep>;
}

export interface Contact {
  id: string;
  channel: Channel;
  external_id: string;
  name: string | null;
  ai_enabled: number;
  current_flow_id: string | null;
  current_step_key: string | null;
  created_at: string;
  last_message_at: string | null;
}

export interface InboundMessage {
  channel: Channel;
  externalId: string;
  name: string | null;
  /** texto libre escrito por el contacto, o el título del botón tocado */
  text: string;
  /** si tocó un botón/lista, el id que le pusimos (normalmente el next_step_key) */
  buttonPayload: string | null;
}

export interface OutboundContent {
  text: string;
  buttons: ButtonOption[];
}
