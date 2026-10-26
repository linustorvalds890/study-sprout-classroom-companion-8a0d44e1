import { Atom, BookOpen, Calculator, Code2, FlaskConical, Globe2 } from "lucide-react";
import type { Subject } from "@/lib/data";

const map = { calculator: Calculator, atom: Atom, flask: FlaskConical, book: BookOpen, code: Code2, globe: Globe2 };

export function SubjectIcon({ icon, className }: { icon: Subject["icon"]; className?: string }) {
  const I = map[icon];
  return <I className={className} />;
}
