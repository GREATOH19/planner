import { z } from "zod";
import { askJson, SCAN_MODEL } from "./claude";
import { recentMail } from "./google";
import { loadState, saveState, Suggestion } from "./store";
import { notifyAll } from "./push";

const Found = z.object({
  items: z.array(z.object({
    id: z.string(), title: z.string(),
    kind: z.enum(["webinar", "info_session", "career", "school", "other"]),
    start: z.string(), end: z.string(),
    location: z.string().optional(), link: z.string().optional(), reason: z.string(),
    relevance: z.number().min(0).max(1),
  })),
});

export async function scanForEvents() {
  const s = await loadState();
  const mails = (await recentMail()).filter((m) => !s.seenMessageIds.includes(m.id));
  if (!mails.length) return [];

  const raw = await askJson<unknown>(
    `Extract real upcoming webinars / info sessions / career or school events a university student might attend from these emails.
Skip newsletters without a concrete date, past events, receipts, spam. Timezone ${process.env.TIMEZONE}. If end is missing assume 1 hour.
"id" must be the email id. "reason" = one short Korean sentence on why it may be worth attending.
User liked: ${JSON.stringify(s.prefs.liked.slice(-20))}; disliked: ${JSON.stringify(s.prefs.disliked.slice(-20))}.
Output {"items":[{id,title,kind,start,end,location?,link?,reason,relevance(0-1)}]}`,
    JSON.stringify({ now: new Date().toISOString(), mails }),
    6000, SCAN_MODEL,
  );
  const found = Found.parse(raw).items.filter((i) => i.relevance >= 0.4 && new Date(i.start) > new Date());

  const fresh: Suggestion[] = found
    .filter((i) => !s.suggestions.some((x) => x.id === i.id))
    .map(({ relevance, ...i }) => ({ ...i, status: "pending" as const }));

  s.suggestions.push(...fresh);
  s.seenMessageIds.push(...mails.map((m) => m.id));
  s.seenMessageIds = s.seenMessageIds.slice(-1000);
  await saveState(s);

  for (const f of fresh) {
    await notifyAll({ title: `🎓 ${f.title}`, body: `${new Date(f.start).toLocaleString()} · ${f.reason}`, id: f.id, url: "/" });
  }
  return fresh;
}
