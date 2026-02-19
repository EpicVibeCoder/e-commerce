# E-commerce Monorepo

Turborepo monorepo: NestJS API, Next.js storefront & admin, React Native mobile, shared database (Prisma) and packages.

## Prerequisites

- **Node.js** ≥ 24
- **Docker** (for local Postgres and Redis/Valkey)

## Environment

1. **Copy the example env file** and fill in values:

   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`:**

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `DATABASE_URL` | Yes | Postgres connection string, e.g. `postgresql://postgres:postgres@localhost:5432/ecommerce` |
   | `REDIS_URL` | Yes | Redis/Valkey URL, e.g. `redis://localhost:6379` |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | For OAuth | From [Google Cloud Console](https://console.cloud.google.com/) |
   | `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For payments | From [Stripe Dashboard](https://dashboard.stripe.com/) |
   | `SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWD` | For SSLCommerz | Sandbox values for dev; set `SSLCOMMERZ_IS_LIVE=false` locally |

   Root scripts (`db:*`, `dev`, etc.) load `.env` via `dotenv-cli`; keep `.env` at repo root and do not commit it.

## Quick start

```bash
# Start Postgres and Redis (Valkey)
docker compose up -d

# Install dependencies
npm install

# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate

# Run all apps in dev (web, api, etc.)
npm run dev
```

## Database and schema

- **Schema:** `packages/database/prisma/schema.prisma`
- **Config:** `packages/database/prisma.config.ts` (connection URL for Prisma CLI; uses `DATABASE_URL` from `.env`)

From repo root:

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Apply migrations (interactive; creates new migrations when schema changes) |
| `npm run db:seed` | Run seed script (when configured) |
| `npm run db:studio` | Open Prisma Studio in the browser |

Migrations are stored in `packages/database/prisma/migrations`. Run `db:migrate` after pulling schema changes.

## What's inside

### Apps

- **`apps/api`** – NestJS API (REST/GraphQL)
- **`apps/web`** – Next.js storefront
- **`apps/admin`** – Next.js admin panel
- **`apps/mobile`** – React Native / Expo app

### Packages

- **`packages/database`** – Prisma schema, client, migrations
- **`packages/shared`** – Shared enums, types, DTOs
- **`packages/ui`** – Shared React components
- **`packages/typescript-config`** / **`packages/eslint-config`** – Shared configs

## Scripts (root)

| Script | Description |
|--------|-------------|
| `npm run dev` | Run dev for all apps (Turbo) |
| `npm run build` | Build all packages and apps |
| `npm run lint` | Lint all workspaces |
| `npm run check-types` | Type-check all workspaces |
| `npm run test` | Run tests in all workspaces |
| `npm run test:coverage` | Run tests with coverage |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |

To run a single app: `npm run dev -- --filter=web` (or `api`, `admin`, etc.).

## Useful links

- [Turborepo docs](https://turbo.build/repo/docs)
- [Prisma docs](https://www.prisma.io/docs)
