import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { events, type EventType } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule & Timetable — Studia" },
      { name: "description", content: "Classes, lectures, study sessions and deadlines in one calendar." },
      { property: "og:title", content: "Schedule & Timetable — Studia" },
      { property: "og:description", content: "Classes, lectures, study sessions and deadlines in one calendar." },
    ],
  }),
  component: SchedulePage,
});

const typeStyle: Record<EventType, string> = {
  class: "bg-primary text-primary-foreground",
  lecture: "bg-navy text-navy-foreground",
  study: "bg-success text-success-foreground",
  deadline: "bg-destructive text-destructive-foreground",
  quiz: "bg-warning text-foreground",
};

const dayKey = (d: Date) => d.toDateString();

function SchedulePage() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  const [month, setMonth] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<EventType | "all">("all");

  const dated = useMemo(() => {
    if (!today) return [];
    return events
      .filter((e) => filter === "all" || e.type === filter)
      .map((e) => {
        const d = new Date(today);
        d.setDate(d.getDate() + e.dayOffset);
        return { ...e, date: d };
      });
  }, [today, filter]);

  if (!today) return <div className="h-96 animate-pulse rounded-2xl bg-card" />;

  const view = new Date(today.getFullYear(), today.getMonth() + month, 1);
  const startPad = view.getDay();
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [...Array(startPad).fill(null), ...Array.from({ length: days }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))];
  const sel = selected ?? dayKey(today);
  const dayEvents = dated.filter((e) => dayKey(e.date) === sel).sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground">Tap a day to see what's planned.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["all", "class", "lecture", "study", "quiz", "deadline"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition-colors",
              filter === t ? "bg-primary text-primary-foreground" : "bg-card shadow-card hover:bg-secondary",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl bg-card p-4 shadow-card md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{view.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
            <div className="flex gap-1">
              <button aria-label="Previous month" onClick={() => setMonth(month - 1)} className="rounded-lg p-2 hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
              <button aria-label="Next month" onClick={() => setMonth(month + 1)} className="rounded-lg p-2 hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const k = dayKey(d);
              const evs = dated.filter((e) => dayKey(e.date) === k);
              return (
                <button
                  key={i}
                  onClick={() => setSelected(k)}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-start gap-1 rounded-xl p-1 text-sm transition-colors md:aspect-auto md:min-h-20 md:items-start md:p-2",
                    k === sel ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                    k === dayKey(today) && k !== sel && "ring-2 ring-primary",
                  )}
                >
                  <span className="font-semibold">{d.getDate()}</span>
                  <div className="flex flex-wrap gap-0.5 md:w-full md:flex-col">
                    {evs.map((e) => (
                      <span key={e.id} className={cn("h-1.5 w-1.5 rounded-full md:h-auto md:w-full md:truncate md:rounded md:px-1 md:text-left md:text-[10px]", typeStyle[e.type])}>
                        <span className="hidden md:inline">{e.title}</span>
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h2 className="font-bold">{new Date(sel).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</h2>
          <div className="mt-4 space-y-3">
            {dayEvents.length === 0 && <p className="text-sm text-muted-foreground">Nothing scheduled. Enjoy the free time!</p>}
            {dayEvents.map((e) => (
              <div key={e.id} className="rounded-xl border p-4">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", typeStyle[e.type])}>{e.type}</span>
                <p className="mt-2 font-semibold">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.subject}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{e.start === e.end ? `Due ${e.end}` : `${e.start} – ${e.end}`}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
