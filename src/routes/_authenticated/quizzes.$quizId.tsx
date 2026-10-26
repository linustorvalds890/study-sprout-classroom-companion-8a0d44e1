import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Clock, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { progressQuery, recordAttempt } from "@/lib/progress";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { quizzes, type Question } from "@/lib/data";
import { isCorrect, scoreQuiz, type AnswerValue } from "@/lib/quiz";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/quizzes/$quizId")({
  loader: ({ params }) => {
    const quiz = quizzes.find((q) => q.id === params.quizId);
    if (!quiz) throw notFound();
    return { quiz };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.quiz.title} — Studia Quiz` },
          { name: "description", content: `${loaderData.quiz.questions.length}-question ${loaderData.quiz.subject} quiz.` },
          { property: "og:title", content: `${loaderData.quiz.title} — Studia Quiz` },
          { property: "og:description", content: `${loaderData.quiz.subject} quiz with instant feedback.` },
        ]
      : [{ title: "Quiz not found — Studia" }, { name: "robots", content: "noindex" }],
  }),
  component: QuizPlayer,
});

function QuizPlayer() {
  const { quiz } = Route.useLoaderData();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [left, setLeft] = useState(quiz.minutes * 60);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    if (left <= 0) { submit(); return; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, done]);

  const qc = useQueryClient();
  const submit = () => {
    setDone(true);
    const s = scoreQuiz(quiz.questions, answers);
    recordAttempt({ quiz_id: quiz.id, ...s })
      .then(() => qc.invalidateQueries({ queryKey: progressQuery.queryKey }))
      .catch(() => toast.error("Your score couldn't be saved to your progress."));
  };
  const reset = () => { setI(0); setAnswers({}); setLeft(quiz.minutes * 60); setDone(false); };
  const q = quiz.questions[i]!;
  const set = (v: AnswerValue) => setAnswers((a) => ({ ...a, [q.id]: v }));
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  if (done) {
    const s = scoreQuiz(quiz.questions, answers);
    return (
      <div className="mx-auto max-w-3xl space-y-6 fade-up">
        <div className="rounded-3xl bg-hero p-8 text-center text-primary-foreground">
          <p className="text-sm opacity-80">{left <= 0 ? "Time's up!" : "Quiz complete"}</p>
          <p className="mt-2 text-6xl font-extrabold">{s.percent}%</p>
          <p className="mt-2 opacity-90">{s.correct} of {s.total} correct</p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-semibold text-foreground"><RotateCcw className="h-4 w-4" />Retry</button>
            <Link to="/quizzes" className="rounded-xl border border-primary-foreground/30 px-4 py-2.5 text-sm font-semibold">All quizzes</Link>
          </div>
        </div>
        <h2 className="text-xl font-bold">Review</h2>
        {quiz.questions.map((qq, n) => {
          const ok = isCorrect(qq, answers[qq.id]);
          return (
            <div key={qq.id} className={cn("rounded-2xl border-l-4 bg-card p-5 shadow-card", ok ? "border-success" : "border-destructive")}>
              <div className="flex items-start gap-3">
                {ok ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" /> : <XCircle className="h-5 w-5 shrink-0 text-destructive" />}
                <div className="space-y-2">
                  <p className="font-semibold">{n + 1}. {qq.prompt}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Your answer: </span>{formatAnswer(qq, answers[qq.id])}</p>
                  {!ok && qq.type !== "essay" && <p className="text-sm"><span className="text-muted-foreground">Correct: </span><span className="font-medium text-success">{correctAnswer(qq)}</span></p>}
                  <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">{qq.explanation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const v = answers[q.id];
  return (
    <div className="mx-auto max-w-3xl space-y-6 fade-up">
      <div className="flex items-center justify-between">
        <Link to="/quizzes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Exit</Link>
        <div className={cn("flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-sm font-bold", left < 60 ? "bg-destructive text-destructive-foreground" : "bg-navy text-navy-foreground")}>
          <Clock className="h-4 w-4" />{mm}:{ss}
        </div>
      </div>
      <div>
        <div className="mb-2 flex justify-between text-sm text-muted-foreground">
          <span>{quiz.title}</span><span>Question {i + 1} / {quiz.questions.length}</span>
        </div>
        <Progress value={((i + 1) / quiz.questions.length) * 100} className="h-2" />
      </div>
      <div key={q.id} className="rounded-2xl bg-card p-6 shadow-card fade-up md:p-8">
        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          {{ mcq: "Multiple choice", truefalse: "True or false", fill: "Fill in the blank", essay: "Short essay" }[q.type]}
        </p>
        <h2 className="mt-2 text-xl font-bold">{q.prompt}</h2>
        <div className="mt-6">
          {q.type === "mcq" && (
            <div className="grid gap-3">
              {q.options.map((o, k) => (
                <Choice key={k} active={v === k} onClick={() => set(k)}>
                  <span className="mr-3 font-bold">{String.fromCharCode(65 + k)}.</span>{o}
                </Choice>
              ))}
            </div>
          )}
          {q.type === "truefalse" && (
            <div className="grid grid-cols-2 gap-3">
              <Choice active={v === true} onClick={() => set(true)}>True</Choice>
              <Choice active={v === false} onClick={() => set(false)}>False</Choice>
            </div>
          )}
          {q.type === "fill" && <Input value={(v as string) ?? ""} onChange={(e) => set(e.target.value)} placeholder="Type your answer" className="h-12 text-base" />}
          {q.type === "essay" && (
            <div>
              <Textarea value={(v as string) ?? ""} onChange={(e) => set(e.target.value)} rows={6} placeholder="Write your answer…" />
              <p className="mt-2 text-xs text-muted-foreground">
                {((v as string) ?? "").split(/\s+/).filter(Boolean).length} words · aim for at least {q.minWords}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between gap-3">
        <button disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-xl bg-card px-5 py-2.5 text-sm font-semibold shadow-card disabled:opacity-40">Previous</button>
        {i < quiz.questions.length - 1 ? (
          <button onClick={() => setI(i + 1)} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant">Next</button>
        ) : (
          <button onClick={submit} className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-navy-foreground">Submit quiz</button>
        )}
      </div>
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border-2 px-4 py-3.5 text-left font-medium transition-all",
        active ? "border-primary bg-secondary text-secondary-foreground" : "border-border hover:border-primary/50",
      )}
    >
      {children}
    </button>
  );
}

function formatAnswer(q: Question, a: AnswerValue) {
  if (a === undefined || a === "") return <em className="text-muted-foreground">No answer</em>;
  if (q.type === "mcq") return q.options[a as number];
  if (q.type === "truefalse") return a ? "True" : "False";
  return String(a);
}

function correctAnswer(q: Question) {
  if (q.type === "mcq") return q.options[q.answer];
  if (q.type === "truefalse") return q.answer ? "True" : "False";
  if (q.type === "fill") return q.answer[0];
  return "";
}
