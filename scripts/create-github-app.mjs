// One-click creation of the ShipLog GitHub App via GitHub's manifest flow.
// Usage: node scripts/create-github-app.mjs [https://your-app.vercel.app]
// Opens a local page with a pre-filled "Create GitHub App" button. After you confirm on GitHub,
// the App's id, slug, client id/secret and private key are written to .env.local (never printed).
import { appendFileSync } from "node:fs";
import { createServer } from "node:http";

const PORT = 3999;
const site = (process.argv[2] ?? "https://shiplog-voice.vercel.app").replace(/\/$/, "");
const local = `http://localhost:${PORT}`;

const manifest = {
  name: "ShipLog Voice Journal",
  url: site,
  description: "Read-only access to your commits and pull requests so ShipLog can cross-check your daily work log.",
  public: true, // so a work account or organization can install it too
  redirect_url: `${local}/created`,
  callback_urls: [`${site}/api/github/callback`, "http://localhost:3100/api/github/callback"],
  setup_url: `${site}/api/github/callback`,
  setup_on_update: true,
  request_oauth_on_install: true,
  hook_attributes: { url: `${site}/api/github/webhook`, active: false },
  default_permissions: { contents: "read", metadata: "read", pull_requests: "read" },
  default_events: [],
};

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const page = (body) =>
  `<!doctype html><meta charset="utf-8"><title>Create ShipLog GitHub App</title>
  <body style="font-family:system-ui;max-width:560px;margin:4rem auto;padding:0 1rem;line-height:1.5">${body}</body>`;

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", local);
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (url.pathname === "/") {
    res.end(
      page(`<h1>Create the ShipLog GitHub App</h1>
      <p>Permissions: <b>read-only</b> contents, metadata and pull requests. No write access.</p>
      <form action="https://github.com/settings/apps/new" method="post">
        <input type="hidden" name="manifest" value="${escapeHtml(JSON.stringify(manifest))}">
        <button style="font-size:1rem;padding:.6rem 1.2rem;border-radius:6px;background:#171717;color:#fff;border:0;cursor:pointer">
          Create GitHub App on GitHub →</button>
      </form>
      <p style="color:#666">To create it under an organization instead, change the form action to
      https://github.com/organizations/ORG/settings/apps/new.</p>`),
    );
    return;
  }

  if (url.pathname === "/created") {
    const code = url.searchParams.get("code");
    if (!code || !/^[\w-]+$/.test(code)) {
      res.statusCode = 400;
      res.end(page("<p>Missing code.</p>"));
      return;
    }
    const gh = await fetch(`https://api.github.com/app-manifests/${code}/conversions`, {
      method: "POST",
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!gh.ok) {
      res.statusCode = 502;
      res.end(page(`<p>GitHub returned ${gh.status}. Try again.</p>`));
      return;
    }
    const app = await gh.json();
    appendFileSync(
      ".env.local",
      [
        "",
        "# ShipLog GitHub App (created by scripts/create-github-app.mjs)",
        `GITHUB_APP_ID=${app.id}`,
        `GITHUB_APP_SLUG=${app.slug}`,
        `GITHUB_APP_CLIENT_ID=${app.client_id}`,
        `GITHUB_APP_CLIENT_SECRET=${app.client_secret}`,
        `GITHUB_APP_PRIVATE_KEY=${app.pem.trim().replaceAll("\n", "\\n")}`,
        "",
      ].join("\n"),
    );
    res.end(
      page(`<h1>✅ App created: ${escapeHtml(app.slug)}</h1>
      <p>Secrets were saved to <code>.env.local</code>. You can close this tab.</p>`),
    );
    console.log(`GitHub App "${app.slug}" created; credentials written to .env.local`);
    setTimeout(() => process.exit(0), 500);
    return;
  }

  res.statusCode = 404;
  res.end(page("<p>Not found.</p>"));
});

server.listen(PORT, "127.0.0.1", () => console.log(`Open ${local} to create the ShipLog GitHub App`));
