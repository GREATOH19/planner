# Weekly Planner (personal MVP)

Canvas + Google Calendar + Gmail → AI 주간 플랜 & 웨비나/info session 추천 알림. PWA라서 iPhone/Windows 모두 설치 가능.

## 셋업
1. `cp .env.example .env.local` 후 값 채우기
2. Canvas: Settings → New Access Token (안 되면 `CANVAS_ICS_URL`)
3. Google Cloud Console: 프로젝트 생성 → Calendar API, Gmail API 활성화 → OAuth Client(Web, redirect `https://<배포주소>/api/google/callback`) → ID/Secret을 환경변수로. 앱에서 'Google 연결' 버튼으로 로그인
4. `npx web-push generate-vapid-keys` → VAPID 키 입력
5. `npm run dev` (로컬) 또는 Vercel 배포 (푸시는 HTTPS 필요)
6. iPhone: Safari → 공유 → 홈 화면에 추가 → 앱에서 🔔 알림 켜기 (iOS 16.4+)
7. 이벤트 자동 스캔: 외부 크론이 `GET /api/scan?key=APP_KEY`를 하루 몇 번 호출

## 알려진 한계 (MVP)
- 단일 사용자. 상태는 Upstash Redis(배포) 또는 `.data/state.json`(로컬)에 저장 (`lib/store.ts`)
- iOS는 알림 액션 버튼을 지원하지 않음 → 알림 탭 후 앱에서 갈래요/안 갈래요 선택
