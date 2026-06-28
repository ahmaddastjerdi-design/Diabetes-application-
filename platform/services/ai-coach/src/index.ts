/**
 * @diabetes-quest/ai-coach — public entry. Re-exports the guardrailed coach core and the
 * safety-eval harness. The HTTP server (and the real Claude provider) live in `server.ts`.
 */
export * from "./core/index.js";
export * from "./eval/dataset.js";
export * from "./eval/harness.js";
