# E-commerce Monorepo

Turborepo monorepo with a NestJS API, Next.js storefront and admin, shared Prisma database package, and internal UI/config packages. `apps/mobile` is a placeholder and is excluded from build, lint, and type-check tasks until it is implemented.

## Prerequisites

- **Node.js** ≥ 24 ([`package.json`](package.json) `engines`; use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) if needed)
- **npm** 11+ (repo pins `npm@11.10.0` via `packageManager`)
- **Docker** — local Postgres 18 and Valkey 8 (Redis-compatible)

## First-time setup

From the repository root:

```bash
# 1. Environment
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and REDIS_URL (defaults match docker-compose below)

# 2. Infrastructure
docker compose up -d

# 3. Dependencies
npm install

# 4. Database client and migrations
npm run db:generate
npm run db:migrate
```

`db:*` scripts load `.env` from the repo root via `dotenv-cli`. Do not commit `.env`.

### Minimum `.env` for local dev

| Variable | Example | Required for |
|----------|---------|----------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/ecommerce` | Prisma, API |
| `REDIS_URL` | `redis://localhost:6379` | Future cache/sessions |

Optional (leave empty until you implement those features):

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe |
| `SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWD` / `SSLCOMMERZ_IS_LIVE` | SSLCommerz |

## Run the project

### All apps (Turbo)

Starts every workspace that defines a `dev` script (API, web, admin; not mobile):

```bash
npm run dev
```

### One app

```bash
npm run dev -- --filter=api
npm run dev -- --filter=web
npm run dev -- --filter=admin
```

### Local URLs

| App | URL | Package |
|-----|-----|---------|
| Storefront | http://localhost:3001 | `apps/web` |
| Admin | http://localhost:3002 | `apps/admin` |
| API | http://localhost:3000 | `apps/api` |
| Prisma Studio | (CLI opens browser) | `npm run db:studio` |

Postgres: `localhost:5432` (db `ecommerce`, user/password `postgres` by default).  
Valkey: `localhost:6379`.

### Production-style run (single app)

After a build:

```bash
npm run build -- --filter=web
npm run start --workspace=web
```

Same pattern for `admin` (`start` on port 3002) and `api` (`nest start` / built output in `apps/api/dist`).

## Database

- **Schema:** [`packages/database/prisma/schema.prisma`](packages/database/prisma/schema.prisma)
- **CLI config:** [`packages/database/prisma.config.ts`](packages/database/prisma.config.ts) (uses `DATABASE_URL` from `.env`)
- **Migrations:** [`packages/database/prisma/migrations`](packages/database/prisma/migrations)

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client into `packages/database/generated/` |
| `npm run db:migrate` | Apply migrations locally (`prisma migrate dev`; prompts for new migration names when the schema changes) |
| `npm run db:seed` | Run seed script (when configured in the database package) |
| `npm run db:studio` | Open Prisma Studio |

After pulling schema changes: `npm run db:generate` then `npm run db:migrate`.

**CI / production deploys** should use `prisma migrate deploy` (not `migrate dev`) with the same `prisma.config.ts`.

## Quality checks

| Command | Description |
|---------|-------------|
| `npm run validate` | `format:check` → `lint` → `check-types` → `test` → `build` |
| `npm run lint` | ESLint (excludes `mobile`) |
| `npm run check-types` | TypeScript / Next typegen (excludes `mobile`) |
| `npm run test` | Jest across workspaces |
| `npm run build` | Build packages and apps (excludes `mobile`) |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |

Requires Docker + `.env` + `npm run db:generate` before `check-types`, `test`, or `build` if the database package has not been generated yet.

## Repository layout

### Apps

| Path | Stack | Notes |
|------|-------|-------|
| [`apps/api`](apps/api) | NestJS 11 | REST API; Prisma via `@repo/database` |
| [`apps/web`](apps/web) | Next.js 16 | Storefront, port **3001** |
| [`apps/admin`](apps/admin) | Next.js 16 | Admin panel, port **3002** |
| [`apps/mobile`](apps/mobile) | — | Placeholder; not wired into Turbo quality tasks yet |

### Packages

| Path | Role |
|------|------|
| [`packages/database`](packages/database) | Prisma schema, client, migrations |
| [`packages/shared`](packages/shared) | Shared enums, types, DTOs |
| [`packages/ui`](packages/ui) | Shared React components |
| [`packages/eslint-config`](packages/eslint-config) | ESLint presets (`base`, `next-js`, `nest`, `react-internal`) |
| [`packages/typescript-config`](packages/typescript-config) | Shared `tsconfig` bases |
| [`packages/jest-config`](packages/jest-config) | Shared Jest config |

## Troubleshooting

**`db:generate` or API fails on database connection**

- Ensure `docker compose up -d` and containers are healthy: `docker compose ps`
- Confirm `DATABASE_URL` in `.env` matches compose (host `localhost`, port `5432`, db `ecommerce`)

**`check-types` or `build` cannot find `@repo/database`**

- Run `npm run db:generate` then `npm run build -- --filter=@repo/database` (or `npm run build` at root)

**Port already in use**

- Change ports in `apps/web/package.json` (`--port 3001`), `apps/admin` (`3002`), or `apps/api/src/main.ts` (`3000`)

**Prisma client out of date after git pull**

```bash
npm run db:generate
npm run db:migrate
```

## Useful links

- [Turborepo](https://turbo.build/repo/docs)
- [Prisma](https://www.prisma.io/docs)
- [NestJS](https://docs.nestjs.com)
- [Next.js](https://nextjs.org/docs)
