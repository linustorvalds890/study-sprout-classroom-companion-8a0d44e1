import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookCheck, CalendarDays, Flame, ListChecks, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SubjectIcon } from "@/components/app/SubjectIcon";
import { EmptyState } from "@/components/app/EmptyState";
import { eventsQuery, quizzesQuery, subjectProgress, subjectsQuery } from "@/lib/content";
import { computeStreaks, progressQuery } from "@/lib/progress";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Studia" },
      { name: "description", content: "Your courses, upcoming classes and quizzes at a glance." },
      { property: "og:title", content: "Dashboard — Studia" },
      { property: "og:description", content: "Your courses, upcoming classes and quizzes at a glance." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(subjectsQuery),
      context.queryClient.ensureQueryData(quizzesQuery),
      context.queryClient.ensureQueryData(eventsQuery),
      context.queryClient.ensureQueryData(progressQuery),
    ]),
  component: Dashboard,
});

function relDay(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const n = Math.round((x.getTime() - today.getTime()) / 86400000);
  return n === 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`;
}

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { data: subjects } = useSuspenseQuery(subjectsQuery);
  const { data: quizzes } = useSuspenseQuery(quizzesQuery);
  const { data: events } = useSuspenseQuery(eventsQuery);
  const { data: progress } = useSuspenseQuery(progressQuery);

  const firstName = ((user.user_metadata as { full_name?: string }).full_name ?? "student").split(" ")[0];
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.ends_at ?? e.starts_at).getTime() >= now).slice(0, 4);
  const done = new Set(progress.lessons.map((l) => l.lesson_key));
  const streak = computeStreaks([
    ...progress.lessons.map((l) => new Date(l.completed_at)),
    ...progress.attempts.map((a) => new Date(a.taken_at)),
  ]);
  const avg = progress.attempts.length
    ? Math.round(progress.attempts.reduce((n, a) => n + a.percent, 0) / progress.attempts.length)
    : null;
  const todayCount = upcoming.filter((e) => relDay(new Date(e.starts_at)) === "Today").length;
  const nextQuiz = quizzes.find((q) => !progress.attempts.some((a) => a.quiz_id === q.id)) ?? quizzes[0];

  const stats = [
    { label: "Study streak", value: `${streak.current} day${streak.current === 1 ? "" : "s"}`, icon: Flame },
    { label: "Avg. quiz score", value: avg === null ? "—" : `${avg}%`, icon: Trophy },
    { label: "Lessons completed", value: String(progress.lessons.length), icon: BookCheck },
    { label: "Quizzes done", value: String(progress.attempts.length), icon: ListChecks },
  ];

  return (
    <div className="space-y-8 fade-up">
      <section className="relative overflow-hidden rounded-3xl bg-hero p-6 text-primary-foreground md:p-10">
        <p className="text-sm font-medium opacity-80">Welcome back, {firstName}</p>
        <h1 className="mt-2 max-w-xl text-3xl font-extrabold tracking-tight md:text-4xl">
          {todayCount > 0
            ? `You have ${todayCount} thing${todayCount === 1 ? "" : "s"} on your schedule today.`
            : upcoming.length > 0
              ? `Next up: ${upcoming[0]!.title}.`
              : "Ready to learn something new today?"}
        </h1>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/quizzes" className="inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-semibold text-foreground">
            Practise now <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/schedule" className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/30 px-4 py-2.5 text-sm font-semibold">
            View schedule
          </Link>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-glow/30 blur-3xl" />
      </section>

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
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Your subjects</h2>
            <Link to="/subjects" className="text-sm font-medium text-primary">See all</Link>
          </div>
          {subjects.length === 0 ? (
            <EmptyState title="No subjects yet" text="Your school hasn't added any subjects yet. Check back soon." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {subjects.slice(0, 4).map((s) => {
                const pct = subjectProgress(s, done);
                return (
                  <Link key={s.id} to="/subjects/$subjectId" params={{ subjectId: s.id }} className="card-lift rounded-2xl bg-card p-5 shadow-card">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary">
                        <SubjectIcon icon={s.icon} className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.instructor || `${s.lessons.length} lessons`}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span><span className="font-semibold text-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} className="mt-2 h-2" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">Coming up</h2>
          <div className="space-y-3 rounded-2xl bg-card p-4 shadow-card">
            {upcoming.length === 0 && <p className="p-2 text-sm text-muted-foreground">Nothing scheduled yet.</p>}
            {upcoming.map((e) => {
              const d = new Date(e.starts_at);
              return (
                <div key={e.id} className="flex items-start gap-3 rounded-xl p-2 hover:bg-secondary/60">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                    <CalendarDays className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {relDay(d)} · {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {nextQuiz && (
            <>
              <h2 className="mb-4 mt-6 text-xl font-bold">Quick quiz</h2>
              <Link to="/quizzes/$quizId" params={{ quizId: nextQuiz.id }} className="card-lift block rounded-2xl bg-navy p-5 text-navy-foreground">
                <p className="text-xs uppercase tracking-wide opacity-70">{subjects.find((s) => s.id === nextQuiz.subject_id)?.name}</p>
                <p className="mt-1 font-semibold">{nextQuiz.title}</p>
                <p className="mt-3 text-xs opacity-70">{nextQuiz.questions.length} questions · {nextQuiz.minutes} min</p>
              </Link>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
