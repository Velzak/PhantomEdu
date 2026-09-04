# Phantom

A self-hosted catalog of original, single-file HTML5 games. Visitors browse, play, favorite, and rate in the browser. An admin uploads a `.html` file and the game is playable immediately.

This is not a scrape of anyone else's library. The five seed games ship in this repository and were written for it.

## Prerequisites

- Node.js 20 LTS
- npm
- (Optional) Docker + Docker Compose for the VPS path

## Local development

```bash
npm install
cp .env.example .env
```

Edit `.env`:

- Set `NEXTAUTH_SECRET` (`openssl rand -base64 32`)
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (the seed script hashes the password and never stores the plaintext)
- Leave `DATABASE_URL` as `file:../data/db.sqlite` — Prisma resolves that path relative to `prisma/schema.prisma`, so the file lands in `data/db.sqlite`

Then:

```bash
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin is at `/admin/login`.

`data/` is gitignored. Seeding recreates the five demo games under `data/games/<slug>/index.html` using the same `entryPath` / `sourceType` shape as an admin upload.

## Production build (bare metal)

```bash
npx prisma migrate deploy
npm run seed
npm run build
npm start
```

SQLite and uploaded files live on disk. Do not deploy this to a serverless host with an ephemeral filesystem (including Vercel). Use a small VPS, or Railway / Render / Fly.io **with a persistent volume** mounted at the paths in `.env`.

## Docker

```bash
docker compose up --build
```

The app container mounts a `game-data` volume at `/data` for `db.sqlite`, uploaded games, and thumbnails. Caddy is available as an optional TLS profile:

```bash
docker compose --profile tls up --build -d
```

Edit `Caddyfile` with your hostname first.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite file URL. Relative to `prisma/` (`file:../data/db.sqlite`). |
| `NEXTAUTH_SECRET` | JWT signing secret. |
| `NEXTAUTH_URL` | Public origin, e.g. `http://localhost:3000`. |
| `ADMIN_EMAIL` | Seeded admin email. Only read by `npm run seed`. |
| `ADMIN_PASSWORD` | Seeded admin password. Only read by `npm run seed`. |
| `GAMES_STORAGE_PATH` | Directory for uploaded `index.html` files. |
| `THUMBNAILS_STORAGE_PATH` | Directory for thumbnail images. |
| `MAX_UPLOAD_SIZE_MB` | Upload cap (default `15`). |
| `FEATURE_RATINGS_ENABLED` | Set `false` to hide ratings without a code change. |
| `GAMES_BASE_URL` | Optional. Prefix for game iframe URLs when you later serve playable files from another origin. |

## Admin accounts

The first admin is created by `npm run seed` from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Re-running seed will not overwrite an existing password hash for that email.

To add another admin later, hash a password and insert a row:

```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 12))"
```

```sql
INSERT INTO AdminUser (id, email, passwordHash, createdAt)
VALUES (lower(hex(randomblob(12))), 'second@localhost', '<hash>', datetime('now'));
```

Or insert via Prisma Studio (`npx prisma studio`).

## Adding a game

1. Sign in at `/admin/login`.
2. Open **Add game**.
3. Fill in title, slug, description, category, and optional tags / controls / thumbnail.
4. Attach one `.html` file (inline JS/CSS, no relative asset fetches — the player iframe omits `allow-same-origin`).
5. Publish. The file is stored at `$GAMES_STORAGE_PATH/<slug>/index.html` and served from `/games-content/<slug>/index.html`.

## Search

`GET /api/search` matches title, description, category, tags, and developer with SQLite `contains`. That is enough for a self-hosted catalog of this size. If the library grows very large, SQLite FTS5 or a hosted search service is the natural upgrade — not built here.

## Production hardening for game files

Game HTML is served from the same origin today, sandboxed without `allow-same-origin`, so scripts inside a game cannot read this site's cookies.

When you go public, point `GAMES_BASE_URL` at a dedicated play origin (for example `https://play.yourdomain.com`) and have Nginx or Caddy serve `$GAMES_STORAGE_PATH` directly. Then even a future format that needs `allow-same-origin` still cannot reach session cookies on the main site.

## Out of scope in v1

User accounts, synced favorites, leaderboards, comments, zip/embed game sources, and a public submission pipeline. The `sourceType` + `entryPath` fields and a commented `Score` model are the expansion hooks.
