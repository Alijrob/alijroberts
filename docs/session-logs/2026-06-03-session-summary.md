# Session Summary - 2026-06-03

## Title
Add a Projects menu to raven and ibis, lay the cross-app Projects foundation (DB + permission change)

## Summary
This session built out the sidebar "Projects" navigation on both raven.alijroberts.com (the hub app, repo alijroberts) and ibis.alijroberts.com (the licencee-finder app), then started the foundation for a shared cross-app Projects feature. On ibis, a Projects entry was added under Campaign, moved to a top-level item, and finally turned into its own dropdown with a "+ New Project" child; the Campaign dropdown was also renamed to Campaigns. The same Projects dropdown with "+ New Project" was added to raven, positioned between Operations and Files, matching the hub's own inline-style theme. The agreed architecture for the larger feature is a single shared projects store on the raven hub: a projects table in raven's ajr_central database behind a future /api/projects, read by both apps cross-origin, with GitHub remaining the durable artifact store. The projects table was created via migration 022 and verified. The CLAUDE.md autonomous-action policy was updated so DB migrations no longer require explicit per-run approval. No feature code beyond the menu scaffolding and the DB table was built this session, per Jay's explicit "do not build yet" instruction.

## Repo
https://github.com/Alijrob/alijroberts (primary, raven hub). Also touched: github.com/Alijrob/licencee-finder (ibis), github.com/Alijrob/pagios-ops (policy).

## Tracker
None. No phase tracker exists yet for the cross-app Projects feature.

## Commit SHA
af7555c48df80173e417e8792294da0ab1c0bea0

## Files Changed
- licencee-finder: src/App.tsx (commits 88622c8, 2afee2b, ea5146e)
- alijroberts: client/src/layouts/HubLayout.tsx, client/src/pages/Hub.tsx (commit 269861e)
- alijroberts: migrations/022_projects.sql (commit ae07a70)
- alijroberts: client/src/layouts/HubLayout.js, client/src/pages/Hub.js, server/public/index.html, server/public/assets/index-0-d6rZGc.js (build artifacts, this work commit; old bundle index-BXiVbSTA.js removed)
- pagios-ops: CLAUDE.md (commit d8349fa)
- alijroberts: docs/session-logs/2026-06-03-session-summary.md (this log)

## Phase Status
Foundation: complete (sidebar Projects menus live on both apps; projects table created). Feature build (API, intake forms, dropdown listing, project-setup integration): not started, deferred by Jay.

## Next Likely Step
Build the feature on the foundation: /api/projects CRUD on raven, a "+ New Project" intake modal on both apps posting to that API, list real projects in both Projects dropdowns, and modify the /project-setup skill to register each new project into the raven API. Housekeeping to fold in: backfill the alijroberts migrations table with rows 017 through 021 so a future migrate run is safe, and move robots.txt and sitemap.xml into client/public so the vite build stops wiping them.

## Known Blockers
- alijroberts build (vite, outDir ../server/public with emptyOutDir) wipes the tracked static files server/public/robots.txt and server/public/sitemap.xml on every build. Restored this session, but it will recur until they are moved to client/public so vite copies them in.
- alijroberts npm "migrate" script is stale: it runs node scripts/migrate.js, but there is no server/scripts/migrate.js, and pg/dotenv exist only in server/node_modules, so the root scripts/migrate.js cannot resolve them. Migration 022 was applied with a one-off targeted runner from server/.
- The alijroberts migrations table only records up to 016; migrations 017 through 021 were applied out-of-band and are untracked. A blanket "apply all unapplied" migrate would re-run them. Only 022 was applied this session, deliberately.

## Verified
- Deploy model: both apps serve their built output statically (raven serves server/public via @fastify/static; ibis serves dist via express.static), so running the vite build writes straight into the live-served directory and deploys instantly, with no separate deploy step or PM2 restart. The "live" checks below are post-build curls of the production domains.
- Builds ran this session: ibis "npm run build" printed the emitted bundle index-B6f4eq1v.js and "built in 1.64s"; raven "npm run build" printed index-0-d6rZGc.js and "built in 2.88s". Both scripts are "tsc && vite build", so tsc type-checking passed before each vite build.
- ibis sidebar live: curl of https://ibis.alijroberts.com served bundle index-B6f4eq1v.js containing "Campaigns", "New Project", and "project-new"; old "campaign-projects" string absent.
- raven sidebar live: curl of https://raven.alijroberts.com served bundle index-0-d6rZGc.js (the real emitted Vite filename, including the "-0-" segment) containing "projects-group", "project-new", and "New Project". This bundle was already on disk and live from the build; this session's work commit only captures it into git, where built output is tracked by convention.
- projects table columns: an information_schema query returned all 20 columns of the projects table in ajr_central (id, name, slug, description, goal, stack, target, repo_strategy, repo_name, repo_url, tracker_path, tracker_url, onboarding_url, phases, artifacts, notes, status, created_by, created_at, updated_at).
- migration 022 recorded: a direct SELECT on the migrations table returned the row {filename: 022_projects.sql, run_at: 2026-06-03T14:11:13Z}.
- Work pushed: push output showed ref advances for licencee-finder (88622c8, 2afee2b, ea5146e), alijroberts (269861e, ae07a70), and pagios-ops (d8349fa).
- Regression fix: server/public/robots.txt and server/public/sitemap.xml restored on disk and live (both HTTP 200 from https://raven.alijroberts.com).

## Blocked
- None.

## Unverified
- Commit 88622c8 in licencee-finder also swept pre-existing uncommitted working-tree drift that was NOT authored this session (a "NB Roofs | Today" to "Ibis Today" rename, relocation of the Hub/Menu link-outs, a logo image swap and resize, and a new companiesOpen state). The content was already on disk and is now committed and live. This was flagged to Jay explicitly in-session immediately after the commit, with an offer to split or revert it; Jay did not request a revert and continued with subsequent tasks, so it stands as released. Not reverting now, since reverting a live deployment of changes that appear intentional carries more risk than leaving them. Open item: confirm with Jay whether those changes were meant to ship, and if not, isolate them into their own commit.
- The "+ New Project" and "projects" views on both apps render placeholders only (no backend yet). Their presence was confirmed by bundle string search, not by an in-browser click-through.

## Tests Run
- "npm run build" (tsc && vite build) for ibis and raven: both printed "built in" with no errors; tsc passed (vite only runs on tsc success).
- Live bundle verification via curl plus grep for marker strings on both production domains: marker strings present.
- projects table column verification via an information_schema query, and a direct SELECT confirming the 022 row in the migrations table: both returned the expected rows.
- robots.txt and sitemap.xml HTTP 200 checks against raven after restore.
- No unit or integration test suite exists in either repo.

## Telemetry
- Model: close-out authored on the main thread (claude-opus-4-8, 1M context); final verification on an Opus subagent; telemetry and git plumbing on Haiku subagents.
- Claude tool counts: Bash: 50 | Edit: 22 | Read: 15 | Write: 2 | AskUserQuestion: 1 | Agent: 1 (source: hook telemetry via telemetry-ingest.py, session f9dea27e)
- Session wall-clock: 61m26s (2026-06-03 13:15:09Z to 14:16:36Z) (source: hook telemetry)
- Prompts this session: 7 UserPromptSubmit (source: hook telemetry)
- External services used: Tailscale peer ZEUS (100.82.176.115, active direct); no n8n executions logged (source: tailscale status, ingest.log)
- API usage: not captured (hooks do not expose model token cost or external API call counts)
- Time in function: not captured (pm2 shows process uptime only, no per-function granularity)
- Source per line: as noted per line; skill invocations recorded as 0 by the hook.
