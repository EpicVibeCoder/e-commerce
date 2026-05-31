# E-commerce Monorepo

Turborepo monorepo with a NestJS API, Next.js storefront and admin, shared Prisma database package, and internal UI/config packages. `apps/mobile` is a placeholder and is excluded from build, lint, and type-check tasks until it is implemented.

## Prerequisites

- **Node.js** ≥ 24 ([`package.json`](package.json) `engines`; use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) if needed)
- **npm** 11+ (repo pins `npm@11.10.0` via `packageManager`)
- **Docker** — local Postgres 18 and Valkey 8 (Redis-compatible)

## First-time setup

From the repository root. Run each command in order (one block = one copy-paste).

**1. Environment** — copy the template, then edit `.env` with required variables (see table below).

```bash
cp .env.example .env
```

**2. Dependencies** — installs `dotenv-cli`, `tsx`, `turbo`, etc.

```bash
npm install
```

**3. Verify `.env`**

```bash
npm run env:check
```

**4. Infrastructure** — Postgres 18 + Valkey 8 (requires Docker running).

```bash
docker compose up -d
```

**5. Database client**

```bash
npm run db:generate
```

**6. Migrations**

```bash
npm run db:migrate
```

**7. Seed demo data**

```bash
npm run db:seed
```

`db:*`, `dev`, `build`, and `test` load `.env` from the repo root via `dotenv-cli` (requires `npm install` first). Do not commit `.env`.

**Demo accounts** (after seed): `admin@demo.local` / `demo@customer.com` — password `DemoPassword123!`

## Environment variables

One root [`.env.example`](.env.example) drives the whole monorepo. After `npm install`, run `npm run env:check` before `dev` or `build` to catch missing required values early (with suggested defaults printed to the console).

**Do not put `NODE_ENV` in `.env`.** Next.js and Node set `NODE_ENV` automatically (`development` for dev, `production` for builds). Use `APP_ENV` for application-level environment config in the API.

### Required

| Variable | Example | Used by |
|----------|---------|---------|
| `APP_ENV` | `development` | API config (`development` \| `production` \| `test`) |
| `PORT` | `3000` | API listen port |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/ecommerce` | Prisma, API |
| `CORS_ORIGINS` | `http://localhost:3001,http://localhost:3002` | API CORS (comma-separated) |

### Optional

| Variable | Example | Notes |
|----------|---------|-------|
| `REDIS_URL` | `redis://localhost:6379` | Validated when set; required once cache is implemented |
| `JWT_SECRET` | (32+ chars) | Required by API when `APP_ENV=production` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | Google OAuth (future) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | — | Stripe (future) |
| `SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWD` / `SSLCOMMERZ_IS_LIVE` | — | SSLCommerz (future) |

Env specs live in [`packages/shared/src/env-spec.ts`](packages/shared/src/env-spec.ts). The API validates format at boot via `@nestjs/config` + `class-validator` in [`apps/api/src/config/env.validation.ts`](apps/api/src/config/env.validation.ts).

## Run the project

### All apps (Turbo)

Starts every workspace that defines a `dev` script (API, web, admin; not mobile). Runs `env:check` first.

```bash
npm run dev
```

### One app

**API**

```bash
npm run dev -- --filter=api
```

**Storefront**

```bash
npm run dev -- --filter=web
```

**Admin**

```bash
npm run dev -- --filter=admin
```

### Local URLs

| App | URL | Package |
|-----|-----|---------|
| Storefront | http://localhost:3001 | `apps/web` |
| Admin | http://localhost:3002 | `apps/admin` |
| API (base) | http://localhost:3000/api/v1 | `apps/api` |
| Prisma Studio | (CLI opens browser) | `npm run db:studio` |

Postgres: `localhost:5432` (db `ecommerce`, user/password `postgres` by default).  
Valkey: `localhost:6379`.

### Production-style run (single app)

After a build, example for the storefront:

```bash
npm run build -- --filter=web
```

```bash
npm run start --workspace=web
```

Same pattern for `admin` (`start` on port 3002) and `api` (built output in `apps/api/dist`):

```bash
npm run build -- --filter=admin
```

```bash
npm run start --workspace=admin
```

```bash
npm run build -- --filter=api
```

```bash
npm run start --workspace=api
```

## API (`apps/api`)

Current baseline (Phase 0):

- Global prefix **`/api/v1`**
- **`ValidationPipe`** on all request DTOs (whitelist, transform)
- **`ConfigModule`** with env validation at startup (fail fast on missing/invalid config)
- **CORS** allowlist from `CORS_ORIGINS`
- Prisma via [`@repo/database`](packages/database)

## Database

- **Schema:** [`packages/database/prisma/schema.prisma`](packages/database/prisma/schema.prisma)
- **CLI config:** [`packages/database/prisma.config.ts`](packages/database/prisma.config.ts) (uses `DATABASE_URL` from `.env`)
- **Migrations:** [`packages/database/prisma/migrations`](packages/database/prisma/migrations)
- **Seed:** [`packages/database/prisma/seed.ts`](packages/database/prisma/seed.ts) — demo users, nested categories, sample products

Domain enums (`OrderStatus`, `ProductStatus`, etc.) are defined in the Prisma schema. Apps import them from `@repo/shared` (re-exported from Prisma). After changing enums: `npm run db:migrate` → `npm run db:generate` → `npm run build`.

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client into `packages/database/generated/` |
| `npm run db:migrate` | Apply migrations locally (`prisma migrate dev`) |
| `npm run db:seed` | Run seed script |
| `npm run db:studio` | Open Prisma Studio |

After pulling schema changes: `npm run db:generate` then `npm run db:migrate`.

**CI / production deploys** should use `prisma migrate deploy` (not `migrate dev`) with the same `prisma.config.ts`.

## Quality checks

| Command | Description |
|---------|-------------|
| `npm run env:check` | Validate required `.env` variables (runs automatically before `dev` and `build`) |
| `npm run validate` | `format:check` → `lint` → `check-types` → `test` → `build` |
| `npm run lint` | ESLint (excludes `mobile`) |
| `npm run check-types` | TypeScript / Next typegen (excludes `mobile`) |
| `npm run test` | Jest across workspaces |
| `npm run build` | Build packages and apps (excludes `mobile`; runs `env:check` first) |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |

Requires Docker + `.env` + `npm run db:generate` before `check-types`, `test`, or `build` if the database package has not been generated yet.

## Repository layout

### Apps

| Path | Stack | Notes |
|------|-------|-------|
| [`apps/api`](apps/api) | NestJS 11 | REST API at `/api/v1`; Prisma via `@repo/database` |
| [`apps/web`](apps/web) | Next.js 16 | Storefront, port **3001** |
| [`apps/admin`](apps/admin) | Next.js 16 | Admin panel, port **3002** |
| [`apps/mobile`](apps/mobile) | — | Placeholder; not wired into Turbo quality tasks yet |

### Packages

| Path | Role |
|------|------|
| [`packages/database`](packages/database) | Prisma schema, client, migrations, seed |
| [`packages/shared`](packages/shared) | Shared enums, types, env specs (`env-spec.ts`) |
| [`packages/ui`](packages/ui) | Shared React components |
| [`packages/eslint-config`](packages/eslint-config) | ESLint presets (`base`, `next-js`, `nest`, `react-internal`) |
| [`packages/typescript-config`](packages/typescript-config) | Shared `tsconfig` bases |
| [`packages/jest-config`](packages/jest-config) | Shared Jest config |

### Scripts

| Path | Role |
|------|------|
| [`scripts/check-env.ts`](scripts/check-env.ts) | Root env validation entrypoint (used by `npm run env:check`) |

## Troubleshooting

**Missing environment variables / `env:check` fails**

- Copy [`.env.example`](.env.example) to `.env` and fill required vars (`APP_ENV`, `PORT`, `DATABASE_URL`, `CORS_ORIGINS`)

```bash
cp .env.example .env
```

```bash
npm run env:check
```

- Do **not** add `NODE_ENV` to `.env`; it breaks Next.js production builds

**`db:generate` or API fails on database connection**

- Ensure Docker is running, then start containers:

```bash
docker compose up -d
```

```bash
docker compose ps
```

- Confirm `DATABASE_URL` in `.env` matches compose (host `localhost`, port `5432`, db `ecommerce`)

**`check-types` or `build` cannot find `@repo/shared` / `@repo/database`**

```bash
npm run build -- --filter=@repo/shared
```

```bash
npm run db:generate
```

Or build everything at root:

```bash
npm run build
```

**Next.js build fails with `useContext` / non-standard `NODE_ENV`**

- Remove `NODE_ENV` from `.env` if present; use `APP_ENV` instead

**Port already in use**

- Change `PORT` in `.env` for the API, or ports in `apps/web/package.json` (`3001`) and `apps/admin` (`3002`)

**Prisma client out of date after git pull**

```bash
npm run db:generate
```

```bash
npm run db:migrate
```

## Useful links

- [Turborepo](https://turbo.build/repo/docs)
- [Prisma](https://www.prisma.io/docs)
- [NestJS](https://docs.nestjs.com)
- [Next.js](https://nextjs.org/docs)
