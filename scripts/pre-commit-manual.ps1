# Manual pre-commit verification script for Windows
# Run this before committing: .\scripts\pre-commit-manual.ps1

Write-Host "🔍 Running pre-commit checks..." -ForegroundColor Cyan
Write-Host ""

# Check TypeScript
Write-Host "📝 Type checking..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ TypeScript errors found!" -ForegroundColor Red
  exit 1
}

# Lint
Write-Host "🎨 Linting..." -ForegroundColor Yellow
npx eslint . --fix
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ ESLint errors found!" -ForegroundColor Red
  exit 1
}

# Format with Prettier
Write-Host "✨ Formatting..." -ForegroundColor Yellow
npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,md}"
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Prettier errors found!" -ForegroundColor Red
  exit 1
}

# Run tests
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
npx vitest run
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Tests failed!" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "✅ All pre-commit checks passed!" -ForegroundColor Green
Write-Host "You can now safely commit your changes." -ForegroundColor Green
