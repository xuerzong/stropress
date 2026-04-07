import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { renderOgPng } from "./og";

export const startOgPreviewServer = () => {
  const preferredPort = Number.parseInt(
    process.env.STROPRESS_OG_PREVIEW_PORT || "4322",
    10,
  );

  const server = createServer((request, response) => {
    const host = request.headers.host || `localhost:${preferredPort}`;
    const requestUrl = new URL(request.url || "/", `http://${host}`);

    if (requestUrl.pathname === "/__og/preview.png") {
      const png = renderOgPng({
        title: requestUrl.searchParams.get("title") || "Stropress OG Preview",
        description:
          requestUrl.searchParams.get("description") ||
          "Tune your OG style in real time.",
        siteTitle: requestUrl.searchParams.get("siteTitle") || "Stropress Docs",
        routePath: requestUrl.searchParams.get("route") || "/preview",
      });

      response.statusCode = 200;
      response.setHeader("Content-Type", "image/png");
      response.setHeader("Cache-Control", "no-store");
      response.end(Buffer.from(png));
      return;
    }

    if (requestUrl.pathname === "/__og/preview") {
      const title =
        requestUrl.searchParams.get("title") || "Stropress OG Preview";
      const description =
        requestUrl.searchParams.get("description") ||
        "Tune your OG style in real time.";
      const siteTitle =
        requestUrl.searchParams.get("siteTitle") || "Stropress Docs";
      const route = requestUrl.searchParams.get("route") || "/preview";

      const imageParams = new URLSearchParams({
        title,
        description,
        siteTitle,
        route,
      });

      response.statusCode = 200;
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Stropress OG Preview</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; margin: 0; background: #0b1220; color: #e2e8f0; }
      .wrap { max-width: 1200px; margin: 0 auto; padding: 24px; }
      h1 { margin: 0 0 16px; font-size: 20px; }
      form { display: grid; gap: 12px; margin-bottom: 20px; }
      label { display: grid; gap: 6px; font-size: 13px; color: #94a3b8; }
      input { height: 36px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #e2e8f0; padding: 0 10px; }
      button { height: 38px; border: 0; border-radius: 8px; background: #38bdf8; color: #0f172a; font-weight: 700; cursor: pointer; }
      img { width: 100%; max-width: 1200px; border-radius: 12px; border: 1px solid #334155; background: #020617; display: block; }
      .hint { margin-top: 10px; color: #94a3b8; font-size: 12px; }
      code { background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 2px 6px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>OG Preview</h1>
      <form method="GET" action="/__og/preview">
        <label>title<input name="title" value="${escapeHtml(title)}" /></label>
        <label>description<input name="description" value="${escapeHtml(description)}" /></label>
        <label>siteTitle<input name="siteTitle" value="${escapeHtml(siteTitle)}" /></label>
        <label>route<input name="route" value="${escapeHtml(route)}" /></label>
        <button type="submit">Update Preview</button>
      </form>
      <img src="/__og/preview.png?${imageParams.toString()}" alt="OG Preview" />
      <p class="hint">Direct image endpoint: <code>/__og/preview.png?title=...&description=...&siteTitle=...&route=...</code></p>
    </div>
  </body>
</html>`);
      return;
    }

    response.statusCode = 404;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("Not Found");
  });

  listenOnAvailablePort(server, preferredPort, preferredPort + 20)
    .then((port) => {
      console.log(
        `[stropress] OG preview: http://localhost:${port}/__og/preview`,
      );
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[stropress] Failed to start OG preview server: ${message}`,
      );
    });

  return () => {
    server.close();
  };
};

const listenOnAvailablePort = async (
  server: ReturnType<typeof createServer>,
  port: number,
  maxPort: number,
): Promise<number> => {
  try {
    await new Promise<void>((resolve, reject) => {
      const onError = (error: NodeJS.ErrnoException) => {
        server.off("error", onError);
        reject(error);
      };

      server.once("error", onError);
      server.listen(port, () => {
        server.off("error", onError);
        resolve();
      });
    });

    const address = server.address() as AddressInfo | null;
    return address?.port || port;
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno.code === "EADDRINUSE" && port < maxPort) {
      return listenOnAvailablePort(server, port + 1, maxPort);
    }

    throw error;
  }
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
