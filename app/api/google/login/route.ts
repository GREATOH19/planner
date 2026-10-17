import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { guard } from "@/lib/auth";
import { GOOGLE_SCOPES, oauthClient } from "@/lib/google";
import { loadState, saveState } from "@/lib/store";

export async function GET(req: NextRequest) {
  const denied = guard(req); if (denied) return denied;
  const s = await loadState();
  s.oauthNonce = randomBytes(16).toString("hex");
  await saveState(s);
  const url = oauthClient(`${req.nextUrl.origin}/api/google/callback`).generateAuthUrl({
    access_type: "offline", prompt: "consent", scope: GOOGLE_SCOPES, state: s.oauthNonce,
  });
  return NextResponse.redirect(url);
}
