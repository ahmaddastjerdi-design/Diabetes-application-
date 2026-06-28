/**
 * tools.ts — the tool/function-call surface offered to the model (Vol 6 §architecture).
 * Definitions are data (provider-agnostic JSON schema); the model may request a call and
 * the orchestrator dispatches it to a typed handler. The model never reaches data or
 * side effects except through these audited tools.
 */
export interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>; // JSON Schema
}

export const COACH_TOOLS: readonly ToolDef[] = [
  {
    name: "fetch_recent_observations",
    description: "Fetch the user's recent glucose/marker readings to ground the reply. Read-only.",
    inputSchema: { type: "object", properties: { days: { type: "number" } }, required: [] },
  },
  {
    name: "fetch_lessons",
    description: "Fetch vetted lesson snippets the coach may cite.",
    inputSchema: { type: "object", properties: { topic: { type: "string" } }, required: [] },
  },
  {
    name: "schedule_reminder",
    description: "Schedule a non-clinical reminder (e.g. log a meal, take a walk).",
    inputSchema: {
      type: "object",
      properties: { atMs: { type: "number" }, message: { type: "string" } },
      required: ["atMs", "message"],
    },
  },
  {
    name: "escalate_to_clinician",
    description: "Flag the conversation to the care team. Used by the escalation engine, not for medical advice.",
    inputSchema: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] },
  },
] as const;

export const TOOL_NAMES = COACH_TOOLS.map((t) => t.name);
