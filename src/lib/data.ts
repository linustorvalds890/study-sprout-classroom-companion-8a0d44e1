// Shared content types. All content itself lives in the database and is managed from the admin panel.

export type SubjectIconName = "calculator" | "atom" | "flask" | "book" | "code" | "globe";
export const subjectIcons: SubjectIconName[] = ["book", "calculator", "atom", "flask", "code", "globe"];

export type Solution = { problem: string; steps: string[]; answer: string };

export type Question =
  | { id: string; type: "mcq"; prompt: string; options: string[]; answer: number; explanation: string }
  | { id: string; type: "truefalse"; prompt: string; answer: boolean; explanation: string }
  | { id: string; type: "fill"; prompt: string; answer: string[]; explanation: string }
  | { id: string; type: "essay"; prompt: string; keywords: string[]; minWords: number; explanation: string };

export type EventType = "class" | "lecture" | "study" | "deadline" | "quiz";
export const eventTypes: EventType[] = ["class", "lecture", "study", "quiz", "deadline"];

export type AnnouncementKind = "news" | "quiz" | "material" | "schedule";
export const announcementKinds: AnnouncementKind[] = ["news", "quiz", "material", "schedule"];
