#!/bin/bash
set -e

echo "🔄 Running Prisma migrations..."
npx prisma generate
echo "📊 Applying migrations to database..."
npx prisma migrate deploy
echo "✅ Migrations completed successfully!"
echo "🚀 Ready to deploy to Vercel"
