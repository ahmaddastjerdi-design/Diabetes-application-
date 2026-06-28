/**
 * forward.integration.test.mjs — the worker forwarding to a REAL HTTP server (Vol 9, Vol 5).
 * Uses Node's built-in http server + global fetch (no deps), so it runs locally and in CI.
 * Proves the end-to-end drain → POST /v1/observations → ack path, mirroring the real
 * `httpDeliver` in src/infra/deliver.ts.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { OfflineQueue, drainOnce, toObservation, fromDexcomEgv } from "../dist/index.js";

let server;
let baseUrl;
const received = [];

before(async () => {
  server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (req.method === "POST" && req.url === "/v1/observations") {
        received.push(JSON.parse(body));
        res.writeHead(201, { "content-type": "application/json" });
        res.end(JSON.stringify({ id: "ok" }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

// Mirrors src/infra/deliver.ts httpDeliver.
const httpDeliver = (url) => async (obs) => {
  const res = await fetch(`${url}/v1/observations`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(obs),
  });
  return { ok: res.ok };
};

test("queued observations are forwarded to the backend and acked", async () => {
  const q = new OfflineQueue();
  const obs = toObservation(fromDexcomEgv({ systemTime: "2026-06-01T08:00:00Z", value: 126, transmitterId: "TX1" }, "p1"));
  q.enqueue(obs.identifier[0].value, obs);

  const summary = await drainOnce(q, httpDeliver(baseUrl), Date.now());
  assert.equal(summary.delivered, 1);
  assert.equal(q.size, 0);
  assert.equal(received.length, 1);
  assert.equal(received[0].resourceType, "Observation");
  assert.equal(received[0].subject.reference, "Patient/p1");
  assert.equal(received[0].valueQuantity.unit, "mg/dL");
});
