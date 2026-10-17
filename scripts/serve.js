/**
 * A tiny, zero-dependency static file server for the curly-doodle web
 * template. ES modules must be served over HTTP, so open the app at
 * `http://127.0.0.1:4173/web/` rather than via `file://`.
 *
 * Usage:
 *   node scripts/serve.js            # http://127.0.0.1:4173/web/
 *   PORT=8080 node scripts/serve.js
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

/**
 * Resolve a URL pathname to an absolute file path inside `rootDir`, or `null`
 * if the request is malformed or tries to escape the root.
 * @param {string} rootDir
 * @param {string} pathname
 * @returns {string | null}
 */
function resolveSafePath(rootDir, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null; // Malformed percent-encoding.
  }

  if (decoded.includes("\0")) {
    return null;
  }

  // Reject any explicit parent-directory traversal, even though `resolve`
  // would collapse it, so escapes are reported rather than silently masked.
  const segments = decoded.split(/[\\/]+/);
  if (segments.includes("..")) {
    return null;
  }

  const relative = decoded.replace(/^[/\\]+/, "");
  const candidate = resolve(rootDir, relative);

  // Defence in depth: the resolved path must stay inside the served root.
  if (candidate !== rootDir && !candidate.startsWith(rootDir + sep)) {
    return null;
  }
  return candidate;
}

/**
 * Create an HTTP server that serves static files from `root`.
 * @param {string} [root] Directory to serve from. Defaults to the repo root.
 * @returns {import("node:http").Server}
 */
export function createStaticServer(root = process.cwd()) {
  const rootDir = resolve(root);

  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      let pathname = url.pathname;
      if (pathname.endsWith("/")) {
        pathname += "index.html";
      }

      const filePath = resolveSafePath(rootDir, pathname);
      if (filePath === null) {
        response.writeHead(403, { "content-type": MIME_TYPES[".txt"] });
        response.end("Forbidden");
        return;
      }

      const info = await stat(filePath).catch(() => null);
      if (!info || !info.isFile()) {
        response.writeHead(404, { "content-type": MIME_TYPES[".txt"] });
        response.end("Not found");
        return;
      }

      const body = await readFile(filePath);
      response.writeHead(200, {
        "content-type": MIME_TYPES[extname(filePath)] ?? "application/octet-stream",
        "cache-control": "no-cache",
      });
      response.end(body);
    } catch {
      response.writeHead(500, { "content-type": MIME_TYPES[".txt"] });
      response.end("Internal server error");
    }
  });
}

/**
 * Start the server on an ephemeral or explicit port.
 * @param {{ root?: string, port?: number, host?: string }} [options]
 * @returns {Promise<{ server: import("node:http").Server, host: string, port: number, url: string }>}
 */
export function startServer({ root = process.cwd(), port = 0, host = "127.0.0.1" } = {}) {
  const server = createStaticServer(root);
  return new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = /** @type {import("node:net").AddressInfo} */ (server.address());
      resolvePromise({
        server,
        host,
        port: address.port,
        url: `http://${host}:${address.port}`,
      });
    });
  });
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const port = Number(process.env.PORT ?? 4173);
  const root = fileURLToPath(new URL("..", import.meta.url));
  startServer({ root, port })
    .then(({ url }) => {
      console.log(`curly-doodle web template → ${url}/web/`);
    })
    .catch((error) => {
      console.error("Failed to start server:", error);
      process.exitCode = 1;
    });
}
