# The Investor's Command Center

A premium, AI-powered investment command center — Next.js (App Router) + TypeScript + Tailwind
+ Framer Motion, with **Clerk** (auth), **Supabase** (data), and **Claude** (AI). Built to run
in **demo mode with zero config**, and to light up real auth / your private data / live AI as you
add env vars.

> Educational only — not financial advice.

## Run locally
```bash
npm install --legacy-peer-deps
npm run dev          # http://localhost:3000  (demo mode, sample data, canned AI)
npm run typecheck    # tsc --noEmit
npm run test         # vitest (scoring/mentors unit tests)
npm run build        # production build
```

## Milestones
- **M1 (done):** scaffold, design system, app shell (sidebar/topbar/AI dock), Clerk-optional auth,
  Supabase client, ported `lib/scoring.ts` + `lib/mentors.ts` (with tests), dashboard with animated
  KPI counters, all routes stubbed.
- **M2:** Supabase schema + RLS, holdings CRUD, full Portfolio + Dashboard (charts, donut, wealth map).
- **M3:** streaming Claude Mentor chat + Agents task runner (rule-based fallback without a key).
- **M4:** autonomous BabyAGI loop (SSE) + pgvector memory.
- **M5:** Opportunities, Goals, Academy, notifications, polish.
- **M6:** deploy.

## Architecture
```
app/(marketing)/        signed-out landing
app/(app)/              Clerk-gated shell + pages (dashboard, portfolio, mentors, agents, …)
app/api/                mentors/chat, agents/run, autonomous, market/[symbol]   (M3+)
components/command/     Sidebar, Topbar, AIChatDock, nav
components/ui/          GlassCard, KpiCard, Counter, Placeholder
lib/scoring.ts          dividend-safety score + E→S rank (ported from the prototype)
lib/mentors.ts          4 mentor personas + per-holding council reactions
lib/ai/provider.ts      Anthropic client (model claude-opus-4-8); swap providers here
lib/supabase.ts         server client (null when unconfigured)
lib/auth.ts             Clerk-optional display name (demo "Maira" without keys)
lib/data.ts             holdings/goals (sample now → Supabase in M2)
```

## Deploy (Vercel)
1. Push this folder to a repo; import it in **vercel.com**.
2. Create accounts + keys: **Anthropic** (`ANTHROPIC_API_KEY`), **Clerk** (publishable + secret),
   **Supabase** (URL + anon + service-role). All optional — add what you want live.
3. Paste them into Vercel → Project → **Settings → Environment Variables** (see `.env.example`).
4. Deploy. With no keys it ships in demo mode; with keys, real auth + data + live Claude turn on.

## Privacy
Your real holdings live only in your Supabase row (per Clerk user) — never committed. The repo
ships **sample** data only.
