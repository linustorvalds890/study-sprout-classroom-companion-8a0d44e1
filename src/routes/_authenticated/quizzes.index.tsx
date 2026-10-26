import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, HelpCircle } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import { quizzesQuery, subjectsQuery } from "@/lib/content";
import { progressQuery } from "@/lib/progress";

export const Route = createFileRoute("/_authenticated/quizzes/")({
  head: () => ({
    meta: [
      { title: "Quizzes — Studia" },
      { name: "description", content: "Timed quizzes with MCQ, true/false, fill-in and essay questions." },
      { property: "og:title", content: "Quizzes — Studia" },
      { property: "og:description", content: "Timed quizzes with MCQ, true/false, fill-in and essay questions." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(quizzesQuery),
      context.queryClient.ensureQueryData(subjectsQuery),
      context.queryClient.ensureQueryData(progressQuery),
    ]),
  component: QuizzesPage,
});

const labels = { mcq: "Multiple choice", truefalse: "True / False", fill: "Fill in", essay: "Essay" };

function QuizzesPage() {
  const { data: quizzes } = useSuspenseQuery(quizzesQuery);
  const { data: subjects } = useSuspenseQuery(subjectsQuery);
  const { data: progress } = useSuspenseQuery(progressQuery);
  const list = quizzes.filter((q) => q.questions.length > 0);
  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Quizzes</h1>
        <p className="text-muted-foreground">Test yourself and get instant, detailed feedback.</p>
      </div>
      {list.length === 0 ? (
        <EmptyState title="No quizzes yet" text="Quizzes will appear here once your teachers add them." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((q) => {
            const best = progress.attempts.filter((a) => a.quiz_id === q.id).reduce((m, a) => Math.max(m, a.percent), -1);
            return (
              <div key={q.id} className="card-lift flex flex-col rounded-2xl bg-card p-6 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {subjects.find((s) => s.id === q.subject_id)?.name}
                </p>
                <h2 className="mt-1 text-lg font-bold">{q.title}</h2>
                <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><HelpCircle className="h-4 w-4" />{q.questions.length} questions</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{q.minutes} min</span>
                </div>
                <div className="mt-4 flex flex-1 flex-wrap content-start gap-2">
                  {[...new Set(q.questions.map((x) => x.type))].map((t) => (
                    <span key={t} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">{labels[t]}</span>
                  ))}
                  {best >= 0 && <span className="rounded-full bg-success px-2.5 py-1 text-xs font-medium text-success-foreground">Best {best}%</span>}
                </div>
                <Link to="/quizzes/$quizId" params={{ quizId: q.id }} className="mt-6 rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-elegant">
                  {best >= 0 ? "Retake quiz" : "Start quiz"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
