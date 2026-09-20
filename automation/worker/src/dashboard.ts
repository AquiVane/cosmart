import { DASHBOARD_CSS } from "./dashboardCss";
import { DASHBOARD_JS } from "./dashboardJs";
import { LOGO_DATA_URI } from "./logoData";

export { DASHBOARD_CSS, DASHBOARD_JS, LOGO_DATA_URI };

export const DASHBOARD_HTML = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MPG · Torre de Control</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bricolage+Grotesque:wght@700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/admin/style.css" />
</head>
<body>
  <div id="app"></div>
  <script src="/admin/app.js"></script>
</body>
</html>`;
