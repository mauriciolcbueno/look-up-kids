# LookUp! 🦉

A safe, kid-friendly homework helper that answers questions using **only Wikipedia**, plus quizzes and a daily Wordle-style word game. Built for school use.

## What it does

- **Ask Anything** — type a question, the AI fetches a Wikipedia summary, then explains it in 2-4 short, kid-friendly sentences. Answer can be read aloud (Web Speech API, no token cost).
- **Daily Challenges** — 6 themed categories of multiple-choice quizzes (Animals, Space, History, Science, Geography, Art & Music). 5 questions per session, deterministic-per-day.
- **WikiWord** — Wordle-style daily 5-letter word, each with a Wikipedia-linked hint.
- **Admin Dashboard** — usage analytics, event totals, daily activity chart, recent events feed. Role-gated.
- **Safe by design** — blocklist on the client and server; inappropriate questions get a friendly, fun refusal.

## Stack

| Layer            | Choice                                              | Why                                                     |
|------------------|-----------------------------------------------------|---------------------------------------------------------|
| Frontend         | Vite + React + TS + Tailwind                        | Fast, modern, light.                                    |
| Auth             | Netlify Identity                                    | Free, built-in, zero new accounts to manage.            |
| AI               | Claude Haiku 4.5 via Netlify Function               | Cheapest Claude tier, perfect for short kid answers.    |
| Grounding        | Wikipedia REST API (search + summary)               | Single source of truth, verifiable.                     |
| Audio            | Web Speech API (SpeechSynthesis)                    | Zero token cost, premium voices when available.         |
| Analytics store  | Netlify Blobs                                       | Free, built into Netlify, no extra service.             |
| Charts           | Recharts                                            | Light, accessible.                                      |

## Local dev

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run dev            # vite only, no functions
# OR with functions + identity:
npx netlify dev
```

The Vite dev server runs on `http://localhost:5173`. To exercise the Netlify Functions (`/.netlify/functions/ask`, `log-event`, `admin-stats`), use `netlify dev` which serves on `http://localhost:8888`.

## Deploy to Netlify

1. Push this folder to a new GitHub repo.
2. In Netlify: **Add new site → Import existing project → connect the GitHub repo**.
3. Build command: `npm run build` — publish dir: `dist`. (Already in `netlify.toml`.)
4. **Site settings → Environment variables**: add `ANTHROPIC_API_KEY`.
5. **Site settings → Identity → Enable Identity**.
   - Registration: choose **Invite only** for a school deployment (recommended).
   - To create yourself as admin: invite your email, accept, then **Identity → your user → metadata → app_metadata → `{ "roles": ["admin"] }`**.
6. Done. Push to `main` to redeploy.

## Cost notes

Claude Haiku 4.5 is roughly $1/MTok input, $5/MTok output. Each `Ask` call sends ~400 input tokens (Wikipedia summary + system) and gets ~150 output tokens back. That's well under 0.1 cent per answer. A class of 30 kids asking 10 questions each = ~$0.25.

The blocklist short-circuits inappropriate questions before they ever hit the API.

## Project structure

```
src/
  pages/         Index, AdminDashboard
  components/    AskAnything, QuizGame, CategoryCard, WordleGame, AuthGate
  data/          quizData (categories + questions), wikiWords (Wordle dictionary)
  lib/           api (Netlify Function client), analytics, tts (Web Speech wrapper)
netlify/
  functions/     ask, log-event, admin-stats
```

## Safety

- Hard-coded server-side blocklist (`netlify/functions/ask.ts → BLOCKED`).
- Wikipedia grounding: the model is prompted to answer ONLY from the provided excerpt. If the excerpt is empty, it returns a friendly "couldn't find it" message instead of hallucinating.
- Anti-cheat for homework: prompt explicitly tells the model not to write the kid's essay for them — explain the idea, encourage own words.

## Roadmap ideas

- Voice input (Web Speech Recognition).
- Per-category leaderboard (Netlify Blobs).
- Teacher mode: assign topics, see class progress.
- Multi-language (`pt-BR` voice already supported by `pickVoice`).
