import { z } from "zod";
import { askJson } from "./claude";
import { getCanvasTasks } from "./canvas";
import { listEvents } from "./google";

const Block = z.object({
  title: z.string(), start: z.string(), end: z.string(), reason: z.string().optional(),
});
export const PlanSchema = z.object({ blocks: z.array(Block), summary: z.string() });
export type Plan = z.infer<typeof PlanSchema>;

export async function buildWeekPlan(weekStart = new Date()): Promise<Plan & { tasks: any[]; events: any[] }> {
  const from = new Date(weekStart);
  const to = new Date(from.getTime() + 7 * 864e5);
  const [tasks, events] = await Promise.all([getCanvasTasks(from, to), listEvents(from, to)]);

  const raw = await askJson<unknown>(
    `You are a weekly study/work planner. Timezone: ${process.env.TIMEZONE}.
Create focused work blocks (30-120 min) for the Canvas tasks, scheduled BEFORE each due date, in free time only.
Never overlap existing calendar events. Keep 22:30-08:00 free, leave meal breaks, spread load evenly, prefer harder tasks earlier.
Output: {"blocks":[{"title","start"(ISO with offset),"end","reason"}],"summary":"2-3 sentence Korean overview"}`,
    JSON.stringify({ now: new Date().toISOString(), from, to, canvasTasks: tasks, calendarEvents: events }),
  );
  return { ...PlanSchema.parse(raw), tasks, events };
}
