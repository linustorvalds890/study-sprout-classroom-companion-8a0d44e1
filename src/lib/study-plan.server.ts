import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export type StudyPlanInput = {
  subject: string;
  goal: string;
  completed: string[];
  remaining: string[];
  quizzes: { title: string; percent: number; takenAt: string }[];
};

export class GatewayError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function generateStudyPlan(input: StudyPlanInput): Promise<string> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new GatewayError(401, "AI is not configured for this app yet.");

  let gatewayError: GatewayError | null = null;
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (url, init) => {
      const res = await fetch(url, init);
      if (!res.ok) {
        const body = await res.clone().text();
        console.error(`AI Gateway error [${res.status}]: ${body}`);
        let msg = body;
        try {
          const j = JSON.parse(body);
          msg = j?.error?.message ?? j?.message ?? body;
        } catch {}
        gatewayError = new GatewayError(res.status, msg || `Request failed (${res.status})`);
      }
      return res;
    },
  });

  const list = (xs: string[], empty: string) => (xs.length ? xs.map((x) => `- ${x}`).join("\n") : `- ${empty}`);
  const quizLines = input.quizzes.length
    ? input.quizzes.map((q) => `- ${q.title}: ${q.percent}% (${q.takenAt.slice(0, 10)})`).join("\n")
    : "- No quizzes taken yet.";

  const result = streamText({
    model: provider.responses(MODEL),
    maxRetries: 0,
    instructions:
      "You are a warm, encouraging study coach for students. Create a concise, practical, personalized study plan. Base it on the lessons they completed and their quiz scores. Use quiz scores to find weak spots (below 70% needs review, 70-85% needs practice, above 85% is solid). Format in Markdown with these sections: '## Where you stand', '## Your plan' (a numbered day-by-day plan for 7 days, 20-45 minutes each), '## Focus areas', '## Quick tip'. Keep it under 400 words.",
    messages: [
      {
        role: "user",
        content: `Subject: ${input.subject}\nMy learning goal: ${input.goal}\n\nCompleted lessons:\n${list(input.completed, "None yet.")}\n\nLessons not done yet:\n${list(input.remaining, "None — all done!")}\n\nQuiz attempts:\n${quizLines}`,
      },
    ],
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  } as Parameters<typeof streamText>[0]);

  let text = "";
  try {
    text = await result.text;
  } catch (e) {
    if (gatewayError) throw gatewayError;
    throw e;
  }
  if (gatewayError) throw gatewayError;
  if (!text.trim()) throw new GatewayError(422, "The AI couldn't create a plan for this request.");
  return text;
}
