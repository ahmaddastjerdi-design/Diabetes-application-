/**
 * server.ts — thin Fastify adapter wiring the real Claude provider to the coach core.
 * Requires `npm install` + ANTHROPIC_API_KEY. Run with `npm run dev`.
 * Excluded from the typecheck build until deps are installed; the guardrail/orchestrator
 * logic it calls is fully typechecked via src/core.
 */
import Fastify from "fastify";
import Anthropic from "@anthropic-ai/sdk";
import { runCoach, type CoachModelProvider, type CoachRequest } from "./core/index.js";

/** Real provider backed by Claude (the platform default model). */
class ClaudeProvider implements CoachModelProvider {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  async complete(system: string, req: CoachRequest): Promise<string> {
    const res = await this.client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: req.message }],
    });
    const block = res.content[0];
    return block && block.type === "text" ? block.text : "";
  }
}

const app = Fastify({ logger: true });
const provider = new ClaudeProvider();

app.get("/health", async () => ({ status: "ok" }));

app.post("/v1/coach/message", async (req, reply) => {
  const body = req.body as CoachRequest;
  // TODO(Vol 6): fetch grounding context (recent observations, lessons) via backend.
  const result = await runCoach(provider, body);
  // TODO(Vol 6): on tier2/tier3, notify the care team and log the escalation.
  return reply.send(result);
});

const port = Number(process.env.PORT ?? 8081);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
