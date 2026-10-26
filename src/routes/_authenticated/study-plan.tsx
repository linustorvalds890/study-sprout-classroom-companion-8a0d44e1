import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { Loader2, Sparkles, BookCheck, ListChecks } from "lucide-react";
import { SubjectIcon } from "@/components/app/SubjectIcon";
import { useSuspenseQuery } from "@tanstack/react-query";
import { subjectsQuery } from "@/lib/content";
import { EmptyState } from "@/components/app/EmptyState";
import { createStudyPlan } from "@/lib/study-plan.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/study-plan")({
  head: () => ({
    meta: [
      { title: "AI Study Plan — Studia" },
      { name: "description", content: "Get a personalized study plan based on your completed lessons and quiz scores." },
      { property: "og:title", content: "AI Study Plan — Studia" },
      { property: "og:description", content: "Get a personalized study plan based on your completed lessons and quiz scores." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(subjectsQuery),
  component: StudyPlanPage,
});

type Stats = { completed: number; total: number; quizzes: number };

function StudyPlanPage() {
  const run = useServerFn(createStudyPlan);
  const { data: subjects } = useSuspenseQuery(subjectsQuery);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim()) return setError("Tell us what you'd like to achieve.");
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await run({ data: { subjectId, goal } });
      if (res.ok) {
        setPlan(res.plan);
        setStats(res.stats);
      } else setError(res.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI study plan</h1>
        <p className="text-muted-foreground">
          Pick a subject and share your goal — we'll build a plan from your lessons and quiz scores.
        </p>
      </div>

      {subjects.length === 0 ? (
        <EmptyState title="No subjects yet" text="Once subjects are added you can create a study plan for them." />
      ) : (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <form onSubmit={submit} className="space-y-5 self-start rounded-2xl bg-card p-6 shadow-card">
          <div>
            <p className="mb-3 text-sm font-semibold">Subject</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {subjects.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setSubjectId(s.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    subjectId === s.id
                      ? "border-primary bg-primary text-primary-foreground shadow-elegant"
                      : "hover:bg-secondary",
                  )}
                >
                  <SubjectIcon icon={s.icon} className="h-4 w-4 shrink-0" />
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="goal" className="mb-2 block text-sm font-semibold">Your learning goal</label>
            <textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={4}
              maxLength={600}
              placeholder="e.g. Feel confident with quadratic equations before next week's quiz"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Building your plan…" : "Create my study plan"}
          </button>
        </form>

        <section className="rounded-2xl bg-card p-6 shadow-card">
          {plan ? (
            <>
              {stats && (
                <div className="mb-5 flex flex-wrap gap-2 text-xs font-medium">
                  <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
                    <BookCheck className="h-3.5 w-3.5" /> {stats.completed}/{stats.total} lessons done
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
                    <ListChecks className="h-3.5 w-3.5" /> {stats.quizzes} quiz attempts
                  </span>
                </div>
              )}
              <Markdown text={plan} />
            </>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center text-center text-muted-foreground">
              <Sparkles className={cn("mb-3 h-9 w-9 text-primary", loading && "animate-pulse")} />
              <p>{loading ? "Looking at your lessons and quiz scores…" : "Your personalized plan will appear here."}</p>
            </div>
          )}
        </section>
      </div>
      )}
    </div>
  );
}

function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

function Markdown({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{inline(it)}</li>);
    out.push(
      list.ordered ? (
        <ol key={out.length} className="list-decimal space-y-1.5 pl-5">{items}</ol>
      ) : (
        <ul key={out.length} className="list-disc space-y-1.5 pl-5">{items}</ul>
      ),
    );
    list = null;
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const ol = line.match(/^\d+[.)]\s+(.*)/);
    const ul = line.match(/^[-*]\s+(.*)/);
    if (ol || ul) {
      const ordered = !!ol;
      if (!list || list.ordered !== ordered) {
        flush();
        list = { ordered, items: [] };
      }
      list.items.push((ol ?? ul)?.[1] ?? "");
      continue;
    }
    flush();
    if (!line) continue;
    const h = line.match(/^#{1,4}\s+(.*)/);
    if (h) out.push(<h2 key={out.length} className="mt-6 text-lg font-bold text-primary first:mt-0">{inline(h[1] ?? "")}</h2>);
    else out.push(<p key={out.length}>{inline(line)}</p>);
  }
  flush();
  return <div className="space-y-3 text-sm leading-relaxed">{out}</div>;
}
