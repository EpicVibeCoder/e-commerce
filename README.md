# E-commerce · Full-stack portfolio

NestJS API · Next.js admin & storefront · Prisma · Postgres · Valkey

One root `.env` powers every app. Run commands from the **repository root** unless noted.

---

## Stack

| App | Path | Tech | Port |
| --- | --- | --- | --- |
| API | [`apps/api`](apps/api) | NestJS 11 · Prisma 7 · Postgres | `3000` |
| Admin | [`apps/admin`](apps/admin) | Next.js 16 | `3001` |
| Storefront | [`apps/storefront`](apps/storefront) | Next.js 16 | `3002` |

| Service | Image | Port |
| --- | --- | --- |
| Postgres | `postgres:18.2-alpine` | `5432` |
| Valkey (Redis-compatible) | `valkey:8.1.5-alpine` | `6379` |

---

## Prerequisites

- **Node.js** ≥ 20.19 (24 recommended for Prisma 7)
- **Docker** (for Postgres + Valkey)
- **npm**

---

## Project layout

```text
e-commerce/
├── .env                    # shared env (gitignored) — copy from .env.example
├── .env.example            # committed template
├── package.json            # root scripts (dev, db:*)
├── docker-compose.yml
└── apps/
    ├── api/
    │   ├── prisma/
    │   │   ├── schema.prisma
    │   │   ├── seed.ts
    │   │   └── migrations/
    │   ├── prisma.config.ts
    │   └── src/
    ├── admin/
    └── storefront/
```

---

## Environment

All apps read the **root** [`.env`](.env), created from [`.env.example`](.env.example).

- Root dev scripts use `dotenv-cli`.
- API uses `@nestjs/config` + [`apps/api/prisma.config.ts`](apps/api/prisma.config.ts).
- Admin & storefront load env via `loadEnvConfig` in each `next.config.ts`.

Do **not** rely on `apps/api/.env` for day-to-day dev — keep a single root file.

| Variable | Used by |
| --- | --- |
| `DATABASE_URL` | API · Prisma |
| `PORT` · `APP_ENV` · `CORS_ORIGINS` | API |
| `NEXT_PUBLIC_API_URL` | Admin · Storefront |
| `REDIS_URL` | API (future cache) |
| Stripe · SSLCommerz · Google OAuth | API / frontends (when implemented) |

See [`.env.example`](.env.example) for the full list and placeholders.

---

## First-time setup

Run each command from the **repo root** (`e-commerce/`).

### 1 · Install dependencies

```bash
npm run install:root
```

```bash
npm run install:api
```

```bash
npm run install:admin
```

```bash
npm run install:storefront
```

Or install everything:

```bash
npm run install:all
```

### 2 · Create environment file

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work with `docker compose`).

### 3 · Start infrastructure

```bash
docker compose up -d
```

### 4 · Database (Prisma)

```bash
npm run db:generate
```

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

---

## Development

Always from **repo root** so root `.env` is loaded.

### Run all apps

```bash
npm run dev
```

### Run one app

```bash
npm run dev:api
```

```bash
npm run dev:admin
```

```bash
npm run dev:storefront
```

When the API starts you should see:

```text
🚀 API started
   env:  development
   port: 3000
   url:  http://localhost:3000/api/v1
```

---

## URLs

| What | URL |
| --- | --- |
| API (base) | http://localhost:3000/api/v1 |
| Admin | http://localhost:3001 |
| Storefront | http://localhost:3002 |

---

## Demo accounts

Available after `npm run db:seed`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@demo.local` | `DemoPassword123!` |
| Customer | `demo@customer.com` | `DemoPassword123!` |

---

## Database commands

All use root `.env`. Run from **repo root**.

| Task | Command |
| --- | --- |
| Generate client | `npm run db:generate` |
| Dev migrations | `npm run db:migrate` |
| Production migrations | `npm run db:migrate:deploy` |
| Seed data | `npm run db:seed` |
| Prisma Studio | `npm run db:studio` |
| Reset DB (destructive) | `npm run db:reset` |

Prisma files:

- Schema — [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma)
- Seed — [`apps/api/prisma/seed.ts`](apps/api/prisma/seed.ts)
- Config — [`apps/api/prisma.config.ts`](apps/api/prisma.config.ts)
- Generated client — `apps/api/src/generated/prisma` (after `db:generate`)

---

## Per-app commands

Run from **repo root** with `dotenv` (API only for db) or `cd` into the app.

### API (`apps/api`)

```bash
npm run start:dev --prefix apps/api
```

```bash
npm run build --prefix apps/api
```

```bash
npm run test --prefix apps/api
```

```bash
npm run lint --prefix apps/api
```

### Admin (`apps/admin`)

```bash
npm run dev --prefix apps/admin
```

```bash
npm run build --prefix apps/admin
```

```bash
npm run lint --prefix apps/admin
```

### Storefront (`apps/storefront`)

```bash
npm run dev --prefix apps/storefront
```

```bash
npm run build --prefix apps/storefront
```

```bash
npm run lint --prefix apps/storefront
```

> Prefer root `npm run dev:*` scripts so `.env` is loaded automatically.

---

## Manual env check

1. Set `NEXT_PUBLIC_API_URL` in root `.env`.
2. Start admin and storefront.
3. Temporarily show `process.env.NEXT_PUBLIC_API_URL` on a page — value should match `.env`.
4. Change `PORT` in `.env`, restart API — startup log should show the new port.

---

## Troubleshooting

| Problem | What to try |
| --- | --- |
| Prisma / Node version error | Use Node ≥ 20.19 (`nvm use 24`) |
| API won’t start / env validation | Confirm root `.env` exists; `APP_ENV`, `PORT`, `DATABASE_URL`, `CORS_ORIGINS` set |
| DB connection failed | `docker compose up -d` and check `DATABASE_URL` |
| Seed import errors | Run `npm run db:generate` before `npm run db:seed` |
| Frontends missing API URL | Set `NEXT_PUBLIC_API_URL` in root `.env` and restart |

---

## License

Private portfolio project — all rights reserved unless stated otherwise.
