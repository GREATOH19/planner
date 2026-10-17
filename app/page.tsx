"use client";
import { useEffect, useState, useCallback } from "react";

type Block = { title: string; start: string; end: string; reason?: string };
type Sug = { id: string; title: string; kind: string; start: string; end: string; location?: string; link?: string; reason: string };

const card: React.CSSProperties = { background: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10 };
const btn = (bg: string): React.CSSProperties => ({ background: bg, color: "#fff", border: 0, borderRadius: 8, padding: "10px 14px", fontSize: 15, marginRight: 8 });
const fmt = (s: string) => new Date(s).toLocaleString("ko-KR", { month: "short", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });

export default function Home() {
  const [key, setKey] = useState("");
  const [plan, setPlan] = useState<{ blocks: Block[]; summary: string } | null>(null);
  const [sugs, setSugs] = useState<Sug[]>([]);
  const [busy, setBusy] = useState("");

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const r = await fetch(path, { ...init, headers: { "x-app-key": key.trim(), "content-type": "application/json" } });
    const j = await r.json(); if (!r.ok) throw new Error(j.error); return j;
  }, [key]);

  useEffect(() => { setKey(localStorage.getItem("appKey") ?? ""); }, []);
  const loadSugs = useCallback(() => key && api("/api/suggestions").then(setSugs).catch(() => {}), [key, api]);
  useEffect(() => { loadSugs(); }, [loadSugs]);

  const decide = useCallback(async (id: string, decision: string) => {
    await api("/api/suggestions", { method: "POST", body: JSON.stringify({ id, decision }) });
    loadSugs();
  }, [api, loadSugs]);

  useEffect(() => {
    const h = (e: MessageEvent) => e.data?.type === "decision" && decide(e.data.id, e.data.decision);
    navigator.serviceWorker?.addEventListener("message", h);
    const p = new URLSearchParams(location.search);
    if (key && p.get("decide")) decide(p.get("decide")!, p.get("d")!);
    return () => navigator.serviceWorker?.removeEventListener("message", h);
  }, [decide, key]);

  async function enablePush() {
    const reg = await navigator.serviceWorker.register("/sw.js");
    if ((await Notification.requestPermission()) !== "granted") return alert("알림 권한이 필요해요");
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });
    await api("/api/push/subscribe", { method: "POST", body: JSON.stringify(sub) });
    alert("알림 켜짐 ✅");
  }

  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name); try { await fn(); } catch (e: any) { alert(e.message); } setBusy("");
  };

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <h1>📅 Weekly Planner</h1>
      <input placeholder="APP_KEY" value={key} type="password"
        onChange={(e) => { setKey(e.target.value); localStorage.setItem("appKey", e.target.value); }}
        style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: 0, boxSizing: "border-box" }} />
      <div style={{ marginBottom: 16 }}>
        <button style={btn("#0ea5e9")} disabled={!!busy} onClick={() => run("plan", async () => setPlan(await api("/api/plan")))}>
          {busy === "plan" ? "생성 중…" : "이번 주 플랜 만들기"}
        </button>
        <button style={btn("#6366f1")} disabled={!!busy} onClick={() => run("scan", async () => { await api("/api/scan"); await loadSugs(); })}>
          {busy === "scan" ? "검색 중…" : "이벤트 찾기"}
        </button>
        <button style={btn("#475569")} onClick={() => run("push", enablePush)}>🔔 알림</button>
        <button style={btn("#475569")} onClick={() => (location.href = `/api/google/login?key=${encodeURIComponent(key.trim())}`)}>Google 연결</button>
      </div>

      {sugs.length > 0 && <h2>🎓 추천 이벤트</h2>}
      {sugs.map((s) => (
        <div key={s.id} style={card}>
          <b>{s.title}</b><div style={{ opacity: .7, fontSize: 13 }}>{fmt(s.start)} · {s.kind}{s.location ? ` · ${s.location}` : ""}</div>
          <p style={{ margin: "8px 0" }}>{s.reason}</p>
          {s.link && <a href={s.link} style={{ color: "#38bdf8" }}>링크</a>}
          <div style={{ marginTop: 8 }}>
            <button style={btn("#16a34a")} onClick={() => decide(s.id, "going")}>갈래요</button>
            <button style={btn("#dc2626")} onClick={() => decide(s.id, "skipped")}>안 갈래요</button>
            <button style={btn("#475569")} onClick={() => decide(s.id, "later")}>나중에</button>
          </div>
        </div>
      ))}

      {plan && (<>
        <h2>🗓️ 이번 주 플랜</h2>
        <p>{plan.summary}</p>
        {plan.blocks.map((b, i) => (
          <div key={i} style={card}><b>{b.title}</b><div style={{ opacity: .7, fontSize: 13 }}>{fmt(b.start)} → {fmt(b.end)}</div>
            {b.reason && <div style={{ fontSize: 13 }}>{b.reason}</div>}</div>
        ))}
        <button style={btn("#16a34a")} disabled={!!busy}
          onClick={() => run("apply", async () => { const r = await api("/api/plan/apply", { method: "POST", body: JSON.stringify({ blocks: plan.blocks }) }); alert(`${r.created}개 일정 추가됨 ✅`); })}>
          Google Calendar에 추가
        </button>
      </>)}
    </main>
  );
}
