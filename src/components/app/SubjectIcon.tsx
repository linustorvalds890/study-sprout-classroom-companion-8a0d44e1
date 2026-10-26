import { Atom, BookOpen, Calculator, Code2, FlaskConical, Globe2 } from "lucide-react";
import type { SubjectIconName } from "@/lib/data";

const map = { calculator: Calculator, atom: Atom, flask: FlaskConical, book: BookOpen, code: Code2, globe: Globe2 };

export function SubjectIcon({ icon, className }: { icon: SubjectIconName; className?: string }) {
  const I = map[icon] ?? BookOpen;
  return <I className={className} />;
}
