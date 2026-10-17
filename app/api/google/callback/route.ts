import { NextRequest, NextResponse } from "next/server";
import { oauthClient } from "@/lib/google";
import { loadState, saveState } from "@/lib/store";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const s = await loadState();
  if (!code || !state || state !== s.oauthNonce) return new NextResponse("invalid request", { status: 400 });
  const { tokens } = await oauthClient(`${req.nextUrl.origin}/api/google/callback`).getToken(code);
  if (!tokens.refresh_token) return new NextResponse("refresh token 없음 — Google 계정 보안 설정에서 앱 접근을 지우고 다시 시도하세요", { status: 400 });
  s.googleRefreshToken = tokens.refresh_token;
  s.oauthNonce = undefined;
  await saveState(s);
  return NextResponse.redirect(`${req.nextUrl.origin}/?google=ok`);
}
