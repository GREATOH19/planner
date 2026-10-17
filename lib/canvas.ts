import ical from "node-ical";

export type Task = { title: string; course?: string; due: string; url?: string; pointsPossible?: number };

export async function getCanvasTasks(from: Date, to: Date): Promise<Task[]> {
  const { CANVAS_BASE_URL, CANVAS_TOKEN, CANVAS_ICS_URL } = process.env;
  if (CANVAS_BASE_URL && CANVAS_TOKEN) {
    const url = `${CANVAS_BASE_URL}/api/v1/planner/items?start_date=${from.toISOString()}&end_date=${to.toISOString()}&per_page=100`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${CANVAS_TOKEN}` } });
    if (!res.ok) throw new Error(`Canvas ${res.status}`);
    const items: any[] = await res.json();
    return items
      .filter((i) => i.plannable?.due_at || i.plannable_date)
      .map((i) => ({
        title: i.plannable?.title ?? "Untitled",
        course: i.context_name,
        due: i.plannable?.due_at ?? i.plannable_date,
        url: i.html_url ? `${CANVAS_BASE_URL}${i.html_url}` : undefined,
        pointsPossible: i.plannable?.points_possible ?? undefined,
      }));
  }
  if (CANVAS_ICS_URL) {
    const data = await ical.async.fromURL(CANVAS_ICS_URL);
    return Object.values(data)
      .filter((e: any) => e.type === "VEVENT" && e.start >= from && e.start <= to)
      .map((e: any) => ({ title: String(e.summary), due: new Date(e.start).toISOString(), url: e.url }));
  }
  return [];
}
