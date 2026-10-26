import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { eventsQuery, subjectsQuery } from "@/lib/content";
import { eventTypes, type EventType } from "@/lib/data";
import { btn, btnDanger, Card, confirmDelete, field, Label, useSave } from "./shared";

const KEYS = [["events"]];

export function EventsAdmin() {
  const { data: events } = useSuspenseQuery(eventsQuery);
  const { data: subjects } = useSuspenseQuery(subjectsQuery);
  const save = useSave();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("class");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return toast.error("Title and date are required.");
    const startsAt = new Date(`${date}T${start || "00:00"}`);
    const endsAt = end ? new Date(`${date}T${end}`) : null;
    if (Number.isNaN(startsAt.getTime())) return toast.error("Please enter a valid date and time.");
    if (endsAt && endsAt < startsAt) return toast.error("End time must be after the start time.");
    setBusy(true);
    const ok = await save(() => supabase.from("events").insert({
      title: title.trim(), type, subject_id: subjectId || null,
      starts_at: startsAt.toISOString(), ends_at: endsAt?.toISOString() ?? null, location: location.trim(),
    }), "Added to the schedule", KEYS);
    setBusy(false);
    if (ok) { setTitle(""); setLocation(""); }
  }

  const upcoming = events.filter((e) => new Date(e.ends_at ?? e.starts_at).getTime() >= Date.now() - 86400000);
  const past = events.length - upcoming.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card title="Add to schedule">
        <form onSubmit={submit} className="space-y-3">
          <label className="block"><Label>Title</Label><input className={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><Label>Type</Label>
              <select className={field} value={type} onChange={(e) => setType(e.target.value as EventType)}>
                {eventTypes.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </label>
            <label className="block"><Label>Subject</Label>
              <select className={field} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">None</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
          </div>
          <label className="block"><Label>Date</Label><input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><Label>Starts</Label><input type="time" className={field} value={start} onChange={(e) => setStart(e.target.value)} /></label>
            <label className="block"><Label hint="(optional)">Ends</Label><input type="time" className={field} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
          </div>
          <label className="block"><Label hint="(optional)">Location</Label><input className={field} value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} /></label>
          <button className={btn} disabled={busy}><Plus className="h-4 w-4" />Add</button>
        </form>
      </Card>
      <Card title="Upcoming">
        {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Nothing scheduled.</p>}
        <ul className="divide-y">
          {upcoming.map((e) => {
            const d = new Date(e.starts_at);
            return (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <div className="flex-1">
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {e.type} · {d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    {e.subject_id && ` · ${subjects.find((s) => s.id === e.subject_id)?.name ?? ""}`}
                    {e.location && ` · ${e.location}`}
                  </p>
                </div>
                <button className={btnDanger} aria-label="Delete" onClick={async () => {
                  if (confirmDelete(`"${e.title}"`)) await save(() => supabase.from("events").delete().eq("id", e.id), "Removed", KEYS);
                }}><Trash2 className="h-4 w-4" /></button>
              </li>
            );
          })}
        </ul>
        {past > 0 && <p className="mt-3 text-xs text-muted-foreground">{past} past item{past === 1 ? "" : "s"} still show in students' calendars.</p>}
      </Card>
    </div>
  );
}
