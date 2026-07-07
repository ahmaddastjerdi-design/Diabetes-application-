/**
 * phr — the Personal Health Record module.
 *
 * A self-contained slice: a pure domain model (`records`), an injectable
 * persistence layer (`PhrRepository`), and a React hook (`usePhr`). It stores
 * the patient's real, self-reported vitals / notes / appointments, separate
 * from the teaching simulation in `engine/`.
 */
export * from "./records";
export * from "./PhrRepository";
export * from "./usePhr";
