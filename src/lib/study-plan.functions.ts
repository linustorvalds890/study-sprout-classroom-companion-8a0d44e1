import { createServerFn } from "@tanstack/react-start";
import type { StudyPlanInput } from "./study-plan.server";

export const createStudyPlan = createServerFn({ method: "POST" })
  .inputValidator((input: StudyPlanInput) => {
    const subject = String(input?.subject ?? "").trim().slice(0, 80);
    const goal = String(input?.goal ?? "").trim().slice(0, 600);
    if (!subject) throw new Error("Please choose a subject.");
    if (!goal) throw new Error("Please share your learning goal.");
    const lessons = (Array.isArray(input?.lessons) ? input.lessons : [])
      .slice(0, 30)
      .map((l) => ({
        title: String(l?.title ?? "").trim().slice(0, 120),
        score:
          l?.score === null || l?.score === undefined || Number.isNaN(Number(l.score))
            ? null
            : Math.max(0, Math.min(100, Math.round(Number(l.score)))),
      }))
      .filter((l) => l.title);
    return { subject, goal, lessons };
  })
  .handler(async ({ data }) => {
    const { generateStudyPlan, GatewayError } = await import("./study-plan.server");
    try {
      return { ok: true as const, plan: await generateStudyPlan(data) };
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
