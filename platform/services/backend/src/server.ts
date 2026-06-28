/**
 * server.ts — HTTP surface for the backend (Vol 4). Thin Fastify adapter over the
 * application service; authorization + audit live in the core and cannot be bypassed.
 * Built via tsconfig.full.json (needs fastify/pg/jose/@types/node). Run: `npm run dev`.
 */
import Fastify from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import {
  validateObservation,
  PatientDataService,
  AccessDeniedError,
  type Actor,
  type Role,
  type DomainEvent,
} from "./core/index.js";
import type { Observation } from "@diabetes-quest/shared";
import { PgConsentRepo, PgEventRepo, PgAuditRepo, PgObservationRepo, PgEscalationRepo } from "./infra/repositories.pg.js";
import { pool } from "./infra/db.js";
import { makeVerifier, AuthError } from "./infra/auth.js";
import { nodeAead, keyRingFromEnv } from "./infra/crypto.js";
import { securityHeaders } from "@diabetes-quest/security";

// Encrypt PHI (observations) at rest when keys are configured (Vol 8).
const fieldEncryption = process.env.ENCRYPTION_KEYS ? { ring: keyRingFromEnv(), aead: nodeAead() } : undefined;

const svc = new PatientDataService({
  consents: new PgConsentRepo(),
  events: new PgEventRepo(),
  audit: new PgAuditRepo(),
  observations: new PgObservationRepo(fieldEncryption),
  escalations: new PgEscalationRepo(),
});

const app = Fastify({ logger: true });

// ---- Baseline security headers on every response (Vol 8 / OWASP) ----
const SEC_HEADERS = securityHeaders();
app.addHook("onSend", async (_req, reply, payload) => {
  for (const [k, v] of Object.entries(SEC_HEADERS)) reply.header(k, v);
  return payload;
});

// ---- Authentication ----
const oidcConfigured = process.env.OIDC_ISSUER && process.env.OIDC_JWKS_URI && process.env.API_AUDIENCE;
const verify = oidcConfigured
  ? makeVerifier({
      issuer: process.env.OIDC_ISSUER!,
      audience: process.env.API_AUDIENCE!,
      jwksUri: process.env.OIDC_JWKS_URI!,
    })
  : null;

function getActor(req: FastifyRequest): Actor {
  const actor = (req as FastifyRequest & { actor?: Actor }).actor;
  if (!actor) throw new AuthError("unauthenticated");
  return actor;
}

app.addHook("preHandler", async (req, reply) => {
  if (req.url === "/health") return;
  const auth = req.headers.authorization;
  try {
    if (verify) {
      if (!auth?.startsWith("Bearer ")) throw new AuthError("missing bearer token");
      const claims = await verify(auth.slice(7), Math.floor(Date.now() / 1000));
      (req as FastifyRequest & { actor?: Actor }).actor = { id: claims.sub, role: claims.role };
    } else {
      // DEV ONLY: no IdP configured. Trust x-user-* headers. NEVER enable in production.
      app.log.warn("OIDC not configured — using insecure dev auth headers");
      (req as FastifyRequest & { actor?: Actor }).actor = {
        id: String(req.headers["x-user-id"] ?? ""),
        role: (req.headers["x-user-role"] as Role) ?? "patient",
      };
    }
  } catch (err) {
    return reply.code(401).send({ error: err instanceof Error ? err.message : "unauthorized" });
  }
});

function onError(err: unknown, reply: FastifyReply) {
  if (err instanceof AccessDeniedError) return reply.code(403).send({ error: err.reason });
  reply.code(500).send({ error: "internal error" });
}

// ---- Routes ----
app.get("/health", async () => ({ status: "ok" }));

// First-party ingest from the device-gateway (service token). Persists + audits.
app.post("/v1/observations", async (req, reply) => {
  const obs = req.body as Observation;
  const { ok, errors } = validateObservation(obs);
  if (!ok) return reply.code(422).send({ errors });
  const patientId = obs.subject.reference.replace(/^Patient\//, "");
  const result = await svc.ingestObservation(patientId, obs, Date.now());
  return reply.code(201).send(result);
});

// Consent-gated read of a patient's observation timeline (clinician panel / coach).
app.get("/v1/patients/:id/observations", async (req, reply) => {
  const patientId = (req.params as { id: string }).id;
  try {
    return reply.send(await svc.listObservations(getActor(req), patientId, Date.now()));
  } catch (err) {
    return onError(err, reply);
  }
});

// Grounding context for the AI coach (consent-gated + audited).
app.get("/v1/patients/:id/coach-context", async (req, reply) => {
  const patientId = (req.params as { id: string }).id;
  try {
    return reply.send(await svc.getCoachContext(getActor(req), patientId, Date.now()));
  } catch (err) {
    return onError(err, reply);
  }
});

// Care-team escalation recorded by the AI coach.
app.post("/v1/escalations", async (req, reply) => {
  const body = req.body as { userId: string; tier: string; audience: string; notifyCareTeam: boolean; instruction: string };
  try {
    const result = await svc.recordEscalation(getActor(req), body.userId, body, Date.now());
    return reply.send(result);
  } catch (err) {
    return onError(err, reply);
  }
});

app.post("/v1/patients/:id/events", async (req, reply) => {
  const patientId = (req.params as { id: string }).id;
  const batch = (req.body as { id: string; event: DomainEvent }[]) ?? [];
  try {
    const result = await svc.syncEvents(getActor(req), patientId, batch, Date.now());
    return reply.send(result);
  } catch (err) {
    return onError(err, reply);
  }
});

app.get("/v1/patients/:id/progress", async (req, reply) => {
  const patientId = (req.params as { id: string }).id;
  try {
    return reply.send(await svc.getProgress(getActor(req), patientId, Date.now()));
  } catch (err) {
    return onError(err, reply);
  }
});

const port = Number(process.env.PORT ?? 8080);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  pool.end();
  process.exit(1);
});
