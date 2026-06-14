# Make it *only your* website — private deploy on Vercel

GitHub Pages (the current `mairachanaenae.github.io/10/` link) is **public** and the
password gate is only a soft deterrent. To make this truly private, deploy the app on
**Vercel** and lock it. Two ways — pick one.

The app already runs **fully client-side AI** (you paste your Anthropic key in **Settings**,
stored only in your browser), so you do **not** need a server, Supabase, or Clerk just to
make the agents live. The steps below are purely about *who can open the site*.

---

## Option A — Vercel password protection (simplest, 1 setting)

Locks the whole site behind a password Vercel checks before anything loads.

1. Push this repo to GitHub (already done) and go to **vercel.com → Add New → Project**.
2. **Import** `mairachanaenae/10`.
3. Set **Root Directory** to `command-center` (important — the app lives in a subfolder).
4. Framework preset: **Next.js**. Leave build/output defaults. Click **Deploy**.
5. After it deploys: **Project → Settings → Deployment Protection → Vercel Authentication**
   (or **Password Protection** on Pro). Turn it on for **All Deployments**.
   - *Password Protection* = one shared password (needs the Pro plan).
   - *Vercel Authentication* = only people you invite to the Vercel team can view (free).
6. Done. The `*.vercel.app` URL now demands auth before the page renders.

> Remove `output: "export"` is **not** needed — Vercel ignores it unless `EXPORT=1` is set,
> which it won't be. Do **not** set `EXPORT` or `BASE_PATH` env vars on Vercel.

---

## Option B — Clerk sign-in (real per-user accounts)

Use this if you want a proper login (email/Google) and, later, per-user private data.

1. Create a free app at **clerk.com** → copy the **Publishable key** and **Secret key**.
2. In Vercel **Project → Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_...`
   - `CLERK_SECRET_KEY = sk_...`
3. Redeploy. The app auto-detects the keys (`authConfigured()` in `lib/auth.ts`) and wraps
   itself in Clerk — the `middleware.ts` gate protects every route, so visitors must sign in.
4. In Clerk → **Users**, add only yourself (and disable public sign-ups under
   **User & Authentication → Restrictions** if you want it invite-only).

When no Clerk keys are present (e.g. the GitHub Pages export), the app falls back to the
soft password gate (`wealth2026`) so it still works.

---

## Which should you pick?

- **Just want it to be yours, fast →** Option A (Vercel Authentication, free).
- **Want a login screen / future multi-device private holdings →** Option B (Clerk).

Either way, after deploy: open **Settings**, paste your Anthropic key once, and the
Mentors, Agents, and Autonomous loop become genuinely Claude-driven.
