import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { loadState, saveState } from "@/lib/store";
import { createEvent } from "@/lib/google";

export async function GET(req: NextRequest) {
  const denied = guard(req); if (denied) return denied;
  const s = await loadState();
  return NextResponse.json(s.suggestions.filter((x) => x.status === "pending" || x.status === "later"));
}

// body: { id, decision: "going" | "skipped" | "later" }
export async function POST(req: NextRequest) {
  const denied = guard(req); if (denied) return denied;
  const { id, decision } = await req.json();
  const s = await loadState();
  const sug = s.suggestions.find((x) => x.id === id);
  if (!sug) return NextResponse.json({ error: "not found" }, { status: 404 });
  sug.status = decision;
  if (decision === "going") {
    await createEvent({ title: `🎓 ${sug.title}`, start: sug.start, end: sug.end, location: sug.location, description: sug.link });
    s.prefs.liked.push(`${sug.kind}: ${sug.title}`);
  } else if (decision === "skipped") s.prefs.disliked.push(`${sug.kind}: ${sug.title}`);
  await saveState(s);
  return NextResponse.json({ ok: true });
}
