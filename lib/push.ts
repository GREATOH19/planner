import webpush from "web-push";
import { loadState, saveState } from "./store";

let ready = false;
function init() {
  if (ready) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  ready = true;
}

export async function notifyAll(payload: { title: string; body: string; id?: string; url?: string }) {
  init();
  const s = await loadState();
  const alive: any[] = [];
  for (const sub of s.pushSubs) {
    try { await webpush.sendNotification(sub, JSON.stringify(payload)); alive.push(sub); }
    catch (e: any) { if (![404, 410].includes(e.statusCode)) alive.push(sub); }
  }
  s.pushSubs = alive;
  await saveState(s);
}
