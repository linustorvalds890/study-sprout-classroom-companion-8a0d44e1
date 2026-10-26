import { describe, expect, it } from "vitest";
import { quizzes } from "./data";
import { isCorrect, scoreQuiz } from "./quiz";

const q = quizzes[0]!.questions;

describe("quiz scoring", () => {
  it("fill-in accepts answers regardless of case and spaces", () => {
    expect(isCorrect(q[2]!, " 3X² ")).toBe(true);
    expect(isCorrect(q[2]!, "x3")).toBe(false);
  });
  it("essay needs minimum words and half the keywords", () => {
    expect(isCorrect(q[4]!, "short rate")).toBe(false);
    expect(isCorrect(q[4]!, "A derivative tells us the rate of change of a function and equals the slope of the tangent line at a point")).toBe(true);
  });
  it("computes percent", () => {
    expect(scoreQuiz(q, { q1: 1, q2: true })).toEqual({ correct: 2, total: 5, percent: 40 });
  });
});
