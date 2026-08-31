
import type { Env } from "../types";
 
const MODEL = "@cf/google/gemma-4-26b-a4b-it" as const;
 
interface GemmaChatCompletion {
  choices?: Array<{
    message?: { content?: string };
  }>;
}
 
export async function runJargonModel(env: Env, systemPrompt: string): Promise<string> {
  const result = await env.AI.run(MODEL, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Rewrite this now." },
    ],
    max_tokens: 220,
    temperature: 0.65,
    chat_template_kwargs: {
      enable_thinking: false,
    },
  });
 
  const text = (result as GemmaChatCompletion).choices?.[0]?.message?.content;
  if (!text) {
    throw new Error(`Empty response from model. Raw result: ${JSON.stringify(result)}`);
  }
  return text;
}
 