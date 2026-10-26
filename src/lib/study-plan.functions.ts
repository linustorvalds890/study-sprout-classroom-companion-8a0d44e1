import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { subjectId: string; goal: string }) => {
    const subjectId = String(input?.subjectId ?? "");
    const goal = String(input?.goal ?? "").trim().slice(0, 600);
    if (!/^[0-9a-f-]{36}$/i.test(subjectId)) throw new Error("Please choose a subject.");
    if (!goal) throw new Error("Please share your learning goal.");
    return { subjectId, goal };
  })
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const [sub, l, q] = await Promise.all([
      sb.from("subjects").select("name, lessons(id, title, sort), quizzes(id, title)").eq("id", data.subjectId).maybeSingle(),
      sb.from("lesson_completions").select("lesson_key"),
      sb.from("quiz_attempts").select("quiz_id, percent, taken_at").order("taken_at"),
    ]);
    if (sub.error || !sub.data) return { ok: false as const, status: 404, error: "That subject couldn't be found." };
    const subject = { name: sub.data.name, topics: [...sub.data.lessons].sort((a, b) => a.sort - b.sort) };
    const subjectQuizzes = sub.data.quizzes;
    if (l.error || q.error) {
      return { ok: false as const, status: 500, error: "Couldn't load your progress. Please try again." };
    }
    const done = new Set(l.data.map((r) => r.lesson_key));
    const completed = subject.topics.filter((t) => done.has(t.id)).map((t) => t.title);
    const remaining = subject.topics.filter((t) => !done.has(t.id)).map((t) => t.title);
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
