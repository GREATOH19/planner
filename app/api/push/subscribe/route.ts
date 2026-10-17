import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { loadState, saveState } from "@/lib/store";

export async function POST(req: NextRequest) {
  const denied = guard(req); if (denied) return denied;
  const sub = await req.json();
  const s = await loadState();
  if (!s.pushSubs.some((x) => x.endpoint === sub.endpoint)) s.pushSubs.push(sub);
  await saveState(s);
  return NextResponse.json({ ok: true });
}
