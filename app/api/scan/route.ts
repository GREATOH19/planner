import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { scanForEvents } from "@/lib/scan";

export const maxDuration = 60;
// 외부 크론(Vercel Cron / cron-job.org)이 하루 몇 번 호출
export async function GET(req: NextRequest) {
  const denied = guard(req); if (denied) return denied;
  try { return NextResponse.json({ found: await scanForEvents() }); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
