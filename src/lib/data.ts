export type Subject = {
  id: string;
  name: string;
  icon: "calculator" | "atom" | "flask" | "book" | "code" | "globe";
  description: string;
  progress: number;
  instructor: string;
  topics: Topic[];
};

export type Topic = {
  id: string;
  title: string;
  summary: string;
  explanation: string[];
  materials: { title: string; type: "PDF" | "Video" | "Slides"; size: string }[];
  solutions: { problem: string; steps: string[]; answer: string }[];
};

export const subjects: Subject[] = [
  {
    id: "mathematics",
    name: "Mathematics",
    icon: "calculator",
    description: "Algebra, calculus and statistics with worked examples.",
    progress: 72,
    instructor: "Dr. Sara Hassan",
    topics: [
      {
        id: "quadratic-equations",
        title: "Quadratic Equations",
        summary: "Solve ax² + bx + c = 0 using factoring and the quadratic formula.",
        explanation: [
          "A quadratic equation has the standard form ax² + bx + c = 0 where a ≠ 0.",
          "The discriminant Δ = b² − 4ac tells you how many real roots exist: two if Δ > 0, one if Δ = 0, none if Δ < 0.",
          "The quadratic formula x = (−b ± √Δ) / 2a works for every quadratic.",
        ],
        materials: [
          { title: "Quadratics cheat sheet", type: "PDF", size: "1.2 MB" },
          { title: "Lecture 4 recording", type: "Video", size: "42 min" },
        ],
        solutions: [
          {
            problem: "Solve x² − 5x + 6 = 0",
            steps: [
              "Find two numbers that multiply to 6 and add to −5: −2 and −3.",
              "Factor: (x − 2)(x − 3) = 0.",
              "Set each factor to zero: x − 2 = 0 or x − 3 = 0.",
            ],
            answer: "x = 2 or x = 3",
          },
          {
            problem: "Solve 2x² + 3x − 2 = 0",
            steps: [
              "a = 2, b = 3, c = −2 → Δ = 9 + 16 = 25.",
              "x = (−3 ± 5) / 4.",
              "x₁ = 2/4 = 0.5, x₂ = −8/4 = −2.",
            ],
            answer: "x = 0.5 or x = −2",
          },
        ],
      },
      {
        id: "derivatives",
        title: "Introduction to Derivatives",
        summary: "Rates of change, the power rule and basic differentiation.",
        explanation: [
          "The derivative measures how a function changes as its input changes.",
          "Power rule: d/dx (xⁿ) = n·xⁿ⁻¹.",
          "Derivatives of sums are sums of derivatives.",
        ],
        materials: [{ title: "Differentiation rules", type: "Slides", size: "24 slides" }],
        solutions: [
          {
            problem: "Differentiate f(x) = 3x⁴ − 2x² + 7",
            steps: ["Apply the power rule to 3x⁴ → 12x³.", "Apply it to −2x² → −4x.", "The constant 7 → 0."],
            answer: "f′(x) = 12x³ − 4x",
          },
        ],
      },
    ],
  },
  {
    id: "physics",
    name: "Physics",
    icon: "atom",
    description: "Mechanics, energy and waves explained step by step.",
    progress: 54,
    instructor: "Prof. Omar Khaled",
    topics: [
      {
        id: "newtons-laws",
        title: "Newton's Laws of Motion",
        summary: "Force, mass and acceleration in everyday systems.",
        explanation: [
          "1st law: an object stays at rest or in uniform motion unless acted on by a net force.",
          "2nd law: F = m·a.",
          "3rd law: every action has an equal and opposite reaction.",
        ],
        materials: [
          { title: "Mechanics notes", type: "PDF", size: "2.4 MB" },
          { title: "Lab demo: friction", type: "Video", size: "18 min" },
        ],
        solutions: [
          {
            problem: "A 5 kg box is pushed with 20 N on a frictionless floor. Find its acceleration.",
            steps: ["Use F = m·a.", "a = F / m = 20 / 5."],
            answer: "a = 4 m/s²",
          },
        ],
      },
    ],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    icon: "flask",
    description: "Atoms, bonding and reactions with lab guides.",
    progress: 38,
    instructor: "Dr. Mona Adel",
    topics: [
      {
        id: "mole-concept",
        title: "The Mole Concept",
        summary: "Converting between mass, moles and particles.",
        explanation: [
          "One mole contains 6.022 × 10²³ particles (Avogadro's number).",
          "moles = mass / molar mass.",
        ],
        materials: [{ title: "Stoichiometry workbook", type: "PDF", size: "3.1 MB" }],
        solutions: [
          {
            problem: "How many moles are in 36 g of water (H₂O)?",
            steps: ["Molar mass of H₂O = 2(1) + 16 = 18 g/mol.", "moles = 36 / 18."],
            answer: "2 mol",
          },
        ],
      },
    ],
  },
  {
    id: "computer-science",
    name: "Computer Science",
    icon: "code",
    description: "Algorithms, data structures and programming basics.",
    progress: 86,
    instructor: "Eng. Youssef Nabil",
    topics: [
      {
        id: "big-o",
        title: "Big-O Notation",
        summary: "Describing how algorithms scale with input size.",
        explanation: [
          "Big-O describes the upper bound of an algorithm's growth rate.",
          "Common classes: O(1), O(log n), O(n), O(n log n), O(n²).",
        ],
        materials: [{ title: "Complexity visualised", type: "Slides", size: "30 slides" }],
        solutions: [
          {
            problem: "What is the complexity of two nested loops over n items?",
            steps: ["The outer loop runs n times.", "For each, the inner loop runs n times.", "Total = n × n."],
            answer: "O(n²)",
          },
        ],
      },
    ],
  },
  {
    id: "english",
    name: "English Literature",
    icon: "book",
    description: "Reading, analysis and essay writing.",
    progress: 61,
    instructor: "Ms. Laila Samir",
    topics: [
      {
        id: "essay-structure",
        title: "Essay Structure",
        summary: "Thesis, body paragraphs and conclusion.",
        explanation: [
          "Open with a hook and a clear thesis statement.",
          "Each body paragraph makes one point supported by evidence.",
          "Conclude by restating the thesis in light of your arguments.",
        ],
        materials: [{ title: "Essay templates", type: "PDF", size: "0.8 MB" }],
        solutions: [
          {
            problem: "Write a thesis for an essay on technology in education.",
            steps: ["State the topic.", "Take a clear position.", "Preview your main reasons."],
            answer:
              "Technology improves education by personalising learning, widening access, and preparing students for the modern workforce.",
          },
        ],
      },
    ],
  },
  {
    id: "geography",
    name: "Geography",
    icon: "globe",
    description: "Climate, landforms and human geography.",
    progress: 25,
    instructor: "Mr. Karim Fathy",
    topics: [
      {
        id: "climate-zones",
        title: "Climate Zones",
        summary: "Tropical, dry, temperate, continental and polar climates.",
        explanation: ["Climate zones are determined mainly by latitude, altitude and ocean currents."],
        materials: [{ title: "World climate map", type: "PDF", size: "4.5 MB" }],
        solutions: [
          {
            problem: "Why is the equator hot all year?",
            steps: ["Sunlight hits the equator almost directly.", "Energy is concentrated over a smaller area."],
            answer: "Direct solar radiation year-round.",
          },
        ],
      },
    ],
  },
];

export type EventType = "class" | "lecture" | "study" | "deadline" | "quiz";
export type ScheduleEvent = {
  id: string;
  title: string;
  type: EventType;
  subject: string;
  dayOffset: number; // relative to today
  start: string;
  end: string;
  location: string;
};

export const events: ScheduleEvent[] = [
  { id: "e1", title: "Calculus lecture", type: "lecture", subject: "Mathematics", dayOffset: 0, start: "09:00", end: "10:30", location: "Hall A" },
  { id: "e2", title: "Physics lab", type: "class", subject: "Physics", dayOffset: 0, start: "12:00", end: "14:00", location: "Lab 3" },
  { id: "e3", title: "Group study: Chemistry", type: "study", subject: "Chemistry", dayOffset: 1, start: "16:00", end: "18:00", location: "Library" },
  { id: "e4", title: "Algebra quiz", type: "quiz", subject: "Mathematics", dayOffset: 2, start: "10:00", end: "10:30", location: "Online" },
  { id: "e5", title: "Essay submission", type: "deadline", subject: "English Literature", dayOffset: 3, start: "23:59", end: "23:59", location: "Portal" },
  { id: "e6", title: "Algorithms class", type: "class", subject: "Computer Science", dayOffset: 4, start: "11:00", end: "12:30", location: "Room 204" },
  { id: "e7", title: "Geography lecture", type: "lecture", subject: "Geography", dayOffset: 6, start: "09:30", end: "11:00", location: "Hall B" },
  { id: "e8", title: "Physics problem set due", type: "deadline", subject: "Physics", dayOffset: 8, start: "18:00", end: "18:00", location: "Portal" },
  { id: "e9", title: "CS mid-term quiz", type: "quiz", subject: "Computer Science", dayOffset: 10, start: "13:00", end: "14:00", location: "Online" },
  { id: "e10", title: "Revision session", type: "study", subject: "Mathematics", dayOffset: -2, start: "15:00", end: "17:00", location: "Room 101" },
];

export type Question =
  | { id: string; type: "mcq"; prompt: string; options: string[]; answer: number; explanation: string }
  | { id: string; type: "truefalse"; prompt: string; answer: boolean; explanation: string }
  | { id: string; type: "fill"; prompt: string; answer: string[]; explanation: string }
  | { id: string; type: "essay"; prompt: string; keywords: string[]; minWords: number; explanation: string };

export type Quiz = {
  id: string;
  title: string;
  subject: string;
  minutes: number;
  questions: Question[];
};

export const quizzes: Quiz[] = [
  {
    id: "math-fundamentals",
    title: "Algebra & Calculus Basics",
    subject: "Mathematics",
    minutes: 10,
    questions: [
      { id: "q1", type: "mcq", prompt: "What are the roots of x² − 5x + 6 = 0?", options: ["1 and 6", "2 and 3", "−2 and −3", "5 and 1"], answer: 1, explanation: "(x − 2)(x − 3) = 0 gives x = 2 or 3." },
      { id: "q2", type: "truefalse", prompt: "The derivative of a constant is zero.", answer: true, explanation: "Constants don't change, so their rate of change is 0." },
      { id: "q3", type: "fill", prompt: "The derivative of x³ is ____.", answer: ["3x²", "3x^2", "3x2"], explanation: "Power rule: 3·x³⁻¹ = 3x²." },
      { id: "q4", type: "mcq", prompt: "If Δ = b² − 4ac < 0, the equation has…", options: ["Two real roots", "One real root", "No real roots", "Infinite roots"], answer: 2, explanation: "A negative discriminant means no real solutions." },
      { id: "q5", type: "essay", prompt: "In a few sentences, explain what a derivative represents.", keywords: ["rate", "change", "slope"], minWords: 15, explanation: "A strong answer mentions the rate of change and the slope of the tangent line." },
    ],
  },
  {
    id: "physics-mechanics",
    title: "Newtonian Mechanics",
    subject: "Physics",
    minutes: 8,
    questions: [
      { id: "p1", type: "mcq", prompt: "Newton's second law is…", options: ["F = m/a", "F = m·a", "F = a/m", "F = m + a"], answer: 1, explanation: "Force equals mass times acceleration." },
      { id: "p2", type: "truefalse", prompt: "Heavier objects always fall faster in a vacuum.", answer: false, explanation: "Without air resistance, all objects accelerate at g." },
      { id: "p3", type: "fill", prompt: "The SI unit of force is the ____.", answer: ["newton", "n"], explanation: "1 N = 1 kg·m/s²." },
      { id: "p4", type: "essay", prompt: "Describe Newton's third law with an everyday example.", keywords: ["equal", "opposite", "reaction"], minWords: 12, explanation: "Mention equal and opposite forces, e.g. a rocket pushing exhaust down." },
    ],
  },
  {
    id: "cs-complexity",
    title: "Algorithms & Big-O",
    subject: "Computer Science",
    minutes: 6,
    questions: [
      { id: "c1", type: "mcq", prompt: "Binary search runs in…", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], answer: 1, explanation: "It halves the search space each step." },
      { id: "c2", type: "truefalse", prompt: "O(n log n) grows faster than O(n²).", answer: false, explanation: "n² grows faster than n log n." },
      { id: "c3", type: "fill", prompt: "A stack follows the ____ principle (acronym).", answer: ["lifo"], explanation: "Last In, First Out." },
    ],
  },
];

export type Notice = { id: string; title: string; body: string; time: string; kind: "quiz" | "material" | "schedule"; read: boolean };

export const initialNotices: Notice[] = [
  { id: "n1", title: "Quiz in 2 days", body: "Algebra quiz opens Wednesday at 10:00.", time: "10m ago", kind: "quiz", read: false },
  { id: "n2", title: "New study material", body: "Dr. Sara uploaded 'Quadratics cheat sheet'.", time: "1h ago", kind: "material", read: false },
  { id: "n3", title: "Room change", body: "Physics lab moved to Lab 3.", time: "Yesterday", kind: "schedule", read: true },
];
