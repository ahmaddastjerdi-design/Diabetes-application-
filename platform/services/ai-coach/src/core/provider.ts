/**
 * provider.ts — provider-agnostic model interface + the guardrailed orchestrator (Vol 6).
 *
 * The platform's default model is Claude (claude-* family) via @anthropic-ai/sdk, but
 * the coach depends only on `CoachModelProvider`, so the model is swappable and the
 * safety layer is enforced in code that the model cannot bypass.
 */
import { classifyMessage, isDosingRequest, DOSING_REFUSAL, type EscalationTier } from "./guardrails.js";

export interface CoachContext {
  /** Recent markers/organ trends fetched for grounding (no fabricated numbers, Vol 6). */
  recentSummary?: string;
  /** Vetted lesson snippets the coach may cite. */
  lessons?: string[];
}

export interface CoachRequest {
  userId: string;
  message: string;
  context: CoachContext;
}

export interface CoachReply {
  text: string;
  tier: EscalationTier;
  /** True when a guardrail (not the model) produced the response. */
  guardrailed: boolean;
  ruleId: string | null;
}

/** A model backend (Claude, or a stub for tests). */
export interface CoachModelProvider {
  complete(systemPrompt: string, req: CoachRequest): Promise<string>;
}

export const SYSTEM_PROMPT = [
  "You are the Diabetes Quest Health Coach, a supportive, educational companion.",
  "You NEVER diagnose, NEVER prescribe, and NEVER advise medication or insulin doses.",
  "Ground every statement in the user's provided data and the vetted lessons; if you do",
  "not know, say so and suggest they ask their clinician. Be warm, concise, and never alarmist.",
].join(" ");

/**
 * The orchestrator: guardrails first (deterministic), model only if safe.
 * This is the single choke-point every coach reply passes through (Vol 6 §architecture).
 */
export async function runCoach(provider: CoachModelProvider, req: CoachRequest): Promise<CoachReply> {
  // 1. Red-flag classification ALWAYS wins over the model.
  const cls = classifyMessage(req.message);
  if (cls.tier === "tier3" || cls.tier === "tier2") {
    return { text: cls.mandatedMessage!, tier: cls.tier, guardrailed: true, ruleId: cls.ruleId };
  }
  // 2. Dosing hard block.
  if (isDosingRequest(req.message)) {
    return { text: DOSING_REFUSAL, tier: "none", guardrailed: true, ruleId: "dosing-block" };
  }
  // 3. Safe path: let the model answer within the system policy.
  const text = await provider.complete(SYSTEM_PROMPT, req);
  return { text, tier: cls.tier, guardrailed: false, ruleId: cls.ruleId };
}

/** Deterministic stub provider for tests/local dev (no network, no key). */
export class StubCoachProvider implements CoachModelProvider {
  async complete(_system: string, req: CoachRequest): Promise<string> {
    const grounded = req.context.recentSummary ? ` Based on your recent data: ${req.context.recentSummary}.` : "";
    return `Thanks for sharing.${grounded} Here's a small, evidence-based step you could try, and remember your care team is the right place for medical decisions.`;
  }
}
