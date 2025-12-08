#!/bin/bash

# Koru Booking - Database Setup Script
# Este script inicializa la base de datos PostgreSQL en Supabase

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════╗"
echo "║  Koru Booking - Database Setup                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  echo ""
  echo "Please copy .env.example to .env and fill in your credentials:"
  echo "  cp .env.example .env"
  echo ""
  exit 1
fi

# Check if DATABASE_URL is set
if grep -q "your-secure-password" .env; then
  echo "❌ Error: .env file contains placeholder values"
  echo ""
  echo "Please update .env with your actual Supabase credentials."
  echo "See SETUP_SUPABASE.md for instructions."
  echo ""
  exit 1
fi

echo "✓ .env file found and configured"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo ""

# Run migrations
echo "🚀 Running database migrations..."
npx prisma migrate deploy
echo ""

# Optional: Seed database
read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "🌱 Seeding database..."
  npx prisma db seed
  echo ""
fi

# Open Prisma Studio
read -p "Do you want to open Prisma Studio to view the database? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "🎨 Opening Prisma Studio..."
  npx prisma studio
else
  echo ""
  echo "✅ Database setup complete!"
  echo ""
  echo "Next steps:"
  echo "  1. Run 'npm run dev' to start the API server"
  echo "  2. Run 'npx prisma studio' to view/edit data"
  echo ""
fi
