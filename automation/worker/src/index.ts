import { Hono } from "hono";
import type { Env } from "./types";
import { webhookRoutes } from "./routes/webhook";
import { adminRoutes } from "./routes/admin";
import { DASHBOARD_HTML, DASHBOARD_JS, DASHBOARD_CSS } from "./dashboard";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.redirect("/admin"));

app.route("/webhook", webhookRoutes);
app.route("/admin/api", adminRoutes);

app.get("/admin/app.js", (c) => c.text(DASHBOARD_JS, 200, { "content-type": "application/javascript" }));
app.get("/admin/style.css", (c) => c.text(DASHBOARD_CSS, 200, { "content-type": "text/css" }));

// Cualquier otra ruta bajo /admin sirve la SPA (login + panel).
app.get("/admin/*", (c) => c.html(DASHBOARD_HTML));
app.get("/admin", (c) => c.html(DASHBOARD_HTML));

export default app;
