# Changelog

## [Unreleased]

## [0.2.0] - 2026-04-18
### Changed
- Rebranded welcome screen from PAGIOS to RAVEN
  - Headliner: RAVEN
  - Subheader: Recursive Autonomous Vectorized Execution Network
  - Footer: Presented by PAGIOSystems | Private Advanced Gradient Intelligence Operating Systems
- Page title changed to "RAVEN"
- Background image updated to raven.png (replaces logo.PNG reference in App.tsx)
- Favicon set to raven.png

### Added
- `scripts/upload-server.py` — standalone Python upload server (port 8888, one-time use for asset delivery)
- `client/public/` directory now tracked in git (gitignore updated from `public/` to `server/public/`)

### Fixed
- `.gitignore` was blocking `client/public/` — corrected to only ignore `server/public/`

## [0.1.0] - 2026-04-18
### Added
- Phase 0 foundation: Fastify + TypeScript server, React + Vite client, PostgreSQL
- Full onboarding flow (6 steps + review): name, phone, email, address, profile image, space name
- Custom profile image crop editor (no library)
- Welcome screen, nav (back/skip/reset), step shell
- Home screen: brand logo background, profile photo, space name, palette dots, Continue button
- Migrations 001–007: init, onboarding, fields, contact tables, address country, space name, branding
- Nginx + SSL (Let's Encrypt) at ajrcentralcommand.com
- PM2 process `ajr-central` on ZEUS port 3200
- GitHub auto-sync cron every 5 min
- AI color extraction from logo via Gemini (`POST /api/ai/colors`)
- Git tag: `milestone/onboarding-locked`
