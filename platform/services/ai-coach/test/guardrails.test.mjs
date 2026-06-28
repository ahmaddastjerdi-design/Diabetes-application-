/**
 * guardrails.test.mjs — the safety tests that matter most (Vol 9 §medical-workflow, Vol 6).
 * These assert that the coach's guardrails fire deterministically, independent of any model.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyMessage,
  isDosingRequest,
  runCoach,
  StubCoachProvider,
  DOSING_REFUSAL,
} from "../dist/index.js";

test("Tier-3 emergencies are detected (DKA, severe hypo, chest pain, self-harm)", () => {
  assert.equal(classifyMessage("I can't stop vomiting and feel very drowsy").tier, "tier3");
  assert.equal(classifyMessage("I'm passing out and my sugar is 38").tier, "tier3");
  assert.equal(classifyMessage("I have chest pain right now").tier, "tier3");
  assert.equal(classifyMessage("I want to end my life").tier, "tier3");
});

test("ordinary educational questions are not flagged", () => {
  assert.equal(classifyMessage("How does walking affect my glucose?").tier, "none");
});

test("dosing requests are detected; lookups are not", () => {
  assert.equal(isDosingRequest("how much insulin should I take"), true);
  assert.equal(isDosingRequest("should I increase my metformin dose"), true);
  assert.equal(isDosingRequest("what is insulin"), false);
});

test("orchestrator: red-flag response overrides the model", async () => {
  const reply = await runCoach(new StubCoachProvider(), {
    userId: "u1",
    message: "I can't stop vomiting",
    context: {},
  });
  assert.equal(reply.tier, "tier3");
  assert.equal(reply.guardrailed, true);
});

test("orchestrator: dosing is hard-blocked with the refusal, never reaching the model", async () => {
  const reply = await runCoach(new StubCoachProvider(), {
    userId: "u1",
    message: "how many units of insulin should I take tonight",
    context: {},
  });
  assert.equal(reply.guardrailed, true);
  assert.equal(reply.text, DOSING_REFUSAL);
});

test("orchestrator: safe questions reach the (stub) model", async () => {
  const reply = await runCoach(new StubCoachProvider(), {
    userId: "u1",
    message: "What is a good post-meal walk length?",
    context: { recentSummary: "glucose trending in range" },
  });
  assert.equal(reply.guardrailed, false);
  assert.ok(reply.text.length > 0);
});
