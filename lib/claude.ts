import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
export const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
export const SCAN_MODEL = process.env.CLAUDE_SCAN_MODEL || "claude-haiku-5-5"; // 메일 분석은 저렴한 모델

/** Claude에게 JSON만 답하게 하고 파싱. */
export async function askJson<T>(system: string, user: string, maxTokens = 4000, model = MODEL): Promise<T> {
  const r = await client.messages.create({
    model, max_tokens: maxTokens, system: system + "\nRespond with valid JSON only, no prose, no code fences.",
    messages: [{ role: "user", content: user }],
  });
  const text = r.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  const json = text.replace(/^```(?:json)?\s*|\s*```$/g, "");
  return JSON.parse(json) as T;
}
