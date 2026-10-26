import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarDays, GraduationCap, ListChecks, Loader2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import cover from "@/assets/cover.jpg";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/lib/theme";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Studia — Your study space, anywhere" },
      { name: "description", content: "Lessons, step-by-step solutions, schedules and timed quizzes. Sign in with Google to start." },
      { property: "og:title", content: "Studia — Your study space, anywhere" },
      { property: "og:description", content: "Lessons, step-by-step solutions, schedules and timed quizzes. Sign in with Google to start." },
    ],
  }),
  component: Cover,
});

const features = [
  { icon: GraduationCap, label: "Lessons & solutions" },
  { icon: CalendarDays, label: "Smart schedule" },
  { icon: ListChecks, label: "Timed quizzes" },
  { icon: WifiOff, label: "Works offline" },
];

function Cover() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const signIn = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setLoading(false);
      toast.error("Google sign-in didn't complete. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative flex flex-col px-6 py-6 md:px-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">Studia</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="fade-up my-auto max-w-lg py-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Your study space</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Learn smarter. <span className="text-primary">Stay on track.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Lessons, step-by-step solutions, your timetable and quizzes with instant feedback — all in one place.
          </p>

          <button
            onClick={signIn}
            disabled={loading}
            className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-card px-5 py-3.5 font-semibold text-card-foreground shadow-card ring-1 ring-border transition hover:shadow-elegant disabled:opacity-60 sm:w-auto"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleMark />}
            Continue with Google
          </button>

          <ul className="mt-10 grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-primary"><Icon className="h-4 w-4" /></span>
                {label}
              </li>
            ))}
          </ul>
        </main>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Studia</p>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <img src={cover} alt="Student studying with glowing study cards" width={1280} height={1280} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/20 to-transparent" />
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
