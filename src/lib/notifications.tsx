import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { initialNotices, type Notice } from "./data";

type Ctx = {
  notices: Notice[];
  unread: number;
  permission: NotificationPermission | "unsupported";
  requestPermission: () => Promise<void>;
  push: (n: Omit<Notice, "id" | "time" | "read">) => void;
  markAllRead: () => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [permission, setPermission] = useState<Ctx["permission"]>("default");
  useEffect(() => {
    setPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      toast.error("This browser doesn't support notifications");
      return;
    }
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === "granted") toast.success("Notifications enabled");
  }, []);

  const push = useCallback<Ctx["push"]>((n) => {
    setNotices((prev) => [{ ...n, id: crypto.randomUUID(), time: "Just now", read: false }, ...prev]);
    toast(n.title, { description: n.body });
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(n.title, { body: n.body, icon: "/icon-192.png" });
      } catch {
        /* some mobile browsers only allow notifications via service worker */
      }
    }
  }, []);

  const markAllRead = useCallback(() => setNotices((p) => p.map((n) => ({ ...n, read: true }))), []);

  return (
    <NotificationsContext.Provider
      value={{ notices, unread: notices.filter((n) => !n.read).length, permission, requestPermission, push, markAllRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const c = useContext(NotificationsContext);
  if (!c) throw new Error("useNotifications must be used inside NotificationsProvider");
  return c;
}
