// 단일 사용자 저장소. Upstash Redis(KV)가 설정되어 있으면 그걸 쓰고, 없으면 로컬 JSON 파일을 사용.
import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

export type Suggestion = {
  id: string; // gmail message id
  title: string;
  kind: "webinar" | "info_session" | "career" | "school" | "other";
  start: string; // ISO
  end: string; // ISO
  location?: string;
  link?: string;
  reason: string;
  status: "pending" | "going" | "skipped" | "later";
};

export type State = {
  suggestions: Suggestion[];
  pushSubs: any[];
  seenMessageIds: string[];
  prefs: { liked: string[]; disliked: string[] };
  googleRefreshToken?: string;
  oauthNonce?: string;
};

const FILE = path.join(process.cwd(), ".data", "state.json");
const KEY = "planner:state";
const empty: State = { suggestions: [], pushSubs: [], seenMessageIds: [], prefs: { liked: [], disliked: [] } };

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export async function loadState(): Promise<State> {
  try {
    const raw = redis ? await redis.get<State>(KEY) : JSON.parse(await fs.readFile(FILE, "utf8"));
    return { ...structuredClone(empty), ...(raw ?? {}) };
  } catch {
    return structuredClone(empty);
  }
}

export async function saveState(s: State) {
  if (redis) return void (await redis.set(KEY, s));
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(s, null, 2));
}
