import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CloudDownload, CloudOff, CheckCircle2, Download, FileText, PlayCircle, Presentation } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { progressQuery, setLessonComplete } from "@/lib/progress";
import { toggleSaved, useSaved } from "@/lib/offline";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubjectIcon } from "@/components/app/SubjectIcon";
import { subjects } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/subjects/$subjectId")({
  validateSearch: (s: Record<string, unknown>): { topic?: string } => (typeof s['topic'] === "string" ? { topic: s['topic'] } : {}),
  loader: ({ params }) => {
    const subject = subjects.find((s) => s.id === params.subjectId);
    if (!subject) throw notFound();
    return { subject };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.subject.name} — Studia` },
          { name: "description", content: loaderData.subject.description },
          { property: "og:title", content: `${loaderData.subject.name} — Studia` },
          { property: "og:description", content: loaderData.subject.description },
        ]
      : [{ title: "Subject not found — Studia" }, { name: "robots", content: "noindex" }],
  }),
  component: SubjectPage,
});

const typeIcon = { PDF: FileText, Video: PlayCircle, Slides: Presentation };

function SubjectPage() {
  const { subject } = Route.useLoaderData();
  const search = Route.useSearch();
  const [topicId, setTopicId] = useState(search.topic ?? subject.topics[0]!.id);
  const saved = useSaved();
  const topic = subject.topics.find((t) => t.id === topicId) ?? subject.topics[0]!;
  const qc = useQueryClient();
  const { data: progress } = useQuery(progressQuery);
  const lessonKey = `${subject.id}/${topic.id}`;
  const done = !!progress?.lessons.some((l) => l.lesson_key === lessonKey);
  const toggleDone = useMutation({
    mutationFn: () => setLessonComplete(lessonKey, !done),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: progressQuery.queryKey });
      toast.success(done ? "Marked as not done" : "Lesson completed 🎉");
    },
    onError: () => toast.error("Couldn't update your progress. Try again."),
  });

  return (
    <div className="space-y-6 fade-up">
      <Link to="/subjects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All subjects
      </Link>
      <div className="flex items-center gap-4 rounded-3xl bg-hero p-6 text-primary-foreground">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-foreground/15">
          <SubjectIcon icon={subject.icon} className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{subject.name}</h1>
          <p className="text-sm opacity-80">{subject.instructor} · {subject.topics.length} topics</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="flex gap-2 overflow-x-auto lg:flex-col">
          {subject.topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setTopicId(t.id)}
              className={cn(
                "shrink-0 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors",
                t.id === topic.id ? "bg-primary text-primary-foreground shadow-elegant" : "bg-card shadow-card hover:bg-secondary",
              )}
            >
              {t.title}
            </button>
          ))}
        </aside>

        <article className="rounded-2xl bg-card p-5 shadow-card md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-2xl font-bold">{topic.title}</h2>
            <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleDone.mutate()}
              disabled={toggleDone.isPending}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-60",
                done ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground",
              )}
            >
              <CheckCircle2 className="h-4 w-4" /> {done ? "Completed" : "Mark complete"}
            </button>
            <SaveButton
              on={saved.includes(`${subject.id}/${topic.id}`)}
              onClick={() => {
                const on = toggleSaved(`${subject.id}/${topic.id}`, `/subjects/${subject.id}?topic=${topic.id}`);
                toast.success(on ? "Saved for offline" : "Removed from offline");
              }}
            />
            </div>
          </div>
          <p className="mt-1 text-muted-foreground">{topic.summary}</p>
          <Tabs defaultValue="explanation" className="mt-6">
            <TabsList className="bg-secondary">
              <TabsTrigger value="explanation">Explanation</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="solutions">Solutions</TabsTrigger>
            </TabsList>
            <TabsContent value="explanation" className="mt-5 space-y-4">
              {topic.explanation.map((p, i) => (
                <div key={i} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">{i + 1}</span>
                  <p className="leading-relaxed">{p}</p>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="materials" className="mt-5 grid gap-3 sm:grid-cols-2">
              {topic.materials.map((m) => {
                const I = typeIcon[m.type];
                return (
                  <div key={m.title} className="flex items-center gap-3 rounded-xl border p-4">
                    <I className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.type} · {m.size}</p>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </div>
                );
              })}
            </TabsContent>
            <TabsContent value="solutions" className="mt-5">
              <Accordion type="single" collapsible defaultValue="s0">
                {topic.solutions.map((s, i) => (
                  <AccordionItem key={i} value={`s${i}`}>
                    <AccordionTrigger className="text-left font-semibold">{s.problem}</AccordionTrigger>
                    <AccordionContent>
                      <ol className="space-y-3">
                        {s.steps.map((st, j) => (
                          <li key={j} className="flex gap-3">
                            <span className="text-xs font-bold uppercase text-primary">Step {j + 1}</span>
                            <span>{st}</span>
                          </li>
                        ))}
                      </ol>
                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-secondary p-3 font-semibold text-secondary-foreground">
                        <CheckCircle2 className="h-4 w-4 text-success" /> {s.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>
        </article>
      </div>
    </div>
  );
}

function SaveButton({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
        on ? "bg-success text-success-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground",
      )}
    >
      {on ? <CloudOff className="h-4 w-4" /> : <CloudDownload className="h-4 w-4" />}
      {on ? "Saved offline" : "Save for offline"}
    </button>
  );
}
