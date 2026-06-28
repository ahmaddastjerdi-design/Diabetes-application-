/**
 * memory.ts — conversation memory (Vol 6 §memory). A bounded short-term window of recent
 * turns plus a durable rolling summary. Pure structure; summarization is an injected port
 * so the model layer (or a cheaper model) produces the summary. Privacy: callers control
 * retention and what is persisted (Vol 6/8).
 */

export interface Turn {
  role: "user" | "coach";
  text: string;
  atMs: number;
}

export interface ConversationMemory {
  summary: string;
  recentTurns: Turn[];
}

export function emptyMemory(): ConversationMemory {
  return { summary: "", recentTurns: [] };
}

/** Append a turn, keeping the window bounded (older turns drop into compaction). */
export function appendTurn(mem: ConversationMemory, turn: Turn): ConversationMemory {
  return { ...mem, recentTurns: [...mem.recentTurns, turn] };
}

/** Port: fold overflow turns into the running summary. */
export interface Summarizer {
  summarize(olderTurns: readonly Turn[], previousSummary: string): Promise<string>;
}

/**
 * Compact memory to at most `maxTurns` recent turns, summarizing the overflow into the
 * rolling summary. Returns memory unchanged when already within the window.
 */
export async function compact(
  mem: ConversationMemory,
  maxTurns: number,
  summarizer: Summarizer
): Promise<ConversationMemory> {
  if (mem.recentTurns.length <= maxTurns) return mem;
  const overflow = mem.recentTurns.slice(0, mem.recentTurns.length - maxTurns);
  const kept = mem.recentTurns.slice(mem.recentTurns.length - maxTurns);
  const summary = await summarizer.summarize(overflow, mem.summary);
  return { summary, recentTurns: kept };
}
