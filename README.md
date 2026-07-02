# SLAP 🫸

> **The sticker pack platform for WhatsApp — discover, create, and share animated sticker packs.**

Slap is a community-driven Android app where creators upload sticker packs and users can browse, save, and export them directly to WhatsApp. Built with a modern TypeScript monorepo — Expo on the client, Elysia on the server, Cloudflare R2 for storage, and Redis for trending feeds.

---

## Features

- **Discover** — Browse trending and new sticker packs with a masonry-style grid feed
- **Search** — Full-text search across pack names, tags, and categories
- **Pack detail** — Preview all stickers in a pack; copy individual stickers to clipboard, share to WhatsApp, or save to gallery
- **WhatsApp export** — One-tap export of a full sticker pack to WhatsApp via `react-native-wa-stickers-animated`
- **Upload** — Creators can upload packs of up to 30 stickers (any image format; server converts to WebP at ≤1.5 MB, max 1024 × 1024)
- **Vault (Saves)** — Bookmark packs for quick access later
- **Profile** — Public creator profiles with avatar, bio, and published packs
- **Trending** — Redis-cached trending algorithm based on downloads and saves
- **Auth** — Email OTP (Resend) and Discord OAuth via Better Auth

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.85 · Expo 56 · Expo Router · React Native Reanimated 4 |
| Styling | React Native Unistyles 3 |
| State / Data | TanStack Query 5 · oRPC |
| Auth | Better Auth · Email OTP (Resend) · Discord OAuth |
| Backend | Elysia · Bun runtime |
| API layer | oRPC (type-safe, no codegen) |
| Database | PostgreSQL (Prisma + `@prisma/adapter-pg`) |
| Storage | Cloudflare R2 (via `aws4fetch`) |
| Image processing | Sharp (server-side WebP conversion) |
| Background jobs | BullMQ + Redis |
| Trending cache | Redis |
| Monorepo | Nx + Bun workspaces |
| Package manager | Bun |

---

## Monorepo Structure

```
slap/
├── apps/
│   ├── native/          # Expo Android app
│   │   ├── app/         # Expo Router screens (file-based routing)
│   │   │   ├── (auth)/  # Auth screens (email OTP, Discord)
│   │   │   ├── (tabs)/  # Main tabs: Discover, Upload, Vault, Profile
│   │   │   ├── pack/    # Pack detail screen [id].tsx
│   │   │   └── user/    # Public user profile [userId].tsx
│   │   ├── components/  # Shared UI components
│   │   └── utils/       # sticker-actions, download, whatsapp helpers
│   └── server/          # Elysia HTTP server
├── packages/
│   ├── api/             # oRPC routers, image processing, queues, storage
│   ├── auth/            # Better Auth configuration
│   ├── db/              # Prisma schema + generated client
│   ├── env/             # Type-safe env validation (@t3-oss/env-core)
│   └── config/          # Shared TypeScript / Biome configs
└── nx.json
```

---

## Prerequisites

- **Bun** ≥ 1.1 — [bun.sh](https://bun.sh)
- **Node** ≥ 20 (for Expo CLI tooling)
- **Android Studio** + Android SDK (API 33+)
- **PostgreSQL** 15+ running locally (or remote)
- **Redis** 7+ running locally
- **Cloudflare R2** bucket with public URL enabled
- **Resend** account for email OTP
- **Discord OAuth** app (optional — needed for Discord login)

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/slap.git
cd slap
bun install
```

### 2. Configure environment variables

```bash
cp apps/server/.env.example apps/server/.env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random secret ≥ 32 chars — `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Public URL of your backend (e.g. `http://localhost:3000`) |
| `CORS_ORIGIN` | Frontend origin (Expo dev URL or production URL) |
| `DISCORD_CLIENT_ID` | Discord OAuth app client ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth app client secret |
| `REDIS_URL` | Redis connection URL (default: `redis://localhost:6379`) |
| `RESEND_API_KEY` | Resend API key for sending OTP emails |
| `RESEND_FROM_EMAIL` | Verified sender email address |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token key ID |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | R2 bucket name (default: `slap-assets`) |
| `R2_PUBLIC_URL` | Public CDN URL for your R2 bucket |

### 3. Set up the database

```bash
cd packages/db
bunx prisma db push

# Optional: seed with sample data
bun run seed
```

### 4. Start the backend

```bash
cd apps/server
bun run dev
# Server starts on http://localhost:3000
```

### 5. Start the Expo app

```bash
cd apps/native
bunx expo run:android
```

> Make sure an Android emulator is running or a physical device is connected via ADB.

---

## Architecture Overview

```
Android App (Expo)
      │
      │  oRPC (type-safe HTTP)
      ▼
Elysia Server (Bun)
      │
      ├── Better Auth     ──► PostgreSQL (users, sessions)
      ├── oRPC Routers    ──► PostgreSQL (packs, stickers, saves, tags)
      ├── BullMQ Worker   ──► Redis (image-process queue)
      │        │
      │        └──► Sharp (WebP conversion, resize ≤1024px, ≤1.5MB)
      └── Trending Worker ──► Redis (pre-computed trending pack IDs)
                │
                └──► Cloudflare R2 (WebP sticker storage)
                           │
                           └──► Public CDN URL (served directly to app)
```

**Sticker upload flow:**
1. User selects up to 30 images (any format) in the Upload tab
2. Files are sent to the server as multipart form data via oRPC
3. Server enqueues each sticker into BullMQ (`image-process` queue)
4. Worker converts to WebP (Sharp), resizes to ≤1024px, compresses to ≤1.5MB
5. WebP is uploaded to Cloudflare R2; public URL stored in PostgreSQL
6. Pack status flips to `READY` once all stickers are processed

**Trending feed flow:**
1. Every download and save increments counters on the pack row
2. A BullMQ worker (`trending-recalc`) periodically scores packs and writes ordered IDs to Redis (`slap:trending:cache`)
3. The Discover feed reads from cache; falls back to `ORDER BY downloads DESC` on cache miss

---

## Sticker Pack Rules

| Rule | Limit |
|---|---|
| Stickers per pack | Max 30 |
| Accepted input formats | Any (JPEG, PNG, GIF, WebP, AVIF, etc.) |
| Output format | WebP (server-converted) |
| Max output dimensions | 1024 × 1024 px |
| Max output file size | 1.5 MB per sticker |
| Pack name | 1–80 characters |
| Pack description | Max 500 characters |
| Tags per pack | Max 12 |

---

## API

The backend exposes a type-safe oRPC API. All routes are defined in `packages/api/src/routers/`.

```
appRouter
├── healthCheck
├── checkEmail
├── packs         list · get · search · create · trending
├── stickers      upload
├── saves         save · unsave · list
├── download      trackDownload
├── tags          list
├── categories    list
└── profile       get · update · packs
```

Public procedures require no authentication. Protected procedures require a valid Better Auth session cookie.

---

## Contributing

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Follow conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
3. Run the formatter before committing: `bunx biome check --write .`
4. Open a PR describing the change and link any related issues

---

## Future Scope

- iOS support
- Animated sticker packs (WEBP/APNG/Lottie)
- Creator analytics dashboard
- Pack collections and playlists
- In-app sticker search with visual similarity
- Push notifications for new packs from followed creators
- Deployment: Cloudflare Workers (server) + managed PostgreSQL

---

## License

All rights reserved. Not open for public use at this time.
