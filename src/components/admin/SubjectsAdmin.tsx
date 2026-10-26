import { useSuspenseQuery } from "@tanstack/react-query";
import { FileUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatSize, subjectsQuery, type Lesson, type Subject } from "@/lib/content";
import { subjectIcons, type Solution, type SubjectIconName } from "@/lib/data";
import { SubjectIcon } from "@/components/app/SubjectIcon";
import { cn } from "@/lib/utils";
import { btn, btnDanger, btnGhost, Card, confirmDelete, field, Label, useSave } from "./shared";

const KEYS = [subjectsQuery.queryKey as unknown as string[]];

export function SubjectsAdmin() {
  const { data: subjects } = useSuspenseQuery(subjectsQuery);
  const [selected, setSelected] = useState<string | null>(subjects[0]?.id ?? null);
  const subject = subjects.find((s) => s.id === selected) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <SubjectForm onSaved={(id) => setSelected(id)} />
        <Card title="Subjects">
          {subjects.length === 0 && <p className="text-sm text-muted-foreground">No subjects yet.</p>}
          <div className="space-y-1.5">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium",
                  s.id === selected ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                )}
              >
                <SubjectIcon icon={s.icon} className="h-4 w-4" />
                <span className="flex-1 truncate">{s.name}</span>
                <span className="text-xs opacity-70">{s.lessons.length}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
      {subject ? <SubjectDetail key={subject.id} subject={subject} onDeleted={() => setSelected(null)} /> : (
        <Card><p className="text-sm text-muted-foreground">Add a subject to start adding lessons and files.</p></Card>
      )}
    </div>
  );
}

function SubjectForm({ initial, onSaved, onCancel }: { initial?: Subject; onSaved?: (id: string) => void; onCancel?: () => void }) {
  const save = useSave();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [instructor, setInstructor] = useState(initial?.instructor ?? "");
  const [icon, setIcon] = useState<SubjectIconName>(initial?.icon ?? "book");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Subject name is required.");
    setBusy(true);
    const row = { name: name.trim(), description: description.trim(), instructor: instructor.trim(), icon };
    let id = initial?.id;
    const ok = await save(
      async () => {
        if (initial) return supabase.from("subjects").update(row).eq("id", initial.id);
        const r = await supabase.from("subjects").insert(row).select("id").single();
        id = r.data?.id;
        return r;
      },
      initial ? "Subject updated" : "Subject added",
      KEYS,
    );
    setBusy(false);
    if (ok) {
      if (!initial) { setName(""); setDescription(""); setInstructor(""); }
      if (id) onSaved?.(id);
    }
  }

  return (
    <Card title={initial ? "Edit subject" : "New subject"}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block"><Label>Name</Label><input className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></label>
        <label className="block"><Label hint="(optional)">Teacher</Label><input className={field} value={instructor} onChange={(e) => setInstructor(e.target.value)} maxLength={80} /></label>
        <label className="block"><Label hint="(optional)">Description</Label><textarea className={field} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} /></label>
        <div>
          <Label>Icon</Label>
          <div className="flex flex-wrap gap-1.5">
            {subjectIcons.map((i) => (
              <button type="button" key={i} aria-label={i} onClick={() => setIcon(i)}
                className={cn("grid h-9 w-9 place-items-center rounded-lg border", icon === i ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary")}>
                <SubjectIcon icon={i} className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button className={btn} disabled={busy}>{initial ? "Save" : <><Plus className="h-4 w-4" />Add subject</>}</button>
          {onCancel && <button type="button" className={btnGhost} onClick={onCancel}>Cancel</button>}
        </div>
      </form>
    </Card>
  );
}

function SubjectDetail({ subject, onDeleted }: { subject: Subject; onDeleted: () => void }) {
  const save = useSave();
  const [editing, setEditing] = useState(false);
  const [lessonId, setLessonId] = useState<string | "new" | null>(subject.lessons[0]?.id ?? "new");
  const lesson = subject.lessons.find((l) => l.id === lessonId);

  return (
    <div className="space-y-4">
      {editing ? (
        <SubjectForm initial={subject} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />
      ) : (
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><SubjectIcon icon={subject.icon} className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="text-lg font-bold">{subject.name}</p>
              <p className="text-sm text-muted-foreground">{subject.instructor || "No teacher set"} · {subject.lessons.length} lessons</p>
            </div>
            <button className={btnGhost} onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</button>
            <button className={btnDanger} onClick={async () => {
              if (!confirmDelete(`"${subject.name}" with all its lessons, files and quizzes`)) return;
              const paths = subject.lessons.flatMap((l) => l.materials.map((m) => m.file_path));
              if (paths.length) await supabase.storage.from("materials").remove(paths);
              if (await save(() => supabase.from("subjects").delete().eq("id", subject.id), "Subject deleted", [...KEYS, ["quizzes"]])) onDeleted();
            }}><Trash2 className="h-4 w-4" />Delete</button>
          </div>
        </Card>
      )}

      <Card title="Lessons">
        <div className="mb-4 flex flex-wrap gap-2">
          {subject.lessons.map((l) => (
            <button key={l.id} onClick={() => setLessonId(l.id)}
              className={cn("rounded-xl px-3 py-1.5 text-sm font-medium", l.id === lessonId ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80")}>
              {l.title}
            </button>
          ))}
          <button onClick={() => setLessonId("new")} className={cn("inline-flex items-center gap-1 rounded-xl border border-dashed px-3 py-1.5 text-sm font-medium", lessonId === "new" && "border-primary text-primary")}>
            <Plus className="h-4 w-4" />New lesson
          </button>
        </div>
        {lessonId === "new" ? (
          <LessonForm key="new" subjectId={subject.id} nextSort={subject.lessons.length} onSaved={(id) => setLessonId(id)} />
        ) : lesson ? (
          <div className="space-y-6">
            <LessonForm key={lesson.id} subjectId={subject.id} initial={lesson} nextSort={lesson.sort} onDeleted={() => setLessonId(subject.lessons.find((l) => l.id !== lesson.id)?.id ?? "new")} />
            <MaterialsEditor lesson={lesson} />
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function LessonForm({ subjectId, initial, nextSort, onSaved, onDeleted }: {
  subjectId: string; initial?: Lesson; nextSort: number; onSaved?: (id: string) => void; onDeleted?: () => void;
}) {
  const save = useSave();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");
  const [solutions, setSolutions] = useState<Solution[]>(initial?.solutions ?? []);
  const [busy, setBusy] = useState(false);

  const setSol = (i: number, patch: Partial<Solution>) => setSolutions((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error("Lesson title is required.");
    setBusy(true);
    const clean = solutions
      .map((s) => ({ problem: s.problem.trim(), answer: s.answer.trim(), steps: s.steps.map((x) => x.trim()).filter(Boolean) }))
      .filter((s) => s.problem);
    const row = { subject_id: subjectId, title: title.trim(), summary: summary.trim(), explanation: explanation.trim(), solutions: clean };
    let id = initial?.id;
    const ok = await save(async () => {
      if (initial) return supabase.from("lessons").update(row).eq("id", initial.id);
      const r = await supabase.from("lessons").insert({ ...row, sort: nextSort }).select("id").single();
      id = r.data?.id;
      return r;
    }, initial ? "Lesson saved" : "Lesson added", KEYS);
    setBusy(false);
    if (ok && id && !initial) onSaved?.(id);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block"><Label>Lesson title</Label><input className={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} /></label>
      <label className="block"><Label hint="(one line)">Summary</Label><input className={field} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={300} /></label>
      <label className="block"><Label hint="(each paragraph on its own line)">Explanation</Label><textarea className={field} rows={6} value={explanation} onChange={(e) => setExplanation(e.target.value)} /></label>

      <div>
        <Label>Worked solutions</Label>
        <div className="space-y-3">
          {solutions.map((s, i) => (
            <div key={i} className="space-y-2 rounded-xl border p-3">
              <div className="flex gap-2">
                <input className={field} placeholder="Problem" value={s.problem} onChange={(e) => setSol(i, { problem: e.target.value })} />
                <button type="button" aria-label="Remove solution" className={btnDanger} onClick={() => setSolutions((x) => x.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
              </div>
              <textarea className={field} rows={3} placeholder="Steps — one per line" value={s.steps.join("\n")} onChange={(e) => setSol(i, { steps: e.target.value.split("\n") })} />
              <input className={field} placeholder="Final answer" value={s.answer} onChange={(e) => setSol(i, { answer: e.target.value })} />
            </div>
          ))}
          <button type="button" className={btnGhost} onClick={() => setSolutions((x) => [...x, { problem: "", steps: [], answer: "" }])}><Plus className="h-4 w-4" />Add solution</button>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button className={btn} disabled={busy}>{initial ? "Save lesson" : "Add lesson"}</button>
        {initial && (
          <button type="button" className={btnDanger} onClick={async () => {
            if (!confirmDelete(`lesson "${initial.title}"`)) return;
            const paths = initial.materials.map((m) => m.file_path);
            if (paths.length) await supabase.storage.from("materials").remove(paths);
            if (await save(() => supabase.from("lessons").delete().eq("id", initial.id), "Lesson deleted", KEYS)) onDeleted?.();
          }}><Trash2 className="h-4 w-4" />Delete lesson</button>
        )}
      </div>
    </form>
  );
}

function MaterialsEditor({ lesson }: { lesson: Lesson }) {
  const save = useSave();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Choose a file first.");
    if (file.size > 50 * 1024 * 1024) return toast.error("Files must be 50 MB or smaller.");
    setBusy(true);
    const safe = file.name.replace(/[^\w.-]+/g, "_");
    const path = `${lesson.id}/${crypto.randomUUID()}-${safe}`;
    const up = await supabase.storage.from("materials").upload(path, file, { contentType: file.type || undefined });
    if (up.error) {
      setBusy(false);
      return toast.error(up.error.message);
    }
    const ok = await save(() => supabase.from("materials").insert({
      lesson_id: lesson.id, title: title.trim() || file.name, file_path: path, mime_type: file.type, size_bytes: file.size,
    }), "File uploaded", KEYS);
    if (!ok) await supabase.storage.from("materials").remove([path]);
    setBusy(false);
    if (ok) { setTitle(""); setFile(null); (e.target as HTMLFormElement).reset(); }
  }

  return (
    <div className="border-t pt-5">
      <p className="mb-3 font-semibold">Files for this lesson (PDFs, slides, videos)</p>
      <ul className="mb-4 space-y-2">
        {lesson.materials.length === 0 && <li className="text-sm text-muted-foreground">No files yet.</li>}
        {lesson.materials.map((m) => (
          <li key={m.id} className="flex items-center gap-3 rounded-xl border px-3 py-2 text-sm">
            <span className="flex-1 truncate font-medium">{m.title}</span>
            <span className="text-xs text-muted-foreground">{formatSize(m.size_bytes)}</span>
            <button className={btnDanger} aria-label="Delete file" onClick={async () => {
              if (!confirmDelete(`"${m.title}"`)) return;
              await supabase.storage.from("materials").remove([m.file_path]);
              await save(() => supabase.from("materials").delete().eq("id", m.id), "File deleted", KEYS);
            }}><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      <form onSubmit={upload} className="flex flex-col gap-2 sm:flex-row">
        <input className={field} placeholder="File title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="file" aria-label="Choose file" accept=".pdf,.ppt,.pptx,.doc,.docx,video/*,image/*" className={cn(field, "sm:max-w-64")} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button className={btn} disabled={busy}><FileUp className="h-4 w-4" />{busy ? "Uploading…" : "Upload"}</button>
      </form>
    </div>
  );
}
