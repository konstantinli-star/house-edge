# Upscale

**Put a stake on yourself to master a skill.** In a casino the house always wins. Here the house is you.

A 30-day public-speaking game for US adults 25–45. You commit a stake on your own goal, a Proof Engine measures your speech live in the browser, and players who reach the goal get their stake back plus a share of what the others left. Built for Business Cup 2.0 (Skills track).

> **Test mode only. No real money moves.** Stripe runs with test keys; every payout is a test-mode ledger entry. 18+.

- **Live:** https://house-edge-flax.vercel.app (no sign-up; use Chrome or Edge for the microphone)
- **Repo:** https://github.com/konstantinli-star/upscale

## Jury path (about 10 minutes)

1. Open the live URL and click **Try as guest** in the header (one click, no sign-up).
2. **Get your Speaker Rating in 60 seconds** (`/baseline`): allow the microphone and talk about the topic. Try once fast with “um, like, you know”, once slowly and cleanly: the numbers change.
3. **Watch Jake’s 30 days** (`/demo`): press *Play 30 days*. About a minute; labelled *Demo data*, computed by the same code as your game.
4. **Start a game** (`/play`): rules → 3 short speeches (read the phrase first) → confirm 18+ → choose $50 or $100 → pay in Stripe test mode with **4242 4242 4242 4242**, any future date, any CVC.
5. **Dashboard** → **Start today’s task** (`/exercise`): a timed task; the result shows your Speaker Rating change.
6. **Go to the final exam** (`/exam`): camera + microphone, fullscreen, up to 90 s. In this build the exam is open on any day; your practice days count as they are (so a new game will usually show “practice days ✗”).
7. **Result** (`/result/…`): pass/fail per criterion, before → after, the payout formula with the game’s numbers, a what-if calculator and the appeal.
8. **How it works**, **Pricing** (test-mode $9.99/month subscription: 0% fee on up to 3 games a month) and **Responsible play** (limits, self-exclusion, helpline) are linked in the footer.

## What works

| Area | What you can check |
|---|---|
| Guest | One-click anonymous Supabase session, kept in `localStorage` so a refresh keeps your progress |
| Proof Engine | Fillers, pace, pauses and vocal variety from your own recording; eye contact from the camera in the exam (MediaPipe, on-device) |
| Speaker Rating | 400–1600 scale with 1000 = the exam bar; chess-style Elo updates on adaptive tasks |
| Stake | Rules, 3-speech baseline with a liveness phrase, goal, 18+ gate, $50/$100/$250 tiers (first game ≤ $100), Stripe test checkout, entry + ledger in Supabase |
| Daily practice | Weekly themes, 2 timed tasks a day (max 3 rated), streak, weekly goal with “what you can still recover”, reminder (browser notification + calendar file) |
| Exam & payout | Strict exam with flags (tab, fullscreen, phrase, face), server-side settlement with the real payout function, one appeal per game |
| Demo | Jake’s 30 days on a virtual clock through the real pipeline: 802 → 1016, exam passed, $124.38 back on $100 |
| Safeguards | Personal stake limit, self-exclusion enforced by the server, self-check, national helpline, test-mode banner on money screens |
| Pricing | Open game (15% fee only from the money of players who missed) and a working test-mode subscription (0% fee, verified with Stripe at checkout) |

## What was cut (in the spec’s cut order)

- **AI audience questions and the speech-structure score (Claude).** Not built; no Claude calls in this build. Q&A week uses a fixed bank of audience questions.
- **Sponsor-prize spin bonuses.** Not built; the rating chart is the reward.
- **Pricing extras.** Verified Speaker Rating certificate and 1:1 coaching are listed with prices but have no checkout.
- **Optional email magic link (“Save progress”).** Not built; guest sessions only.
- **Eye-contact tracking was kept**, but its thresholds are geometric and not tuned on real users yet.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
npm test           # 83 unit tests (vitest)
```

The app runs without any keys (local guest, browser speech recognition); each integration switches on when its env vars are set. `GET /api/health` shows which are configured (booleans only).

**Supabase:** create a project, run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in the SQL editor, and enable **Authentication → Sign In / Providers → Anonymous sign-ins**.
**Stripe:** use **test-mode** keys only; the server refuses any key that doesn’t start with `sk_test_`/`rk_test_`.

## Environment variables

See [`.env.example`](.env.example). Secrets are server-only; `NEXT_PUBLIC_*` values are safe in the browser. On Vercel they live in Project → Settings → Environment Variables; nothing secret is in the repo.

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous guest sessions; attempts saved under row-level security |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only writes: entries, ledger, settlement, appeals, self-exclusion |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe **test-mode** checkout (stakes and subscription) |
| `STRIPE_WEBHOOK_SECRET` | Not used (confirmation happens on the success page by retrieving the session) |
| `OPENAI_API_KEY`, `OPENAI_STT_MODEL` | Optional speech-to-text that keeps “um/uh” (`/api/transcribe`); without it the browser’s Web Speech API is used |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Reserved for the cut AI features; not used |

## Key dependencies

Next.js 16 (App Router, TypeScript) on Vercel · Tailwind CSS 4 · Supabase (Postgres, anonymous auth, RLS) · Stripe (test mode, Checkout) · MediaPipe Tasks Vision 1.1.1 (FaceLandmarker, in the browser) · Web Speech API + optional OpenAI speech-to-text · Recharts · Vitest.

## How it is built

```
app/                 pages and API routes
  api/checkout/        stake + subscription checkout, confirmation
  api/entry/           exam settlement, appeal
  api/player/          self-exclusion
  api/transcribe/      optional OpenAI speech-to-text
components/          UI by area (baseline, play, exercise, exam, result, dashboard, demo, responsible, ...)
hooks/               recording, game state, gaze tracker, virtual clock
lib/proof/           speech metrics and scoring (pure)
lib/game/            rules, baseline, tasks, Elo, calendar, exam, payout, pool, settlement (pure)
lib/demo/            Jake's seeded 30 days
lib/server/          Stripe (test keys only), Supabase admin, subscription check
supabase/migrations/ schema + RLS
tests/               unit tests, including real speech generated with macOS `say`
```

### Proof Engine (speech metrics)

All metrics are computed from the user’s own recording; nothing is canned.

| Metric | How | File |
|---|---|---|
| Fillers/min | `um/uh` always; `like`, `so`, `you know`, `I mean` only in filler positions (“looks like”, “so that” are not counted); `basically/actually/literally` always | `lib/proof/fillers.ts` |
| um/uh fallback | Browser recognition drops hesitations, so flat, sustained voiced sounds of 0.35–2 s are counted from the audio and used when higher | `lib/proof/prosody.ts` |
| Pace | words ÷ speaking span (first to last voiced frame) | `lib/proof/metrics.ts` |
| Pauses | silences > 0.7 s, from an adaptive energy threshold | `lib/proof/prosody.ts` |
| Vocal variety | standard deviation of pitch in semitones (autocorrelation, median-filtered) | `lib/proof/pitch.ts` |
| Eye contact | MediaPipe iris + head landmarks, ~10 fps, frames without a face count as no contact; only the % leaves the device | `lib/vision/gaze.ts` |

Audio is decoded and analysed on the device, sent once for transcription only if OpenAI is configured, and never stored. Video is never sent.

### Speaker Rating

Every metric maps to 0–100 with **exactly 50 at the exam threshold** (`100 / (1 + ratio^k)`). The composite is a weighted mean (fillers 35%, pace 25%, eye contact 25%, variety 15%; unmeasured metrics skipped) and R = 400 + 12 × composite, so **1000 = meets the exam bar**. Jake’s day-1 numbers land near 812.

Each task has a difficulty D (800–1400) from its filler limit, time limit and topic level, generated just above the player’s rating. The attempt gets its own rating on the same scale, P = 1 / (1 + 10^((D − perf)/400)), E = 1 / (1 + 10^((D − R)/400)), R′ = R + 32·(P − E). Performing at your level changes nothing; easy tasks pay little and cost a lot when failed. A rise of more than 120 in 7 days triggers a control measurement with a strict liveness check.

### Payout

```
L = stakes of players who missed, S_w = stakes of winners, Bank = L + S_w
Commission = min(f × Bank, L)        f = 15% open game, 0% subscriber
Payout_i   = s_i + (s_i / S_w) × (L − Commission)
```

`lib/game/payout.ts`; `tests/payout.test.ts` checks the spec’s exact numbers (50/70/90/100% winners → $170.00 / $121.43 / $100.00 / $100.00; subscribers $200.00 / $142.86 / $111.11; mixed stakes $120 / $300; everyone or nobody wins). Forecasts and settlements run the same function over a deterministic simulated pool of 99 players, labelled “Simulated pool”. The server re-runs the exam rules and payout on settlement; nothing about money is decided in the browser.

### Responsible play

18+ gate before stakes; tiers $50/$100/$250, first game ≤ $100, one active game, max 3 rated tasks a day; no credit, doubling or paid extras. Personal stake limit (stricter now, looser after 24 h). Self-exclusion stored on the account and enforced by `/api/checkout` (403); lifting it needs a 7-day pause. The spec named 1-800-GAMBLER, but NCPG’s site (checked Nov 2026) lists **1-800-MY-RESET (1-800-697-3738)** for call/text and chat at ncpgambling.org/chat, so the app uses that.

### Privacy and data

Supabase tables: `players`, `attempts` (transcript, metrics, flags; no audio/video), `games`, `entries`, `ledger` (`test_mode = true` enforced by a check constraint), `rating_history`, `simulated_players`, `reminders`. Row-level security: each player reads only their own rows; money rows are written only by the server after Stripe confirms a test-mode payment. Daily practice records and reminders are kept in the browser in this build.
