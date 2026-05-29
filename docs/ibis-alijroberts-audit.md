# Phase-1 Audit: ibis.alijroberts.com (licencee-finder)

**Date:** 2026-05-29
**Purpose:** Inventory existing Operations / Files / Menu surfaces in licencee-finder
before deciding what to remove for the cross-subdomain hub-and-spoke build with
raven.alijroberts.com as the hub.

## Source of truth

- **Host:** ZEUS (`100.82.176.115`)
- **PM2 process:** `licencee-finder` (online, exec `/root/licencee-finder/server/server.js`)
- **Port:** `3152`
- **Nginx:** `ibis.alijroberts.com` → `proxy_pass http://127.0.0.1:3152` (with a
  static `/resources/` subpath served from `/var/www/ibis.alijroberts.com/resources/`)
- **Client source:** `/root/licencee-finder/src/` (single Vite app, no client/server
  split; sidebar JSX is inlined in `src/App.tsx` lines 897–1140)

## Sidebar inventory (top to bottom)

| Surface | Sidebar entry | `currentView` value | Module file |
|---|---|---|---|
| Top single | `NB Roofs \| Today` | `agenda` | `modules/agenda/DailyAgenda` |
| Dropdown | `Dashboard` | `dashboard` (+ tasks/calendar/email/contacts) | `modules/dashboard/BusinessDashboard` |
| Dashboard child | `tasks` | `tasks` | `modules/connect/ConnectView` |
| Dashboard child | `calendar` | `calendar-view` | `modules/calendar/CalendarView` |
| Dashboard child | `email` | `email-view` | `modules/email/EmailView` |
| Dashboard child | `contacts` | `contacts` | `modules/connect/ConnectView` |
| Dropdown | `Campaign` | `campaign-new`, `campaign-detail` | `modules/campaign/NewCampaignView`, `CampaignDetailView` |
| Campaign child | `New Campaign` | `campaign-new` | NewCampaignView |
| Campaign children | (N campaigns from `/api/campaigns`) | `campaign-detail` per id | CampaignDetailView |
| Dropdown | `Data` | `scraper`/`leads`/`enrichment`/`pipeline` | `modules/scraper/*` |
| Single | `Media Files` | `files` | `modules/files/MediaFiles` |
| Bottom dropdown | `Settings` | (5 children below) | — |
| Settings child | `Assistant Defaults` | `raven-assistant` | inline editor (agent) |
| Settings child | `Site Editor` | `raven-editor` | inline editor (agent) |
| Settings child | `Chatbot Settings` | `raven-settings` | `modules/settings/ChatSettingsPage` |
| Settings child | `Settings` (catchall) | `raven-settings` | same ChatSettingsPage |
| Settings child | `Connect Google` | (href) | `GET /api/integrations/google/auth` redirect |
| Bottom single | `Logout` | (logout handler) | — |

### Views routed but not reachable from the sidebar

These dispatch via `setCurrentView` calls from inside BusinessDashboard / RealtorDashboard
(they are deeper drill-downs, not first-class sidebar entries):

- `crm-companies` → CompaniesView
- `crm-contacts` → ContactsView
- `crm-deals` → DealsView
- `products` (empty placeholder)
- `orders-vetting` → VettingReportsView
- `orders-bid` → BidComparisonsView
- `orders-dossier` → DossierView
- `history` → HistoryView
- `realtor-dashboard` → RealtorDashboard
- `realtors` → RealtorsView
- `estimate-requests` → EstimateRequestsView
- `outreach-sequences` → SequenceView
- `outreach-templates` → TemplatesView

### Dead code (imported but unrouted)

- `OperationsView` — imported at the top of `App.tsx` but no `currentView === "operations"`
  branch exists in the dispatch. Either remove the import or wire it up.
- `Chat` / `HeroClock` / `ProfilePhoto` — imported; reachable via the chat panel and the
  agenda header, not direct sidebar entries.

## Overlap with raven.alijroberts.com (the hub)

| Surface | In licencee-finder? | In raven? | Recommendation |
|---|---|---|---|
| Media Files (folder tree, upload, share links) | Yes (`/api/media/*`, `media_files` table) | Yes — ported here in last session (own backend, own table) | **REMOVE from licencee-finder sidebar.** Replace with a link-out to raven's Media Files. Keep the API + table for now (data lives there); migrate later if/when ops are consolidated. |
| Operations group | No (dead import only) | No (removed Daedalus + Blueprint last session) | **No-op.** Already gone from both. Just delete the dead `OperationsView` import. |
| Menu / Systems hub (services, bridges, API keys, sidebar-links manager) | No (only the Settings dropdown — Assistant Defaults / Site Editor / Chatbot Settings / Connect Google) | Yes — new in last session, under Menu | **REPLACE licencee-finder Settings dropdown with a single link-out** to raven's Systems hub. Keep `Connect Google` in-place because it's per-instance OAuth state. |
| CRM / Calendar / Email / Orders / Campaign / Data | Yes (full business workspace) | No | **Keep entirely in licencee-finder.** This is the business of this spoke. |

## Removal candidates (if hub-and-spoke is approved)

1. **Sidebar entry "Media Files"** (`src/App.tsx` line 1060-ish) → replace with an
   external link to `https://raven.alijroberts.com/files` (or the equivalent raven route).
2. **Sidebar entry "Settings" dropdown** (`src/App.tsx` line 1075-ish) → collapse to a
   single link-out to `https://raven.alijroberts.com/systems`. Keep `Connect Google`
   inline (per-instance OAuth).
3. **`MediaFiles` + `PhotoGallery` modules** (`src/modules/files/*`) → can be deleted
   after the sidebar entry is removed, IF no other module imports them. (Check
   BusinessDashboard.tsx and any `<MediaFiles />` references before deleting.)
4. **`OperationsView` import** (`src/App.tsx` top) → delete (dead).

## Keep entirely

- `agenda` (NB Roofs | Today)
- `Dashboard` (BusinessDashboard + 4 children)
- `Campaign` (new + per-id)
- `Data` (Scraper / Leads / Enrichment / Pipeline)
- All Dashboard drill-downs (CRM, orders, realtors, outreach, history)
- `Connect Google` (per-instance OAuth)
- `Logout`

## Backend overlap

- `/api/media/*` exists in licencee-finder with its own `media_files` table — independent
  from raven's `media_files` table (different DBs per the IBIS independence rule).
  **Keep the backend in place** even if the UI link is removed; the data is real.
  Cross-subdomain access would require either a CORS-allowed share-link round-trip or a
  proxy on raven that hits ibis. Out of scope for this audit.

## Independence-rule check

Per memory `feedback_ibis_independence`, every IBIS instance must be completely
independent: no shared repo / code / build / DB. The hub-and-spoke plan does **not**
violate this if "hub-and-spoke" means **link-outs**, not shared state. Each spoke keeps
its own deployment, its own DB, its own auth. The hub just becomes the operator's
landing pad for cross-instance navigation. Confirm interpretation before any code
changes.

## Open questions for the build

1. Is the hub-and-spoke pattern **just nav link-outs**, or does it imply any shared
   state (e.g., a unified Media Files view that reads from all spokes)? The independence
   rule strongly implies the former.
2. Should the link-outs open in the same tab or a new tab? Same-tab makes the hub feel
   like one product; new-tab preserves spoke session state.
3. Does raven need a small JSON registry of "which spokes exist and their URLs", or is
   the spoke list hard-coded for now? (Registry would let new IBIS instances self-register.)
4. Does the per-spoke removal need to happen in a single PR per spoke, or can we ship
   the raven-side hub UI first and remove spoke surfaces incrementally?

## Next step

Hand this audit to Jay, get answers to the 4 questions above, then either:

- **Path A:** Wire raven's Systems hub + Media Files as the hub, and ship a one-line
  "back to hub" link in the licencee-finder sidebar without removing anything else.
  Lowest risk, no destructive change to the spoke.
- **Path B:** Full removal in licencee-finder per the recommendations table. Higher
  risk; requires confirming no other modules import MediaFiles/PhotoGallery.

Path A is reversible and safe to ship first. Path B follows once Path A is validated.
