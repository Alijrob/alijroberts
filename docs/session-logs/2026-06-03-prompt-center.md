# Session Summary - Prompt Center on raven.alijroberts.com

- Date: 2026-06-03
- Project: Raven hub (raven.alijroberts.com)
- Repo: Alijrob/alijroberts
- Dev tree: /root/_work/alijroberts (Hostinger)
- Live deploy: ZEUS 72.61.2.245, /root/alijroberts, pm2 `alijroberts`, port 3400
- Commit SHA (code): 28a75e0
- Session log commit SHA: __PENDING__

## Goal

Add a "Prompt Center" item to the raven sidebar, positioned between "Skills" and "Files", as a dropdown with three children (Library, Lab, Fixes), and build the corresponding main-screen pages with real setup logic (DB + API + UI).

## What shipped

Full-stack feature, mirroring the existing Skills module pattern.

Backend (server/):
- New route `server/src/routes/prompts.ts`: bucket-scoped CRUD over `prompts` and `prompt_folders`, buckets are `library` / `lab` / `fixes`. PUT supports a bucket change (Lab "Promote to Library") and folder moves via the present-key COALESCE/CASE pattern copied from skills.ts.
- `server/src/index.ts`: added `prompts` and `prompt_folders` table creation to `ensureChatTables()` (runs on boot), plus an index on `(bucket, name)`, and registered `promptsRoutes`.

Frontend (client/):
- New `client/src/modules/prompts/PromptCenter.tsx`: one component driven by a `bucket` prop. Library = finished reusable prompts; Lab = drafts with a draft/testing/ready status and a Promote-to-Library action; Fixes = a problem/symptom -> corrective-fix pair. Folders supported per bucket.
- `client/src/layouts/HubLayout.tsx`: "Prompt Center" dropdown group inserted between the Skills and Files nav buttons, children Library/Lab/Fixes, using the same dropdown pattern as Dashboard/Operations/Projects. Extended the `HubModule` union with `prompt-library` / `prompt-lab` / `prompt-fixes`.
- `client/src/pages/Hub.tsx`: wired the three modules into routing, the valid-hashes list, and the ComingSoon label map.

Build note: the client tsconfig emits `.js` siblings into `src/` (Vite resolves `.js` before `.tsx`), and those `.js` plus the `server/public` bundle are git-tracked, so a full `npm run build` is required after editing `.tsx`. The committed bundle is `index-DaEtLnFa.js`.

## Files changed (in commit 28a75e0)

- server/src/routes/prompts.ts (new)
- server/src/index.ts
- client/src/modules/prompts/PromptCenter.tsx (new) + PromptCenter.js (emitted)
- client/src/layouts/HubLayout.tsx + HubLayout.js (emitted)
- client/src/pages/Hub.tsx + Hub.js (emitted)
- server/public/index.html + server/public/assets/index-DaEtLnFa.js (replaced index-fC4w0ABq.js)

Out-of-repo change (system file, not committed): removed the `/raven` and `/raven/assets` location blocks from Hostinger's `/etc/nginx/sites-available/alijroberts.com`. Backup at `/root/alijroberts.com.nginx.bak.1780509243`.

## Tests run

- `cd client && npm run build` (tsc + vite) on Hostinger: clean. Bundle confirmed to contain "Prompt Center"/"Prompt Library".
- `cd server && npm run build` (tsc) on Hostinger: clean.
- On ZEUS after deploy: `cd server && npm run build` (tsc): clean.
- Live ZEUS (127.0.0.1:3400): `GET /api/prompts?bucket=library|lab|fixes` -> 200 `[]`; `GET /api/prompt-folders?bucket=library` -> 200 `[]`; POST a test prompt -> returned row id 1; GET list -> showed it; DELETE id 1 -> `{ok:true}`, list back to `[]`.
- Served bundle on ZEUS contains "Prompt Library".
- `https://raven.alijroberts.com/` -> 200.

## Verified

- Code committed and pushed to Alijrob/alijroberts @ 28a75e0; local HEAD == upstream (checked with rev-parse).
- Deployed to ZEUS: discarded local build-artifact mods (git checkout on Hub.js + index.html, removed one stale bundle by name; no stash -u / no clean), `git pull --ff-only` 087b83c -> 28a75e0, server `tsc` build, `pm2 restart alijroberts`. Process online, listening on 3400, no boot errors in log.
- `prompts` + `prompt_folders` tables auto-created on boot (proven by 200 responses and a full POST/GET/DELETE roundtrip).
- New frontend bundle live (Prompt Library string present in node-served JS).

## Unverified

- Rendered sidebar interaction. The dropdown, active highlighting, and the Promote/folder/edit flows were verified only via build-compiles, bundle-contains-string, and API roundtrip. No jsdom/puppeteer click-simulation test was run, so the actual in-browser rendered behavior of the Prompt Center dropdown is unverified.

## Blocked

- None.

## Known loose ends / next steps

- Hostinger's `alijroberts.com` nginx `/raven` slug removal stands (harmless: alijroberts.com DNS points to ZEUS, so the Hostinger vhost serves no public traffic). Restore from the backup if undoing is wanted.
- The live `alijroberts.com/raven` path (on ZEUS) still falls through to the "under construction" catch-all; there is no `/raven` location there to delete. If a hard 404 is wanted, add `location = /raven { return 404; }` on ZEUS.
- Optional follow-up: a rendered click test of the Prompt Center dropdown to close the Unverified item above.

## Telemetry

- Model: close-out authored on the main thread (claude-opus-4-8[1m]); final verification on an Opus subagent; telemetry and git plumbing on Haiku subagents
- Claude tool counts: Bash: 49 | Edit: 17 | TaskUpdate: 10 | Read: 6 | TaskCreate: 5 | Write: 2 | ToolSearch: 2 | Agent: 1 (total: 92 tool calls)
- Session wall-clock: 61m41s
- Prompts this session: 12
- External services used: SSH to ZEUS (72.61.2.245) for deploy; tailscale not installed on this box
- API usage: not captured (hook telemetry does not expose model cost data)
- Time in function: not captured (pm2 logs show uptime/restart counts but no automation runtime metric)
- Source per line: Claude Code hook telemetry via telemetry-ingest.py (tool counts, wall-clock, prompts); SSH target from session context; tailscale absent; no project API logs found
