import { describe, expect, it } from "vitest";
import { computeStreaks } from "./progress";

const d = (day: number) => new Date(2026, 9, day, 12);

describe("study streaks", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreaks([d(24), d(25), d(26), d(26)], d(26)).current).toBe(3);
  });
  it("keeps the streak alive if last activity was yesterday", () => {
    expect(computeStreaks([d(24), d(25)], d(26)).current).toBe(2);
  });
  it("breaks after a missed day and tracks best", () => {
    const s = computeStreaks([d(10), d(11), d(12), d(13), d(20)], d(26));
    expect(s.current).toBe(0);
    expect(s.best).toBe(4);
    expect(s.activeDays).toBe(5);
  });
});
