#!/bin/bash
# Manual pre-commit verification script
# Run this before committing: bash scripts/pre-commit-manual.sh

echo "🔍 Running pre-commit checks..."
echo ""

# Check TypeScript
echo "📝 Type checking..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found!"
  exit 1
fi

# Lint
echo "🎨 Linting..."
npx eslint . --fix
if [ $? -ne 0 ]; then
  echo "❌ ESLint errors found!"
  exit 1
fi

# Format with Prettier
echo "✨ Formatting..."
npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,md}"
if [ $? -ne 0 ]; then
  echo "❌ Prettier errors found!"
  exit 1
fi

# Run tests
echo "🧪 Running tests..."
npx vitest run
if [ $? -ne 0 ]; then
  echo "❌ Tests failed!"
  exit 1
fi

echo ""
echo "✅ All pre-commit checks passed!"
echo "You can now safely commit your changes."
