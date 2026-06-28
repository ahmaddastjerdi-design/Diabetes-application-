/**
 * server.ts — thin Fastify adapter over the domain core (Vol 4).
 *
 * Requires `npm install` (fastify, @types/node). Run with `npm run dev`.
 * This file is intentionally excluded from the typecheck build until deps are
 * installed; the domain logic it calls is fully typechecked via src/core.
 *
 * Auth, persistence, and the FHIR facade are stubbed with in-memory placeholders and
 * clearly marked TODOs that reference their spec section — real implementations land
 * in Phase 1 (see services/backend/README.md and Vol 10).
 */
import Fastify from "fastify";
import type { Observation } from "@diabetes-quest/shared";
import {
  validateObservation,
  idempotencyKey,
  deriveProgress,
  levelFromXp,
  type DomainEvent,
} from "./core/index.js";

const app = Fastify({ logger: true });

// In-memory stand-ins. TODO(Vol 4 §database): replace with Postgres + immutable log.
const observationsByKey = new Map<string, Observation>();
const eventLog: DomainEvent[] = [];

app.get("/health", async () => ({ status: "ok" }));

// TODO(Vol 4 §auth, SEC-): require OAuth2/OIDC bearer token + consent gating here.

app.post("/v1/observations", async (req, reply) => {
  const obs = req.body as Observation;
  const { ok, errors } = validateObservation(obs);
  if (!ok) return reply.code(422).send({ errors });

  const key = idempotencyKey(obs);
  if (!observationsByKey.has(key)) observationsByKey.set(key, obs); // dedup (Vol 4 §sync)
  return reply.code(201).send({ id: key, deduped: observationsByKey.has(key) });
});

app.post("/v1/events", async (req, reply) => {
  // TODO(Vol 8): append-only — never mutate or delete; hash-chain for audit.
  eventLog.push(req.body as DomainEvent);
  const progress = deriveProgress(eventLog);
  return reply.send({ ...progress, level: levelFromXp(progress.xp) });
});

app.get("/v1/progress", async () => {
  const progress = deriveProgress(eventLog);
  return { ...progress, level: levelFromXp(progress.xp) };
});

const port = Number(process.env.PORT ?? 8080);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
