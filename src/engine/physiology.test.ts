import { describe, it, expect } from "@jest/globals";
import {
  MARKERS,
  BodyState,
  baselineMarkers,
  initialBodyState,
  applyActionEffects,
  deviation,
  advanceDay,
  organStatus,
  markerStatus,
  estimatedA1c,
  a1cStatus,
  organInsights,
} from "./physiology";

const inRangeBody = (): BodyState => ({
  markers: { glucose: 100, systolic: 115, hydration: 80, ldl: 80 },
  organs: { heart: 70, kidney: 70 },
  day: 0,
  history: [{ day: 0, heart: 70, kidney: 70, glucose: 100 }],
});

describe("deviation", () => {
  it("is 0 inside the healthy band", () => {
    expect(deviation("glucose", 100)).toBe(0);
    expect(deviation("glucose", 80)).toBe(0);
    expect(deviation("glucose", 140)).toBe(0);
  });
  it("is positive outside the band and grows with distance", () => {
    expect(deviation("glucose", 150)).toBeGreaterThan(0);
    expect(deviation("glucose", 300)).toBeGreaterThan(deviation("glucose", 150));
  });
});

describe("baselineMarkers / initialBodyState", () => {
  it("baselines match the marker definitions", () => {
    expect(baselineMarkers().glucose).toBe(MARKERS.glucose.baseline);
  });
  it("seeds a single history point", () => {
    expect(initialBodyState().history).toHaveLength(1);
  });
});

describe("applyActionEffects", () => {
  it("adds effects and clamps to plausible bounds", () => {
    const s = inRangeBody();
    expect(applyActionEffects(s, { glucose: -30 }).markers.glucose).toBe(70);
    expect(applyActionEffects(s, { glucose: 1000 }).markers.glucose).toBe(
      MARKERS.glucose.clamp[1]
    );
  });
  it("does not mutate the input", () => {
    const s = inRangeBody();
    applyActionEffects(s, { glucose: 50 });
    expect(s.markers.glucose).toBe(100);
  });
});

describe("advanceDay", () => {
  it("heals organs when all markers are in range", () => {
    const { next, organDelta } = advanceDay(inRangeBody());
    expect(next.organs.heart).toBeGreaterThan(70);
    expect(next.organs.kidney).toBeGreaterThan(70);
    expect(organDelta.heart).toBeGreaterThan(0);
  });
  it("harms organs when markers are far out of range", () => {
    const bad: BodyState = {
      ...inRangeBody(),
      markers: { glucose: 300, systolic: 190, hydration: 15, ldl: 230 },
    };
    const { next } = advanceDay(bad);
    expect(next.organs.heart).toBeLessThan(70);
    expect(next.organs.kidney).toBeLessThan(70);
  });
  it("keeps lived markers visible and records glucose history", () => {
    const { next } = advanceDay(inRangeBody());
    expect(next.markers.glucose).toBe(100); // not reset to baseline here
    expect(next.day).toBe(1);
    expect(next.history).toHaveLength(2);
    expect(next.history[next.history.length - 1].glucose).toBe(100);
  });
  it("clamps organ health within [0,100]", () => {
    let s: BodyState = {
      ...inRangeBody(),
      organs: { heart: 1, kidney: 1 },
      markers: { glucose: 320, systolic: 200, hydration: 10, ldl: 240 },
    };
    for (let i = 0; i < 5; i++) s = advanceDay(s).next;
    expect(s.organs.heart).toBeGreaterThanOrEqual(0);
    expect(s.organs.kidney).toBeGreaterThanOrEqual(0);
  });
});

describe("status bands", () => {
  it("organStatus maps score to a band", () => {
    expect(organStatus(85).label).toBe("Thriving");
    expect(organStatus(70).label).toBe("Healthy");
    expect(organStatus(50).label).toBe("Strained");
    expect(organStatus(30).label).toBe("At risk");
    expect(organStatus(10).label).toBe("Critical");
  });
  it("markerStatus reflects range", () => {
    expect(markerStatus("glucose", 100).label).toBe("In range");
    expect(markerStatus("glucose", 300).label).toBe("Out of range");
  });
});

describe("estimated A1c", () => {
  it("returns null with no history", () => {
    expect(estimatedA1c([])).toBeNull();
  });
  it("uses the ADAG formula on the average", () => {
    expect(estimatedA1c([100])).toBeCloseTo(5.1, 1);
    expect(estimatedA1c([100, 200])!).toBeGreaterThan(estimatedA1c([100])!);
  });
  it("bands the value", () => {
    expect(a1cStatus(5.1).label).toBe("Normal");
    expect(a1cStatus(6.5).label).toBe("On target");
    expect(a1cStatus(7.5).label).toBe("Above target");
    expect(a1cStatus(9).label).toBe("High");
  });
});

describe("organInsights", () => {
  it("sorts the most out-of-range marker first and flags it", () => {
    const markers = { glucose: 100, systolic: 190, hydration: 80, ldl: 80 };
    const insights = organInsights("heart", markers);
    expect(insights[0].marker).toBe("systolic");
    expect(insights[0].inRange).toBe(false);
    expect(insights[0].tip.length).toBeGreaterThan(0);
  });
  it("marks everything in range when markers are healthy", () => {
    const insights = organInsights("kidney", inRangeBody().markers);
    expect(insights.every((i) => i.inRange)).toBe(true);
  });
});
