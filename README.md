# NY Electeds: Constituent Services Tracker

How well do New York's elected officials serve their constituents? This site rates each official on how
reachable their offices are and (soon) how often they actually respond. Live at
[electeds.manapool.nyc](https://electeds.manapool.nyc) once deployed.

First pass: New York's 2 U.S. senators and 26 U.S. House members. State, county and municipal officials come next.

## What's tracked

| Metric | Status |
| --- | --- |
| Number of in-area offices (excluding DC) | Live |
| Offices per 1,000 sq mi and per 100,000 residents | Live |
| Contact by email, phone, web form, in person | Live |
| Publishes daily schedule, last 10 meetings | Live (no NY member publishes one as of Oct 2026) |
| Good-government scorecards | Live (links to GovTrack, Vote Smart, OpenSecrets, Ballotpedia, Bioguide) |
| Reviews | Links to Google Maps and Yelp per office; ratings not pulled in |
| Callback / email reply / web form reply rates via contact-through-site | Schema and UI placeholder only |
| Verified-constituent comments | Schema and UI placeholder only |

See `/methodology` on the site for definitions and sources.

## Stack

- Next.js 16 (App Router, Cache Components) on Vercel Hobby (free)
- Postgres on Neon's free plan, via Drizzle ORM (`postgres` driver, works with any Postgres)
- Tailwind CSS 4

Pages are prerendered and cached for an hour, so the database is only hit on revalidation. If `DATABASE_URL` is
not set, the site reads `src/data/seed.json` directly, so it builds and runs without a database.

## Data

Reference data lives in the repo and is loaded into Postgres by the seed script:

```
data/congress-legislators-ny.json   members, IDs, district offices (from unitedstates/congress-legislators)
data/research/<BIOGUIDE>.json       per-member facts checked against official websites, with sources
data/districts.json                 land area (Census TIGERweb) and population (2020 Census) per district
data/status-notes.json              retirements, primary losses
data/display-names.json             common names ("Chuck Schumer")
        │  npm run data:build
        ▼
src/data/seed.json                  what the app and the seed script read
        │  npm run db:seed
        ▼
Postgres
```

To correct a fact, edit the file in `data/`, run `npm run data:build`, and commit both. CI fails if `seed.json` is
out of date. The seed is idempotent: it upserts reference data, marks anyone dropped from the seed as out of office,
and never touches user-generated tables.

Schema: `src/db/schema.ts`. User-generated tables (`constituents`, `constituent_jurisdictions`,
`contact_attempts`, `comments`) exist but nothing writes to them yet.

## Local development

```bash
npm install
npm run dev                         # works without a database (reads seed.json)
```

With a local Postgres:

```bash
export DATABASE_URL=postgres://postgres@localhost:5432/electeds
npm run db:migrate
npm run db:seed
npm run dev
```

After changing `src/db/schema.ts`, run `npm run db:generate` to create a migration in `drizzle/`.

## Deploying (steps for Tim)

Everything below is free tier. Nothing here has been set up yet.

1. **Vercel project.** At [vercel.com/new](https://vercel.com/new), import `timfitzzz/nys-electeds-tracker` on the
   Hobby plan. Defaults are fine. The first deploy works without a database.
2. **Neon database.** In the Vercel project, open **Storage → Create Database → Neon** (free plan), and connect it to
   the project for Production and Preview. This adds `DATABASE_URL` to the project's environment variables. (Or
   create a project at [neon.tech](https://neon.tech) and paste its *pooled* connection string as `DATABASE_URL`.)
3. **Redeploy.** With `DATABASE_URL` set, Vercel's build runs `npm run vercel-build`, which applies migrations,
   loads the seed, then builds. Every deploy re-syncs the database with `src/data/seed.json`.
   - If the Neon integration creates a database branch per preview deployment, previews get their own copy;
     otherwise previews share the production database (fine while only reference data is in it).
4. **Domain.** In the Vercel project, **Settings → Domains → Add** `electeds.manapool.nyc`. Vercel shows a DNS
   record to add; at the DNS host for `manapool.nyc`, add a `CNAME` record for `electeds` pointing to the value it
   shows (normally `cname.vercel-dns.com`). HTTPS is issued automatically once DNS resolves.

## Roadmap

- **Contact through the site.** Calls via a bridged number (Twilio or similar, paid), emails from a relay address
  with inbound parsing (e.g. Postmark/SES), web forms submitted on the user's behalf. Each creates a
  `contact_attempts` row; replies or a follow-up email to the user set the outcome. Rates show after 10 outcomes
  per channel (`MIN_SAMPLE` in `src/lib/data.ts`).
- **Residency verification for comments.** Mailed code or voter-file match; store only the matched jurisdictions.
- **Reviews.** Pull ratings for each office (Google Places API has a free monthly credit; Yelp's API is paid).
- **Schedules.** Scrape published schedules where they exist (more common for state and city officials).
- **State, county, municipal officials.** `jurisdictions.type` and `officials.level` already cover these.
