import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock, Flame, ListChecks, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SubjectIcon } from "@/components/app/SubjectIcon";
import { events, quizzes, subjects } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Studia" },
      { name: "description", content: "Your courses, upcoming classes and quizzes at a glance." },
      { property: "og:title", content: "Dashboard — Studia" },
      { property: "og:description", content: "Your courses, upcoming classes and quizzes at a glance." },
    ],
  }),
  component: Dashboard,
});

const stats = [
  { label: "Study streak", value: "12 days", icon: Flame },
  { label: "Avg. quiz score", value: "84%", icon: Trophy },
  { label: "Hours this week", value: "17.5", icon: Clock },
  { label: "Quizzes done", value: "23", icon: ListChecks },
];

function Dashboard() {
  const { user } = Route.useRouteContext();
  const firstName = ((user.user_metadata as { full_name?: string }).full_name ?? "student").split(" ")[0];
  const upcoming = events.filter((e) => e.dayOffset >= 0).sort((a, b) => a.dayOffset - b.dayOffset).slice(0, 4);
  return (
    <div className="space-y-8 fade-up">
      <section className="relative overflow-hidden rounded-3xl bg-hero p-6 text-primary-foreground md:p-10">
        <p className="text-sm font-medium opacity-80">Welcome back, {firstName}</p>
        <h1 className="mt-2 max-w-xl text-3xl font-extrabold tracking-tight md:text-4xl">
          You have 2 classes today and a quiz in 2 days.
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
          <div className="grid gap-4 sm:grid-cols-2">
            {subjects.slice(0, 4).map((s) => (
              <Link key={s.id} to="/subjects/$subjectId" params={{ subjectId: s.id }} className="card-lift rounded-2xl bg-card p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary">
                    <SubjectIcon icon={s.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.instructor}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span><span className="font-semibold text-foreground">{s.progress}%</span>
                </div>
                <Progress value={s.progress} className="mt-2 h-2" />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">Coming up</h2>
          <div className="space-y-3 rounded-2xl bg-card p-4 shadow-card">
            {upcoming.map((e) => (
              <div key={e.id} className="flex items-start gap-3 rounded-xl p-2 hover:bg-secondary/60">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                  <CalendarDays className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.dayOffset === 0 ? "Today" : e.dayOffset === 1 ? "Tomorrow" : `In ${e.dayOffset} days`} · {e.start}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <h2 className="mb-4 mt-6 text-xl font-bold">Quick quiz</h2>
          <Link to="/quizzes/$quizId" params={{ quizId: quizzes[0]!.id }} className="card-lift block rounded-2xl bg-navy p-5 text-navy-foreground">
            <p className="text-xs uppercase tracking-wide opacity-70">{quizzes[0]!.subject}</p>
            <p className="mt-1 font-semibold">{quizzes[0]!.title}</p>
            <p className="mt-3 text-xs opacity-70">{quizzes[0]!.questions.length} questions · {quizzes[0]!.minutes} min</p>
          </Link>
        </section>
      </div>
    </div>
  );
}
