import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookCheck, Flame, Medal, Trophy } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Progress } from "@/components/ui/progress";
import { SubjectIcon } from "@/components/app/SubjectIcon";
import { quizzes, subjects } from "@/lib/data";
import { computeStreaks, dayKey, progressQuery } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "My Progress — Studia" },
      { name: "description", content: "Track completed lessons, quiz scores and study streaks over time." },
      { property: "og:title", content: "My Progress — Studia" },
      { property: "og:description", content: "Track completed lessons, quiz scores and study streaks over time." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(progressQuery),
  component: ProgressPage,
});

function ProgressPage() {
  const { data } = useSuspenseQuery(progressQuery);
  const activity = [...data.lessons.map((l) => new Date(l.completed_at)), ...data.attempts.map((a) => new Date(a.taken_at))];
  const streak = computeStreaks(activity);
  const totalLessons = subjects.reduce((n, s) => n + s.topics.length, 0);
  const avg = data.attempts.length ? Math.round(data.attempts.reduce((n, a) => n + a.percent, 0) / data.attempts.length) : 0;
  const best = data.attempts.reduce((m, a) => Math.max(m, a.percent), 0);
  const chart = data.attempts.map((a, i) => ({
    n: i + 1,
    date: new Date(a.taken_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    score: a.percent,
    quiz: quizzes.find((q) => q.id === a.quiz_id)?.title ?? a.quiz_id,
  }));

  // Last 12 weeks heatmap, oldest first
  const counts = new Map<string, number>();
  activity.forEach((d) => counts.set(dayKey(d), (counts.get(dayKey(d)) ?? 0) + 1));
  const today = new Date();
  const cells = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (83 - i));
    return { key: dayKey(d), count: counts.get(dayKey(d)) ?? 0, label: d.toLocaleDateString() };
  });

  const stats = [
    { label: "Current streak", value: `${streak.current} day${streak.current === 1 ? "" : "s"}`, icon: Flame },
    { label: "Best streak", value: `${streak.best} day${streak.best === 1 ? "" : "s"}`, icon: Medal },
    { label: "Lessons completed", value: `${data.lessons.length} / ${totalLessons}`, icon: BookCheck },
    { label: "Average quiz score", value: data.attempts.length ? `${avg}%` : "—", icon: Trophy },
  ];

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">My progress</h1>
        <p className="text-muted-foreground">Every lesson you finish and quiz you take shows up here.</p>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-card p-5 shadow-card">
            <Icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl bg-card p-5 shadow-card lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="font-bold">Quiz scores over time</h2>
            {best > 0 && <span className="text-sm text-muted-foreground">Best: {best}%</span>}
          </div>
          {chart.length === 0 ? (
            <Empty text="Take a quiz to see your scores here." to="/quizzes" cta="Browse quizzes" />
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="score" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" }}
                    formatter={(v) => [`${v}%`, "Score"]}
                    labelFormatter={(_, p) => p[0]?.payload.quiz ?? ""}
                  />
                  <Area type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} fill="url(#score)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-card p-5 shadow-card">
          <h2 className="font-bold">Study activity</h2>
          <p className="text-xs text-muted-foreground">Last 12 weeks</p>
          <div className="mt-4 grid grid-flow-col grid-rows-7 gap-1">
            {cells.map((c) => (
              <div
                key={c.key}
                title={`${c.label}: ${c.count} activit${c.count === 1 ? "y" : "ies"}`}
                className={cn(
                  "aspect-square rounded-sm",
                  c.count === 0 ? "bg-muted" : c.count === 1 ? "bg-primary/40" : c.count === 2 ? "bg-primary/70" : "bg-primary",
                )}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Active on {streak.activeDays} day{streak.activeDays === 1 ? "" : "s"}</p>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-card p-5 shadow-card">
          <h2 className="mb-4 font-bold">Lessons by subject</h2>
          <div className="space-y-4">
            {subjects.map((s) => {
              const doneCount = s.topics.filter((t) => data.lessons.some((l) => l.lesson_key === `${s.id}/${t.id}`)).length;
              return (
                <Link key={s.id} to="/subjects/$subjectId" params={{ subjectId: s.id }} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-primary"><SubjectIcon icon={s.icon} className="h-4 w-4" /></span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm"><span className="font-medium">{s.name}</span><span className="text-muted-foreground">{doneCount}/{s.topics.length}</span></div>
                    <Progress value={(doneCount / s.topics.length) * 100} className="mt-1.5 h-1.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-5 shadow-card">
          <h2 className="mb-4 font-bold">Recent quiz attempts</h2>
          {data.attempts.length === 0 ? (
            <Empty text="No attempts yet." to="/quizzes" cta="Start a quiz" />
          ) : (
            <ul className="divide-y divide-border">
              {[...data.attempts].reverse().slice(0, 8).map((a, i) => (
                <li key={i} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{quizzes.find((q) => q.id === a.quiz_id)?.title ?? a.quiz_id}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.taken_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", a.percent >= 70 ? "bg-success text-success-foreground" : a.percent >= 50 ? "bg-warning text-foreground" : "bg-destructive text-destructive-foreground")}>
                    {a.percent}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Empty({ text, to, cta }: { text: string; to: "/quizzes"; cta: string }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link to={to} className="mt-3 inline-block text-sm font-semibold text-primary">{cta}</Link>
    </div>
  );
}
