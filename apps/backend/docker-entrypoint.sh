#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npx prisma db seed || echo "⚠️  Seed failed or already seeded, continuing..."

echo "🚀 Starting application..."
exec npm run start:prod