import { NextRequest, NextResponse } from "next/server";

export function guard(req: NextRequest): NextResponse | null {
  const key = req.headers.get("x-app-key") ?? req.nextUrl.searchParams.get("key");
  const cron = req.headers.get("authorization");
  const ok =
    (process.env.APP_KEY && key === process.env.APP_KEY) ||
    (process.env.CRON_SECRET && cron === `Bearer ${process.env.CRON_SECRET}`); // Vercel Cron
  return ok ? null : NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
