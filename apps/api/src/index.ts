import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { jobsTable } from "@aimediaos/db";
import { effects } from "@aimediaos/workflows";
import type { MediaJob } from "@aimediaos/shared";

const PORT = Number(process.env.PORT ?? 4000);

function sendJson(res: import("node:http").ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body));
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (url.pathname === "/health") {
    sendJson(res, 200, { status: "ok", service: "@aimediaos/api" });
    return;
  }

  if (url.pathname === "/effects") {
    sendJson(res, 200, { effects });
    return;
  }

  if (url.pathname === "/jobs" && req.method === "GET") {
    sendJson(res, 200, { jobs: jobsTable.list() });
    return;
  }

  if (url.pathname === "/jobs" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const parsed = JSON.parse(body || "{}");
      const now = new Date().toISOString();
      const job: MediaJob = {
        id: randomUUID(),
        kind: parsed.kind ?? "image",
        status: "queued",
        effectId: parsed.effectId ?? "",
        sourceUrl: parsed.sourceUrl ?? "",
        createdAt: now,
        updatedAt: now,
      };
      sendJson(res, 201, jobsTable.insert(job));
    });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`@aimediaos/api listening on http://localhost:${PORT}`);
});
