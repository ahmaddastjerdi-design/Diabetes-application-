/**
 * server.ts — AI Health Coach HTTP surface (Vol 6). Pipeline per message:
 *   fetch grounding context → guardrailed runCoach → plan + execute escalation → reply.
 * Built via tsconfig.full.json (needs @anthropic-ai/sdk, fastify, @types/node). `npm run dev`.
 */
import Fastify from "fastify";
import Anthropic from "@anthropic-ai/sdk";
import {
  runCoach,
  buildGroundingContext,
  planEscalation,
  escalate,
  type CoachModelProvider,
  type CoachRequest,
  type ContextProvider,
  type CareTeamNotifier,
} from "./core/index.js";
import { backendContextProvider } from "./infra/context.js";
import { backendNotifier } from "./infra/notify.js";

/** Real provider backed by Claude (the platform default model). */
class ClaudeProvider implements CoachModelProvider {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  async complete(system: string, req: CoachRequest): Promise<string> {
    const grounding = req.context.recentSummary ? `\n\nUser's recent data: ${req.context.recentSummary}` : "";
    const res = await this.client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: system + grounding,
      messages: [{ role: "user", content: req.message }],
    });
    const block = res.content[0];
    return block && block.type === "text" ? block.text : "";
  }
}

const app = Fastify({ logger: true });
const provider: CoachModelProvider = new ClaudeProvider();

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";
const serviceToken = process.env.SERVICE_TOKEN ?? "";
const context: ContextProvider = backendContextProvider(backendUrl, serviceToken);
const notifier: CareTeamNotifier = backendNotifier(backendUrl, serviceToken);

app.get("/health", async () => ({ status: "ok" }));

app.post("/v1/coach/message", async (req, reply) => {
  const body = req.body as { userId: string; message: string };

  // 1. Ground the coach in the user's own data (empty on failure → defers to clinician).
  const grounding = await context.fetch(body.userId);
  const coachCtx = buildGroundingContext(grounding);

  // 2. Guardrailed orchestration (red-flags + dosing block win before the model).
  const result = await runCoach(provider, { userId: body.userId, message: body.message, context: coachCtx });

  // 3. Drive escalation; notify the care team for tier2/tier3.
  const action = planEscalation(result.tier);
  await escalate(notifier, body.userId, action).catch((err) => app.log.error(err));

  return reply.send({ ...result, escalation: action });
});

const port = Number(process.env.PORT ?? 8081);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
