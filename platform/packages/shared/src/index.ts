/**
 * @diabetes-quest/shared — the single source of truth all platform packages import.
 *
 * Re-exports the domain & FHIR contracts. Keep this package free of runtime
 * dependencies and platform-specific code so the RN app, the web panel, and the
 * Node services can all consume it.
 */
export * from "./domain/index.js";
