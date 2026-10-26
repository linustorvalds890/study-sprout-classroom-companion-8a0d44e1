import type { Question } from "./data";

export type AnswerValue = number | boolean | string | undefined;

export function isCorrect(q: Question, a: AnswerValue): boolean {
  switch (q.type) {
    case "mcq":
      return a === q.answer;
    case "truefalse":
      return a === q.answer;
    case "fill":
      return typeof a === "string" && q.answer.includes(a.trim().toLowerCase().replace(/\s+/g, ""));
    case "essay": {
      if (typeof a !== "string") return false;
      const text = a.toLowerCase();
      const words = text.split(/\s+/).filter(Boolean).length;
      const hits = q.keywords.filter((k) => text.includes(k)).length;
      return words >= q.minWords && hits >= Math.ceil(q.keywords.length / 2);
    }
  }
}

export function scoreQuiz(questions: Question[], answers: Record<string, AnswerValue>) {
  const correct = questions.filter((q) => isCorrect(q, answers[q.id])).length;
  return { correct, total: questions.length, percent: Math.round((correct / questions.length) * 100) };
}
