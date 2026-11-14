# House Edge

**Put a stake on yourself to master a skill.** In a casino the house always wins. Here the house is you.

A 30-day public-speaking game: you commit a stake on your own goal, an AI Proof Engine measures your speech live in the browser, and those who reach the goal get their stake back plus a share of what quitters left. Built for Business Cup 2.0 (Skills track).

> Test mode only. No real money moves. 18+.

**Live:** https://house-edge-flax.vercel.app (no sign-up; open in Chrome or Edge for the microphone)

## Status

| Milestone | Scope | State |
|---|---|---|
| M1 | Skeleton, landing, guest session, env setup, Vercel deploy | ✅ |
| M2 | Baseline: mic, transcript, filler/pace/pause metrics, Speaker Rating | ✅ |
| M3 | Rules, 3-speech baseline with liveness phrase, goal, 18+ gate, tiers, Stripe test checkout, entry + test-mode ledger | ✅ verified end to end on the live site |
| M4 | Daily tasks (adaptive difficulty, Elo rating), dashboard: streak, weekly goal + recovery, rating chart, payout forecast (simulated pool), community feed, reminders | ✅ |
| M5 | Final exam (camera + mic, eye contact via MediaPipe, fullscreen, flags), settlement with the real payout function, result page with before/after, payout breakdown and calculator, one appeal per game | ✅ |
| M6–M8 | Demo mode, safeguard pages, pricing, polish | planned |

## Final exam

`/exam` shows the thresholds first, then a camera check, then a 90-second take (minimum 60 s) in fullscreen with a random topic and liveness phrase. Win = fillers ≤ 3/min, eye contact ≥ 60%, pace 130–165 wpm, ≥ 60 s of speech, and ≥ 24 practice days (`lib/game/exam.ts`). Flags (left the tab, exited fullscreen, phrase not heard, face missing > 1/3 of the time, a second face) are stored with the attempt; a flagged win goes to review instead of paying out. In this test-mode build the exam can be taken any day; practice days count as they are.

**Eye contact** (`lib/vision/gaze.ts`, `hooks/useGazeTracker.ts`): MediaPipe FaceLandmarker runs in the browser at ~10 fps. A frame counts as eye contact when the head is roughly frontal (nose near the face centre) and both irises are near the centre of the eye opening; frames without a face count as no contact. Only the percentage leaves the device.

**Settlement** (`lib/game/settle.ts`, `/api/entry/settle`): the server re-runs the same exam rules and payout function on the measurements, updates the entry and writes the payout to the test-mode ledger. `/result/[id]` shows each criterion, before/after, the formula with the game's numbers, a what-if calculator and the appeal (`/api/entry/appeal`, lost → review, once).

## Speaker Rating (Elo)

Each daily task has a difficulty D (800–1400) from its filler limit, time limit and topic level (`lib/game/tasks.ts`); tasks are generated just above the player's current rating. Performance P ∈ [0,1] is scored against the task's own limits (fillers 45%, pace 30%, vocal variety 15%, time used 10%). Expected E = 1 / (1 + 10^((D − R)/400)); R′ = R + 32·(P − E) (`lib/game/rating.ts`). Easy tasks pay little and cost a lot when failed, so the rating can't be farmed. Max 3 rated tasks a day. A rise of more than 120 in 7 days triggers an unscheduled control measurement with a strict liveness check.

## Payout

`lib/game/payout.ts` implements the formula; `tests/payout.test.ts` checks the exact numbers from the spec (100 × $100 pool at 50/70/90/100% winners, subscriber 0% case, mixed stakes, everyone/nobody wins). The dashboard forecast runs the same function over a deterministic simulated pool of 99 players (`lib/game/pool.ts`), labelled "Simulated pool".

## Return mechanic

Daily streak, weekly goal (6 practice days, with "you can still hit this week's goal" recovery), and a daily reminder: a browser notification while a tab is open plus a downloadable recurring calendar event (`.ics`), so it works without push servers.

## Database

Run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in the Supabase SQL editor and enable **Anonymous sign-ins** (Auth → Providers). Entries and ledger rows are written only by the server after Stripe confirms a test-mode payment; row-level security lets each player read only their own rows. The ledger has `test_mode = true` enforced by a check constraint.

## Jury path

1. Open the live URL and click **Try as guest** (one click, no sign-up).
2. **Get your Speaker Rating in 60 seconds** → `/baseline`.
3. Place a stake in test mode → `/play` (Stripe test card `4242 4242 4242 4242`, any future date, any CVC).
4. **Watch Jake's 30 days** → `/demo`.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything is optional for M1
npm run dev
```

Open http://localhost:3000. `GET /api/health` shows which integrations are configured (booleans only).

## Environment variables

See [`.env.example`](.env.example). All secrets are server-side except the `NEXT_PUBLIC_*` Supabase URL/anon key and Stripe publishable key, which are safe for the browser.

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous guest sessions, data storage (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only seeding of the simulated pool |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Speech structure score and AI audience questions |
| `OPENAI_API_KEY` | Speech-to-text fallback that keeps filler words |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe **test-mode** checkout |

## Proof Engine (speech metrics)

All metrics are computed from the user's own recording; nothing is canned. Code lives in `lib/proof/` (pure functions, unit-tested).

| Metric | How | File |
|---|---|---|
| Fillers/min | Transcript rules: `um/uh` always; `like`, `so`, `you know`, `I mean` only in filler positions ("looks like", "so that" are not penalised); `basically/actually/literally` always | `fillers.ts` |
| um/uh fallback | Browser speech recognition drops hesitations, so we also count flat, sustained voiced sounds of 0.35–2 s (pitch std < 0.6 semitones, steady loudness) and use that when it is higher | `prosody.ts` |
| Pace | words ÷ speaking span (first to last voiced frame) | `metrics.ts` |
| Pauses | silences > 0.7 s inside the speaking span, from an adaptive energy threshold between the noise floor and the 95th-percentile level | `prosody.ts` |
| Vocal variety (monotony) | standard deviation of pitch in semitones (autocorrelation pitch, 5-frame median filter); < 1.5 st sounds flat | `pitch.ts`, `prosody.ts` |
| Speaker Rating | weighted composite (fillers 35%, pace 25%, eye contact 25%, variety 15%, missing metrics skipped) → R0 = 400 + 12 × composite | `score.ts` |

Transcript: OpenAI speech-to-text (`/api/transcribe`, prompted to keep disfluencies) when `OPENAI_API_KEY` is set; otherwise the browser's Web Speech API. Audio is decoded and analysed on the device; it is sent once for transcription and never stored.

Tests (`npm test`) include real speech generated with macOS `say`: measured pace stays within 5% of ground truth at two speeds, and inserted 1.2 s silences are detected as pauses.

## Guest sessions

`Try as guest` creates a session in one click. If Supabase is configured (with Anonymous sign-ins enabled), it calls `signInAnonymously()`; otherwise it falls back to a local id. Either way the session is kept in `localStorage` so the flow survives a refresh.

## Stack

Next.js (App Router, TypeScript), Tailwind CSS, Supabase, Vercel. Later milestones add Web Speech API + OpenAI speech-to-text, MediaPipe tasks-vision, Anthropic Claude API, Stripe test mode and Recharts.

## Structure

```
app/            routes (landing, placeholders for upcoming milestones, /api/health)
components/     UI pieces (Header, GuestButton, MetricLog, ...)
lib/            guest session + Supabase client
```
