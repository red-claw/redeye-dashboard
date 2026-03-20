# redeye dashboard

Internal dashboard for infrastructure and project status at [dashboard.redeye.dev](https://dashboard.redeye.dev).

## Features

- **Infrastructure** — PM2 process list, CPU/memory/disk from redeye-new via SSH
- **Projects** — Open PRs (GitHub) + in-progress Linear issues (team RED)
- **App Status** — Live health checks for mods, happyhour, concerts + upcoming concert count
- **Infrastructure Status** — DNS migration tracker, SSL cert expiry, SES verification

## Setup

### Prerequisites

- Node.js 18+
- SSH access to `redeye-new` configured (`~/.ssh/config`)
- AWS credentials (default chain, used for SES checks)
- `gh` CLI authenticated (for GitHub token fallback)

### Install

```bash
npm install
cp .env.example .env.local
# Fill in .env.local
```

### Required env vars

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Public URL (`https://dashboard.redeye.dev`) |
| `GITHUB_TOKEN` | GitHub PAT (falls back to `gh auth token`) |
| `LINEAR_API_KEY` | Linear API key |
| `ICAL_FEED_URL` | iCal feed for concerts (optional, has default) |

### Development

```bash
npm run dev
# http://localhost:3000
```

### Production (PM2)

```bash
npm run build
pm2 start pm2.config.js
```

Runs on port **3010**. Nginx should proxy `dashboard.redeye.dev` → `localhost:3010`.

## Auth

Google OAuth restricted to `greg@redeyedev.io`. Anyone else gets a 403.
