#!/bin/bash
# Apply HS Tariff Migration and Seed Data

echo "=========================================="
echo "Applying HS Tariff Migration"
echo "=========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    exit 1
fi

# Source environment variables
export $(cat .env | grep -v '^#' | xargs)

# Apply migration (if using Supabase CLI)
if command -v supabase &> /dev/null; then
    echo "Applying migration 017_hs_tariff_schema.sql..."
    supabase db push
else
    echo "Supabase CLI not found. Applying migration manually..."
    echo "Please run: psql <your-database-url> < supabase/migrations/017_hs_tariff_schema.sql"
fi

# Run seed scripts
echo ""
echo "Seeding tariff types..."
node scripts/seed-tariff-types.js

echo ""
echo "Seeding HS codes..."
node scripts/etl/seed-hs-codes.js

echo ""
echo "=========================================="
echo "Migration and seeding completed!"
echo "=========================================="

