import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { createEvent } from "@/lib/google";

export async function POST(req: NextRequest) {
  const denied = guard(req); if (denied) return denied;
  const { blocks } = await req.json();
  for (const b of blocks) await createEvent({ title: `📚 ${b.title}`, start: b.start, end: b.end, description: b.reason });
  return NextResponse.json({ created: blocks.length });
}
