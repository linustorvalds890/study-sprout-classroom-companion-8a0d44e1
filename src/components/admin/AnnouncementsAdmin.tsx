import { useSuspenseQuery } from "@tanstack/react-query";
import { Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { announcementsQuery } from "@/lib/content";
import { announcementKinds, type AnnouncementKind } from "@/lib/data";
import { timeAgo } from "@/lib/notifications";
import { btn, btnDanger, Card, confirmDelete, field, Label, useSave } from "./shared";

const KEYS = [["announcements"]];
const kindLabel: Record<AnnouncementKind, string> = { news: "News", quiz: "Quiz", material: "New material", schedule: "Schedule change" };

export function AnnouncementsAdmin() {
  const { data } = useSuspenseQuery(announcementsQuery);
  const save = useSave();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<AnnouncementKind>("news");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required.");
    setBusy(true);
    const ok = await save(() => supabase.from("announcements").insert({ title: title.trim(), body: body.trim(), kind }), "Announcement sent to all students", KEYS);
    setBusy(false);
    if (ok) { setTitle(""); setBody(""); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card title="New announcement">
        <form onSubmit={submit} className="space-y-3">
          <label className="block"><Label>Type</Label>
            <select className={field} value={kind} onChange={(e) => setKind(e.target.value as AnnouncementKind)}>
              {announcementKinds.map((k) => <option key={k} value={k}>{kindLabel[k]}</option>)}
            </select>
          </label>
          <label className="block"><Label>Title</Label><input className={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} /></label>
          <label className="block"><Label>Message</Label><textarea className={field} rows={5} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} /></label>
          <button className={btn} disabled={busy}><Send className="h-4 w-4" />Publish</button>
        </form>
      </Card>
      <Card title="Published">
        {data.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
        <ul className="divide-y">
          {data.map((n) => (
            <li key={n.id} className="flex items-start gap-3 py-3">
              <div className="flex-1">
                <p className="font-medium">{n.title}</p>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{kindLabel[n.kind] ?? n.kind} · {timeAgo(n.created_at)}</p>
              </div>
              <button className={btnDanger} aria-label="Delete" onClick={async () => {
                if (confirmDelete(`"${n.title}"`)) await save(() => supabase.from("announcements").delete().eq("id", n.id), "Announcement deleted", KEYS);
              }}><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
