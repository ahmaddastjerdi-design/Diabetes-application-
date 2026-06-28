/**
 * server.ts — thin Fastify adapter: accepts raw measurements, maps them to FHIR
 * Observations, and forwards to the backend. Requires `npm install`; run `npm run dev`.
 * Excluded from the typecheck build until deps are installed; the mapping/queue logic
 * it calls is fully typechecked via src/core.
 */
import Fastify from "fastify";
import { toObservation, OfflineQueue, type RawMeasurement } from "./core/index.js";
import type { Observation } from "@diabetes-quest/shared";

const app = Fastify({ logger: true });
const queue = new OfflineQueue<Observation>();

app.get("/health", async () => ({ status: "ok", queued: queue.size }));

app.post("/v1/ingest", async (req, reply) => {
  const raw = req.body as RawMeasurement;
  const obs = toObservation(raw);
  const id = obs.identifier![0]!.value;
  const accepted = queue.enqueue(id, obs); // idempotent (Vol 5)
  // TODO(Vol 5): a worker drains queue.due(now) and POSTs to backend /v1/observations,
  //   calling queue.ack on 201 and queue.fail on error (exponential backoff built in).
  return reply.code(202).send({ id, accepted });
});

const port = Number(process.env.PORT ?? 8082);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
