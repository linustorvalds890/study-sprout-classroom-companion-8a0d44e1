import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { Sprout, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createStudyPlan } from "@/lib/study-plan.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study Sprout — Your personalized AI study plan" },
      {
        name: "description",
        content: "Pick a subject, share your goal, and get a study plan built from your lessons and quiz scores.",
      },
      { property: "og:title", content: "Study Sprout — Your personalized AI study plan" },
      {
        property: "og:description",
        content: "Pick a subject, share your goal, and get a study plan built from your lessons and quiz scores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SUBJECTS = ["Math", "Science", "English", "History", "Spanish", "Computer Science"];

const SAMPLE: Record<string, { title: string; score: string }[]> = {
  Math: [
    { title: "Fractions and decimals", score: "92" },
    { title: "Linear equations", score: "68" },
    { title: "Intro to graphing", score: "75" },
  ],
};

type Row = { title: string; score: string };

function Index() {
  const run = useServerFn(createStudyPlan);
  const [subject, setSubject] = useState("Math");
  const [goal, setGoal] = useState("");
  const [rows, setRows] = useState<Row[]>(SAMPLE.Math);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim()) return setError("Tell us what you'd like to achieve.");
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await run({
        data: {
          subject,
          goal,
          lessons: rows
            .filter((r) => r.title.trim())
            .map((r) => ({ title: r.title, score: r.score === "" ? null : Number(r.score) })),
        },
      });
      if (res.ok) setPlan(res.plan);
      else setError(res.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero">
      <main className="mx-auto max-w-5xl px-5 py-12 md:py-16">
        <header className="mb-10 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
            <Sprout className="size-6" />
          </span>
          <span className="font-display text-xl font-bold">Study Sprout</span>
        </header>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
          A study plan that grows <em className="text-primary">with you</em>.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Pick a subject, share your goal, and we'll build a week of study around what you've already learned.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <form onSubmit={submit} className="space-y-6 rounded-3xl border bg-card p-6 shadow-soft">
            <div>
              <label className="mb-2 block text-sm font-medium">Subject</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => {
                      setSubject(s);
                      setRows(SAMPLE[s] ?? [{ title: "", score: "" }]);
                    }}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                      subject === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background hover:bg-secondary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="goal" className="mb-2 block text-sm font-medium">Your learning goal</label>
              <Textarea
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Feel confident solving equations before my test next Friday"
                rows={3}
                maxLength={600}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Completed lessons & quiz scores</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRows((r) => [...r, { title: "", score: "" }])}
                >
                  <Plus /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {rows.map((row, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      aria-label="Lesson name"
                      placeholder="Lesson name"
                      value={row.title}
                      onChange={(e) => update(i, { title: e.target.value })}
                    />
                    <Input
                      aria-label="Quiz score"
                      className="w-24"
                      type="number"
                      min={0}
                      max={100}
                      placeholder="%"
                      value={row.score}
                      onChange={(e) => update(i, { score: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove lesson"
                      onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

            <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {loading ? "Growing your plan…" : "Create my study plan"}
            </Button>
          </form>

          <section className="rounded-3xl border bg-card/70 p-6 md:p-8">
            {plan ? (
              <Markdown text={plan} />
            ) : (
              <div className="flex h-full min-h-64 flex-col items-center justify-center text-center text-muted-foreground">
                <Sprout className={`mb-3 size-10 text-primary ${loading ? "animate-pulse" : ""}`} />
                <p>{loading ? "Looking at your lessons and scores…" : "Your personalized plan will appear here."}</p>
              </div>
            )}
          </section>
        </div>
      </main>
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
      list.items.push((ol ?? ul)![1]);
      continue;
    }
    flush();
    if (!line) continue;
    const h = line.match(/^#{1,4}\s+(.*)/);
    if (h) out.push(<h2 key={out.length} className="mt-6 text-xl font-bold text-primary first:mt-0">{inline(h[1])}</h2>);
    else out.push(<p key={out.length}>{inline(line)}</p>);
  }
  flush();
  return <div className="space-y-3 leading-relaxed">{out}</div>;
}
