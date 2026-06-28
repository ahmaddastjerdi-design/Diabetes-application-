import { describe, it, expect } from "@jest/globals";
import { defaultProfile, reminderBody } from "./profile";

describe("defaultProfile", () => {
  it("starts un-onboarded with reminders off", () => {
    const p = defaultProfile();
    expect(p.onboarded).toBe(false);
    expect(p.tutorialSeen).toBe(false);
    expect(p.reminderEnabled).toBe(false);
    expect(p.reminderHour).toBe(20);
  });
});

describe("reminderBody", () => {
  it("falls back when no meds are known", () => {
    expect(reminderBody([])).toMatch(/medication/i);
  });
  it("names a single medication", () => {
    expect(reminderBody(["metformin"])).toMatch(/Metformin/);
  });
  it("joins multiple medications with 'and'", () => {
    const body = reminderBody(["metformin", "statin"]);
    expect(body).toMatch(/Metformin/);
    expect(body).toMatch(/Statin/);
    expect(body).toMatch(/ and /);
  });
});
