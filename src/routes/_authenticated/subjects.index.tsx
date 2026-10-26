import { createFileRoute, Link } from "@tanstack/react-router";
import { CloudDownload, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SubjectIcon } from "@/components/app/SubjectIcon";
import { subjects } from "@/lib/data";
import { useSaved } from "@/lib/offline";

export const Route = createFileRoute("/_authenticated/subjects/")({
  head: () => ({
    meta: [
      { title: "Subjects & Solutions — Studia" },
      { name: "description", content: "Browse subjects, explanations, study materials and step-by-step solutions." },
      { property: "og:title", content: "Subjects & Solutions — Studia" },
      { property: "og:description", content: "Browse subjects, explanations, study materials and step-by-step solutions." },
    ],
  }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const [q, setQ] = useState("");
  const saved = useSaved();
  const list = subjects.filter(
    (s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.topics.some((t) => t.title.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Content & Solutions</h1>
          <p className="text-muted-foreground">Explanations, materials and worked problems by subject.</p>
        </div>
        <div className="relative md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subjects or topics" className="bg-card pl-9" />
        </div>
      </div>
      {saved.length > 0 && (
        <section className="rounded-2xl bg-navy p-5 text-navy-foreground">
          <p className="flex items-center gap-2 font-semibold"><CloudDownload className="h-4 w-4" />Saved for offline</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {saved.map((key) => {
              const [sid, tid] = key.split("/");
              const s = subjects.find((x) => x.id === sid);
              const t = s?.topics.find((x) => x.id === tid);
              if (!s || !t) return null;
              return (
                <Link key={key} to="/subjects/$subjectId" params={{ subjectId: s.id }} search={{ topic: t.id }} className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm hover:bg-primary">
                  <span className="opacity-70">{s.name} · </span>{t.title}
                </Link>
              );
            })}
          </div>
        </section>
      )}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((s) => (
          <Link key={s.id} to="/subjects/$subjectId" params={{ subjectId: s.id }} className="card-lift flex flex-col rounded-2xl bg-card p-6 shadow-card">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
              <SubjectIcon icon={s.icon} className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-bold">{s.name}</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{s.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {s.topics.map((t) => (
                <span key={t.id} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">{t.title}</span>
              ))}
            </div>
            <Progress value={s.progress} className="mt-5 h-1.5" />
          </Link>
        ))}
        {list.length === 0 && <p className="text-muted-foreground">No subjects match “{q}”.</p>}
      </div>
    </div>
  );
}
