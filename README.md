# Vaultbit Ops — internal CRM & operations console

A **real internal CRM running in production** for Vaultbit (Bitcoin custody & inheritance advisory): leads and partner pipeline, quotes and contracts with PDF generation, a pricing engine, Cal.com bookings, a 90-day acquisition plan board and a job-offers board fed by an n8n watcher (23 sources, geo-eligibility filtering, 0-100 match scoring).

> **About this repository.** This is a **sanitized public snapshot** of a private monorepo, published for portfolio review with fresh history through an allowlist-based pipeline (path allowlist → redaction transforms → secret/PII scanner + gitleaks as a hard gate). **No customer, partner or lead data lives in this repo** — data lives in Supabase behind RLS. It is intentionally **not runnable** without a configured Supabase project. All rights reserved.

## Stack

- **Next.js 15** (App Router) · **React 19** — Server Components + Server Actions
- **Supabase**: Postgres + Auth (magic link) + **RLS-first schema**
- Tailwind CSS 4, `@react-pdf/renderer`, dnd-kit
- Docker `standalone` output (see the Dockerfile header: the production build context is the monorepo root), deployed as its own Dokploy application

## Architecture

- `src/app/(app)/…` — authenticated route group (CRM, comercial, empleo, ajustes)
- `src/lib/actions/` — Server Actions are the only write path from the UI
- `src/lib/queries/` — typed reads through the user-scoped Supabase client
- `src/middleware.ts` — session refresh + auth enforcement on every request
- `supabase/migrations/` — **15 SQL migrations: schema + RLS policies only, no data seeds** (the only seed migration is excluded from this snapshot by policy: *schema yes, rows no*)

## Security decisions

- **Magic-link auth + email allowlist**, enforced in middleware and post-auth in Server Components (`src/lib/auth/allowlist.ts`); self-service signup is disabled at the login form and in Auth config.
- **RLS on every table**: each migration ships its policies. The app runs with the anon/user key; the n8n watcher writes through PostgREST with a service-role credential that never touches this codebase. Per-identity RLS hardening (binding write access to the operator's verified identity, not just the `authenticated` role) is tracked as an explicit follow-up — see the migration comments.
- Outbound email goes through an n8n webhook so SMTP credentials never live in the app.
- Cal.com webhook ingestion is **HMAC-verified**; rate limiting and timing-safe comparisons on sensitive endpoints.
- This snapshot was produced by a publishing gate that redacts infrastructure identifiers and hard-fails on any secret/PII pattern.

## Screenshots

The console is not runnable without a configured Supabase project, so these are captures from the running instance. **Sensitive fields (personal email, third-party lead names, internal pricing and business figures) are covered with opaque redaction bars — the underlying pixels are destroyed, not blurred.**

![Dashboard — 30-day operational overview: leads, funnel conversion, pending tasks, recent activity](docs/01-dashboard.png)
*Dashboard: 30-day KPIs (leads, funnel sessions, conversion), task list and a live activity feed across lead sources.*

![Pricing engine — editable base tiers and add-ons per service line](docs/02-tarifas-motor-precios.png)
*Pricing engine: base tiers and modifiers per service line, edited in-place and applied instantly to the quote calculator (net amounts, VAT added at quote time).*

![Job radar — Web3/AI/security offers scored against the operator profile](docs/03-radar-empleo.png)
*Job radar: remote/Barcelona Web3-AI-security offers captured by the n8n watcher (23 sources, 2×/day), scored 0–100 against a profile, with per-offer triage state.*

![90-day acquisition workspace — plan progress, weekly focus, partner actions and events](docs/04-captacion-90-dias.png)
*90-day acquisition workspace: plan progress, weekly focus, partner actions and upcoming events, wired to the partners/events/backlog boards.*

## How it was built

Solo founder + Claude Code, in phased feature branches (F0 → F2.x): scaffold & auth → CRM core → quotes/contracts + pricing engine → boards (acquisition, jobs). Every phase ends with a quality review and a security review before merge.

## Live

Runs at a private URL for a single operator. This repo exists to show **how** it is built, not to be deployed by third parties.
