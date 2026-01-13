# Vercel pre-deployment migration script (Windows PowerShell)
# Run this BEFORE deploying to Vercel

Write-Host "🔄 Running Prisma migrations..." -ForegroundColor Cyan

# Generate Prisma client
npx prisma generate

# Run migrations using DIRECT_DATABASE_URL
Write-Host "📊 Applying migrations to database..." -ForegroundColor Cyan
npx prisma migrate deploy

Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
Write-Host "🚀 Ready to deploy to Vercel" -ForegroundColor Green
