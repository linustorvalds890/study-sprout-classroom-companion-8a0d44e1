import { Link, useNavigate, useRouteContext, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/lib/theme";
import { Bell, BookOpen, CalendarDays, GraduationCap, LayoutDashboard, ListChecks, LogOut, Menu, TrendingUp, WifiOff, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { setupOffline, useOnline } from "@/lib/offline";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/quizzes", label: "Quizzes", icon: ListChecks },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/notifications", label: "Alerts", icon: Bell },
] as const;

function isActive(path: string, to: string) {
  return path.startsWith(to);
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const online = useOnline();
  useEffect(() => {
    void setupOffline();
  }, []);

  const links = (
    <nav className="flex flex-col gap-1">
      {nav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(path, to)
              ? "bg-primary text-primary-foreground shadow-elegant"
              : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <Icon className="h-4.5 w-4.5" />
          {label}
        </Link>
      ))}
    </nav>
  );

  const brand = (
    <Link to="/dashboard" className="flex items-center gap-2.5 px-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <GraduationCap className="h-5 w-5" />
      </div>
      <span className="text-lg font-bold tracking-tight text-sidebar-accent-foreground">Studia</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-8 bg-sidebar p-5 lg:flex">
        {brand}
        {links}
        <div className="mt-auto rounded-2xl bg-sidebar-accent p-4 text-sm text-sidebar-foreground">
          <p className="font-semibold text-sidebar-accent-foreground">Install Studia</p>
          <p className="mt-1 text-xs opacity-80">Use "Add to Home Screen" in your browser menu to get the app on your phone.</p>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy/60" onClick={() => setOpen(false)} />
          <aside className="fade-up absolute inset-y-0 left-0 flex w-72 flex-col gap-8 bg-sidebar p-5">
            <div className="flex items-center justify-between">
              {brand}
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="text-sidebar-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            {links}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <button aria-label="Open menu" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
          <NotificationBell />
          <UserMenu />
        </header>
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-navy px-4 py-2 text-center text-sm text-navy-foreground">
            <WifiOff className="h-4 w-4" /> You're offline — saved lessons are still available.
          </div>
        )}
        <main className="mx-auto max-w-7xl px-4 py-6 pb-24 md:px-8 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-card lg:hidden">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
              isActive(path, to) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function NotificationBell() {
  const { notices, unread, markAllRead } = useNotifications();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-secondary">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-semibold">Notifications</p>
          <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button>
        </div>
        <ul className="max-h-80 overflow-auto">
          {notices.slice(0, 6).map((n) => (
            <li key={n.id} className={cn("border-b px-4 py-3 last:border-0", !n.read && "bg-secondary/60")}>
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{n.time}</p>
            </li>
          ))}
        </ul>
        <Link to="/notifications" className="block border-t px-4 py-2.5 text-center text-sm font-medium text-primary">
          Notification settings
        </Link>
      </PopoverContent>
    </Popover>
  );
}

function UserMenu() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const meta = user.user_metadata as { full_name?: string; avatar_url?: string };
  const name = meta.full_name ?? user.email ?? "Student";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button aria-label="Account" className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {meta.avatar_url ? <img src={meta.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : initials}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <p className="truncate font-semibold">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        <Button variant="outline" className="mt-4 w-full" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </PopoverContent>
    </Popover>
  );
}
