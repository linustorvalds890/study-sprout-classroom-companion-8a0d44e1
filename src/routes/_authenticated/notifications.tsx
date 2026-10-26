import { createFileRoute } from "@tanstack/react-router";
import { BellRing, CalendarClock, FileText, ListChecks, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Alerts & Notifications — Studia" },
      { name: "description", content: "Reminders for quizzes, new materials and schedule changes." },
      { property: "og:title", content: "Alerts & Notifications — Studia" },
      { property: "og:description", content: "Reminders for quizzes, new materials and schedule changes." },
    ],
  }),
  component: NotificationsPage,
});

const icons = { quiz: ListChecks, material: FileText, schedule: CalendarClock, news: Megaphone };

function NotificationsPage() {
  const { notices, permission, requestPermission, markAllRead } = useNotifications();
  return (
    <div className="mx-auto max-w-3xl space-y-6 fade-up">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground">Stay on top of quizzes, materials and schedule changes.</p>
      </div>

      <div className="rounded-2xl bg-navy p-6 text-navy-foreground">
        <div className="flex items-start gap-4">
          <BellRing className="h-6 w-6 shrink-0 text-primary-glow" />
          <div className="flex-1">
            <p className="font-semibold">Device notifications</p>
            <p className="text-sm opacity-75">
              {permission === "granted" && "Enabled — you'll get alerts on this device."}
              {permission === "denied" && "Blocked. Allow notifications in your browser settings."}
              {permission === "default" && "Allow alerts so you never miss a quiz or deadline."}
              {permission === "unsupported" && "This browser doesn't support notifications. Alerts will show inside the app."}
            </p>
          </div>
          {permission === "default" && <Button onClick={requestPermission}>Enable</Button>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Inbox</h2>
        <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button>
      </div>
      <ul className="space-y-3">
        {notices.length === 0 && <li className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card">No announcements yet.</li>}
        {notices.map((n) => {
          const I = icons[n.kind] ?? Megaphone;
          return (
            <li key={n.id} className={cn("flex gap-4 rounded-2xl bg-card p-4 shadow-card", !n.read && "ring-2 ring-primary/30")}>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><I className="h-5 w-5" /></div>
              <div className="flex-1">
                <p className="font-semibold">{n.title}</p>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{n.body}</p>
              </div>
              <span className="text-xs text-muted-foreground">{n.time}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
