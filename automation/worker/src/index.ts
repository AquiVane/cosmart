import { Hono } from "hono";
import type { Env } from "./types";
import { webhookRoutes } from "./routes/webhook";
import { adminRoutes } from "./routes/admin";
import { DASHBOARD_HTML, DASHBOARD_JS, DASHBOARD_CSS, LOGO_DATA_URI } from "./dashboard";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.redirect("/admin"));

app.route("/webhook", webhookRoutes);
app.route("/admin/api", adminRoutes);

app.get("/admin/app.js", (c) => c.text(DASHBOARD_JS, 200, { "content-type": "application/javascript" }));
app.get("/admin/style.css", (c) => c.text(DASHBOARD_CSS, 200, { "content-type": "text/css" }));

app.get("/admin/logo.png", (c) => {
  const base64 = LOGO_DATA_URI.split(",")[1];
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return c.body(bytes, 200, { "content-type": "image/png", "cache-control": "public, max-age=86400" });
});

// Cualquier otra ruta bajo /admin sirve la SPA (login + panel).
app.get("/admin/*", (c) => c.html(DASHBOARD_HTML));
app.get("/admin", (c) => c.html(DASHBOARD_HTML));

export default app;
