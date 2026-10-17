import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { guard } from "@/lib/auth";
import { GOOGLE_SCOPES, oauthClient } from "@/lib/google";
import { loadState, saveState } from "@/lib/store";

export async function GET(req: NextRequest) {
  const denied = guard(req); if (denied) return denied;
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 환경변수가 없어요" }, { status: 500 });
  const s = await loadState();
  s.oauthNonce = randomBytes(16).toString("hex");
  try { await saveState(s); } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  const url = oauthClient(`${req.nextUrl.origin}/api/google/callback`).generateAuthUrl({
    access_type: "offline", prompt: "consent", scope: GOOGLE_SCOPES, state: s.oauthNonce,
  });
  return NextResponse.redirect(url);
}
