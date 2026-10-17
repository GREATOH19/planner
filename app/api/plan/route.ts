import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { buildWeekPlan } from "@/lib/planner";

export const maxDuration = 60;
export async function GET(req: NextRequest) {
  const denied = guard(req); if (denied) return denied;
  try { return NextResponse.json(await buildWeekPlan()); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
