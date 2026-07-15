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

- **Magic-link auth + email allowlist**, enforced both in middleware and post-auth in Server Components (`src/lib/auth/allowlist.ts`) — defense in depth, not UI-only.
- **RLS everywhere**: every migration ships its policies; the app runs with the anon/user key and can only do what RLS allows. The n8n watcher writes through PostgREST with a service-role credential that never touches this codebase (e.g. `2026-07-12-job-offers-rls-hardening.sql` restricts the app to SELECT/UPDATE).
- Outbound email goes through an n8n webhook so SMTP credentials never live in the app.
- Cal.com webhook ingestion is **HMAC-verified**; rate limiting and timing-safe comparisons on sensitive endpoints.
- This snapshot was produced by a publishing gate that redacts infrastructure identifiers and hard-fails on any secret/PII pattern.

## How it was built

Solo founder + Claude Code, in phased feature branches (F0 → F2.x): scaffold & auth → CRM core → quotes/contracts + pricing engine → boards (acquisition, jobs). Every phase ends with a quality review and a security review before merge.

## Live

Runs at a private URL for a single operator. This repo exists to show **how** it is built, not to be deployed by third parties.
