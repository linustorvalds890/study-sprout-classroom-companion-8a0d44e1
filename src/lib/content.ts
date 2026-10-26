import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AnnouncementKind, EventType, Question, Solution, SubjectIconName } from "./data";

export type Material = { id: string; lesson_id: string; title: string; file_path: string; mime_type: string; size_bytes: number };
export type Lesson = {
  id: string;
  subject_id: string;
  title: string;
  summary: string;
  explanation: string;
  solutions: Solution[];
  sort: number;
  materials: Material[];
};
export type Subject = {
  id: string;
  name: string;
  description: string;
  icon: SubjectIconName;
  instructor: string;
  sort: number;
  lessons: Lesson[];
};
export type Quiz = { id: string; subject_id: string; title: string; minutes: number; questions: Question[] };
export type StudyEvent = {
  id: string;
  title: string;
  type: EventType;
  subject_id: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string;
};
export type Announcement = { id: string; title: string; body: string; kind: AnnouncementKind; created_at: string };

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort;

export const subjectsQuery = queryOptions({
  queryKey: ["subjects"],
  queryFn: async (): Promise<Subject[]> => {
    const { data, error } = await supabase
      .from("subjects")
      .select("*, lessons(*, materials(*))")
      .order("sort")
      .order("created_at");
    if (error) throw error;
    return (data as unknown as Subject[]).map((s) => ({
      ...s,
      lessons: [...s.lessons].sort(bySort).map((l) => ({ ...l, solutions: (l.solutions ?? []) as Solution[] })),
    }));
  },
});

export const quizzesQuery = queryOptions({
  queryKey: ["quizzes"],
  queryFn: async (): Promise<Quiz[]> => {
    const { data, error } = await supabase.from("quizzes").select("*").order("created_at");
    if (error) throw error;
    return data as unknown as Quiz[];
  },
});

export const eventsQuery = queryOptions({
  queryKey: ["events"],
  queryFn: async (): Promise<StudyEvent[]> => {
    const { data, error } = await supabase.from("events").select("*").order("starts_at");
    if (error) throw error;
    return data as StudyEvent[];
  },
});

export const announcementsQuery = queryOptions({
  queryKey: ["announcements"],
  queryFn: async () => {
    const [a, r] = await Promise.all([
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("announcement_reads").select("announcement_id"),
    ]);
    if (a.error) throw a.error;
    if (r.error) throw r.error;
    const read = new Set(r.data.map((x) => x.announcement_id));
    return (a.data as Announcement[]).map((n) => ({ ...n, read: read.has(n.id) }));
  },
});

export const isAdminQuery = queryOptions({
  queryKey: ["is-admin"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("is_admin");
    if (error) throw error;
    return !!data;
  },
});

export async function markAnnouncementsRead(ids: string[]) {
  if (!ids.length) return;
  const { error } = await supabase
    .from("announcement_reads")
    .upsert(ids.map((announcement_id) => ({ announcement_id })), { onConflict: "user_id,announcement_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function materialUrl(path: string) {
  const { data, error } = await supabase.storage.from("materials").createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function subjectProgress(subject: Subject, completedKeys: Set<string>) {
  if (!subject.lessons.length) return 0;
  return Math.round((subject.lessons.filter((l) => completedKeys.has(l.id)).length / subject.lessons.length) * 100);
}
