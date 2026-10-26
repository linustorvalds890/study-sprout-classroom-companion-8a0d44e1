import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Local calendar day key, YYYY-MM-DD. */
export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Streaks from activity dates. Current streak still counts if the last activity was yesterday. */
export function computeStreaks(dates: Date[], today = new Date()) {
  const days = new Set(dates.map(dayKey));
  const step = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  let cursor = days.has(dayKey(today)) ? today : step(today, -1);
  let current = 0;
  while (days.has(dayKey(cursor))) { current++; cursor = step(cursor, -1); }
  const sorted = [...days].sort();
  let best = 0, run = 0, prev: string | null = null;
  for (const k of sorted) {
    const [y, m, dd] = k.split("-").map(Number) as [number, number, number];
    run = prev && dayKey(step(new Date(y, m - 1, dd), -1)) === prev ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return { current, best, activeDays: days.size };
}

export const progressQuery = queryOptions({
  queryKey: ["progress"],
  queryFn: async () => {
    const [l, q] = await Promise.all([
      supabase.from("lesson_completions").select("lesson_key, completed_at").order("completed_at"),
      supabase.from("quiz_attempts").select("quiz_id, correct, total, percent, taken_at").order("taken_at"),
    ]);
    if (l.error) throw l.error;
    if (q.error) throw q.error;
    return { lessons: l.data, attempts: q.data };
  },
});

export async function setLessonComplete(key: string, done: boolean) {
  const r = done
    ? await supabase.from("lesson_completions").insert({ lesson_key: key })
    : await supabase.from("lesson_completions").delete().eq("lesson_key", key);
  if (r.error && r.error.code !== "23505") throw r.error;
}

export async function recordAttempt(a: { quiz_id: string; correct: number; total: number; percent: number }) {
  const { error } = await supabase.from("quiz_attempts").insert(a);
  if (error) throw error;
}
