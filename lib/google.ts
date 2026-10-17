import { google } from "googleapis";
import { loadState } from "./store";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.readonly",
];

export function oauthClient(redirectUri?: string) {
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUri);
}

/** 앱에서 로그인해 저장된 refresh token(우선) 또는 환경변수 토큰으로 인증. */
export async function authClient() {
  const token = (await loadState()).googleRefreshToken || process.env.GOOGLE_REFRESH_TOKEN;
  if (!token) throw new Error("Google 로그인이 필요해요 (앱에서 'Google 연결' 버튼)");
  const c = oauthClient();
  c.setCredentials({ refresh_token: token });
  return c;
}
const calId = () => process.env.GOOGLE_CALENDAR_ID || "primary";

export type CalEvent = { id?: string; title: string; start: string; end: string; allDay?: boolean };

export async function listEvents(from: Date, to: Date): Promise<CalEvent[]> {
  const cal = google.calendar({ version: "v3", auth: await authClient() });
  const r = await cal.events.list({
    calendarId: calId(), timeMin: from.toISOString(), timeMax: to.toISOString(),
    singleEvents: true, orderBy: "startTime", maxResults: 250,
  });
  return (r.data.items ?? []).map((e) => ({
    id: e.id!, title: e.summary ?? "(busy)",
    start: (e.start?.dateTime ?? e.start?.date)!, end: (e.end?.dateTime ?? e.end?.date)!,
    allDay: !e.start?.dateTime,
  }));
}

export async function createEvent(e: { title: string; start: string; end: string; description?: string; location?: string }) {
  const cal = google.calendar({ version: "v3", auth: await authClient() });
  const tz = process.env.TIMEZONE;
  await cal.events.insert({
    calendarId: calId(),
    requestBody: {
      summary: e.title, description: e.description, location: e.location,
      start: { dateTime: e.start, timeZone: tz }, end: { dateTime: e.end, timeZone: tz },
    },
  });
}

export type MailLite = { id: string; from: string; subject: string; date: string; body: string };

export async function recentMail(days = 3, max = 40): Promise<MailLite[]> {
  const gm = google.gmail({ version: "v1", auth: await authClient() });
  const q = `newer_than:${days}d (webinar OR "info session" OR "information session" OR workshop OR "career fair" OR invitation OR RSVP OR panel)`;
  const list = await gm.users.messages.list({ userId: "me", q, maxResults: max });
  const out: MailLite[] = [];
  for (const m of list.data.messages ?? []) {
    const f = await gm.users.messages.get({ userId: "me", id: m.id!, format: "full" });
    const h = (n: string) => f.data.payload?.headers?.find((x) => x.name === n)?.value ?? "";
    out.push({ id: m.id!, from: h("From"), subject: h("Subject"), date: h("Date"), body: extractText(f.data.payload).slice(0, 4000) });
  }
  return out;
}

function extractText(p: any): string {
  if (!p) return "";
  if (p.mimeType === "text/plain" && p.body?.data) return Buffer.from(p.body.data, "base64").toString("utf8");
  for (const part of p.parts ?? []) { const t = extractText(part); if (t) return t; }
  if (p.mimeType === "text/html" && p.body?.data)
    return Buffer.from(p.body.data, "base64").toString("utf8").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  return "";
}
