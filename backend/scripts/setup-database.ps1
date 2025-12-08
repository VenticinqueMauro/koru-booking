# Koru Booking - Database Setup Script (PowerShell)
# Este script inicializa la base de datos PostgreSQL en Supabase

$ErrorActionPreference = "Stop"

Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Koru Booking - Database Setup                       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
  Write-Host "❌ Error: .env file not found" -ForegroundColor Red
  Write-Host ""
  Write-Host "Please copy .env.example to .env and fill in your credentials:"
  Write-Host "  Copy-Item .env.example .env"
  Write-Host ""
  exit 1
}

# Check if DATABASE_URL contains placeholder
$envContent = Get-Content .env -Raw
if ($envContent -match "your-secure-password") {
  Write-Host "❌ Error: .env file contains placeholder values" -ForegroundColor Red
  Write-Host ""
  Write-Host "Please update .env with your actual Supabase credentials."
  Write-Host "See SETUP_SUPABASE.md for instructions."
  Write-Host ""
  exit 1
}

Write-Host "✓ .env file found and configured" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
Write-Host ""

# Generate Prisma Client
Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
Write-Host ""

# Run migrations
Write-Host "🚀 Running database migrations..." -ForegroundColor Yellow
npx prisma migrate deploy
Write-Host ""

# Optional: Seed database
$seed = Read-Host "Do you want to seed the database with sample data? (y/n)"
if ($seed -eq "y" -or $seed -eq "Y") {
  Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
  npx prisma db seed
  Write-Host ""
}

# Open Prisma Studio
$studio = Read-Host "Do you want to open Prisma Studio to view the database? (y/n)"
if ($studio -eq "y" -or $studio -eq "Y") {
  Write-Host "🎨 Opening Prisma Studio..." -ForegroundColor Yellow
  npx prisma studio
} else {
  Write-Host ""
  Write-Host "✅ Database setup complete!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Next steps:"
  Write-Host "  1. Run 'npm run dev' to start the API server"
  Write-Host "  2. Run 'npx prisma studio' to view/edit data"
  Write-Host ""
}
