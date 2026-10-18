import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { validate } from "@dtc/design-rules";
import { EXPORT_DIR, newExportId, saveExport, type DesignExport } from "./store";

const MAX_BODY = 5 * 1024 * 1024;
const HOST = "127.0.0.1";

// stdout carries the MCP protocol — every log line goes to stderr.
const log = (msg: string) => process.stderr.write(`[dtc-bridge] ${msg}\n`);

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/**
 * Figma plug-in UIs run in a sandboxed iframe whose Origin is the literal
 * string "null". Only that origin (and same-machine tools like curl, which
 * send no Origin) may talk to the bridge — never arbitrary web pages.
 */
function corsHeaders(req: IncomingMessage): Record<string, string> {
  if (req.headers.origin !== "null") return {};
  return {
    "Access-Control-Allow-Origin": "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-DTC-Token",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

function send(req: IncomingMessage, res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json", ...corsHeaders(req) });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new HttpError(413, "Payload exceeds 5MB"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function parseExport(raw: string): DesignExport {
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Body must be JSON");
  }
  const b = body as Partial<DesignExport>;
  if (!b || typeof b !== "object" || !Array.isArray(b.nodes) || b.nodes.length === 0) {
    throw new HttpError(400, "Expected { fileName, page, exportedAt, nodes: DesignNode[], validation, screenshot? }");
  }
  if (b.screenshot !== undefined && typeof b.screenshot !== "string") {
    throw new HttpError(400, "screenshot must be a base64 PNG string");
  }
  return {
    fileName: String(b.fileName ?? "Untitled"),
    page: String(b.page ?? ""),
    exportedAt: String(b.exportedAt ?? new Date().toISOString()),
    nodes: b.nodes,
    validation: b.validation as DesignExport["validation"],
    screenshot: b.screenshot,
  };
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin;
  if (origin !== undefined && origin !== "null") {
    throw new HttpError(403, "Origin not allowed");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(req));
    res.end();
    return;
  }

  const path = (req.url ?? "/").split("?")[0];
  if (req.method === "GET" && path === "/health") {
    send(req, res, 200, { ok: true, exportDir: EXPORT_DIR });
    return;
  }
  if (req.method === "POST" && path === "/exports") {
    const token = process.env.DTC_BRIDGE_TOKEN;
    if (token && req.headers["x-dtc-token"] !== token) throw new HttpError(401, "Invalid or missing X-DTC-Token");

    const exp = parseExport(await readBody(req));
    // Never trust the client's verdict: re-run the shared rules server-side.
    const validation = validate(exp.nodes);
    if (validation.summary.errors > 0) {
      log(`rejected export from "${exp.fileName}" — ${validation.summary.errors} error(s)`);
      send(req, res, 422, { error: "Design failed validation", summary: validation.summary, issues: validation.issues });
      return;
    }
    const id = newExportId();
    saveExport({ ...exp, validation, id, receivedAt: new Date().toISOString() });
    log(`stored export ${id} (${exp.fileName} / ${exp.page})`);
    send(req, res, 201, { id, summary: validation.summary });
    return;
  }
  throw new HttpError(404, "Not found");
}

export function startBridge(): void {
  const port = Number(process.env.DTC_BRIDGE_PORT ?? 4848);
  const server = createServer((req, res) => {
    handle(req, res).catch((err: unknown) => {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) log(`error: ${(err as Error)?.stack ?? err}`);
      if (!res.headersSent) send(req, res, status, { error: (err as Error)?.message ?? "Internal error" });
    });
  });
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      log(`port ${port} in use — another instance owns the bridge; serving exports read-only from ${EXPORT_DIR}`);
    } else {
      log(`bridge disabled: ${err.message}`);
    }
  });
  server.listen(port, HOST, () => log(`listening on http://${HOST}:${port} (exports → ${EXPORT_DIR})`));
}
