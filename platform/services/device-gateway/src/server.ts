/**
 * server.ts — device-gateway HTTP surface + forwarding worker (Vol 5).
 * Accepts normalised measurements and Health Connect / Dexcom payloads, maps them to
 * FHIR Observations, enqueues them, and a background loop drains the queue to the
 * backend. Built via tsconfig.full.json (needs fastify/@types/node). Run: `npm run dev`.
 */
import Fastify from "fastify";
import {
  toObservation,
  fromHealthConnect,
  fromDexcomEgv,
  OfflineQueue,
  drainOnce,
  type RawMeasurement,
  type HealthConnectRecord,
  type DexcomEgv,
} from "./core/index.js";
import type { Observation } from "@diabetes-quest/shared";
import { httpDeliver } from "./infra/deliver.js";

const app = Fastify({ logger: true });
const queue = new OfflineQueue<Observation>();

function enqueue(obs: Observation): string {
  const id = obs.identifier![0]!.value;
  queue.enqueue(id, obs); // idempotent (Vol 5)
  return id;
}

app.get("/health", async () => ({ status: "ok", queued: queue.size }));

// Pre-normalised measurement (e.g. from a BLE read in the app).
app.post("/v1/ingest", async (req, reply) => {
  const id = enqueue(toObservation(req.body as RawMeasurement));
  return reply.code(202).send({ id });
});

// Android Health Connect records pushed from the patient app.
app.post("/v1/ingest/health-connect", async (req, reply) => {
  const { patientId, records } = req.body as { patientId: string; records: HealthConnectRecord[] };
  const ids = records.map((r) => enqueue(toObservation(fromHealthConnect(r, patientId))));
  return reply.code(202).send({ accepted: ids.length });
});

// Dexcom vendor-cloud samples (poller/webhook).
app.post("/v1/ingest/dexcom", async (req, reply) => {
  const { patientId, egvs } = req.body as { patientId: string; egvs: DexcomEgv[] };
  const ids = egvs.map((e) => enqueue(toObservation(fromDexcomEgv(e, patientId))));
  return reply.code(202).send({ accepted: ids.length });
});

// Background forwarding loop.
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";
const deliver = httpDeliver(backendUrl, process.env.SERVICE_TOKEN);
const tick = Number(process.env.DRAIN_INTERVAL_MS ?? 5000);
setInterval(() => {
  drainOnce(queue, deliver, Date.now()).catch((err) => app.log.error(err));
}, tick).unref();

const port = Number(process.env.PORT ?? 8082);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
