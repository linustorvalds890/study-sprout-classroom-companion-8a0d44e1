import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { quizzes, subjects } from "./data";

export const createStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { subjectId: string; goal: string }) => {
    const subjectId = String(input?.subjectId ?? "");
    const goal = String(input?.goal ?? "").trim().slice(0, 600);
    if (!subjects.some((s) => s.id === subjectId)) throw new Error("Please choose a subject.");
    if (!goal) throw new Error("Please share your learning goal.");
    return { subjectId, goal };
  })
  .handler(async ({ data, context }) => {
    const subject = subjects.find((s) => s.id === data.subjectId)!;
    const [l, q] = await Promise.all([
      context.supabase.from("lesson_completions").select("lesson_key"),
      context.supabase.from("quiz_attempts").select("quiz_id, percent, taken_at").order("taken_at"),
    ]);
    if (l.error || q.error) {
      return { ok: false as const, status: 500, error: "Couldn't load your progress. Please try again." };
    }
    const done = new Set(l.data.map((r) => r.lesson_key));
    const completed = subject.topics.filter((t) => done.has(`${subject.id}/${t.id}`)).map((t) => t.title);
    const remaining = subject.topics.filter((t) => !done.has(`${subject.id}/${t.id}`)).map((t) => t.title);
    const subjectQuizzes = quizzes.filter((z) => z.subject === subject.name);
    const attempts = q.data
      .map((a) => ({ a, quiz: subjectQuizzes.find((z) => z.id === a.quiz_id) }))
      .filter((x) => x.quiz)
      .map(({ a, quiz }) => ({ title: quiz!.title, percent: a.percent, takenAt: a.taken_at }));

    const { generateStudyPlan, GatewayError } = await import("./study-plan.server");
    try {
      const plan = await generateStudyPlan({
        subject: subject.name,
        goal: data.goal,
        completed,
        remaining,
        quizzes: attempts,
      });
      return { ok: true as const, plan, stats: { completed: completed.length, total: subject.topics.length, quizzes: attempts.length } };
    } catch (e) {
      if (e instanceof GatewayError) {
        const message =
          e.status === 402
            ? "The app is out of AI credits. Please add credits to keep generating plans."
            : e.status === 429
              ? "Too many requests right now. Please wait a moment and try again."
              : e.message;
        return { ok: false as const, status: e.status, error: message };
      }
      console.error(e);
      return { ok: false as const, status: 500, error: "Something went wrong creating your plan." };
    }
  });
