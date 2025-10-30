# Create .env.local file with template
# Run this script to create the environment file

$envFile = ".env.local"

if (Test-Path $envFile) {
    Write-Host ".env.local already exists. Skipping creation." -ForegroundColor Yellow
    exit
}

$content = @"
# Supabase Configuration
# Get these values from https://app.supabase.com/project/fckszlhkvdnrvgsjymgs/settings/api

NEXT_PUBLIC_SUPABASE_URL=https://fckszlhkvdnrvgsjymgs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=REPLACE_WITH_YOUR_ANON_KEY

# Optional: For admin operations (used by seed scripts)
# Get the service_role key from Supabase API settings (keep this secret!)
SUPABASE_SERVICE_ROLE_KEY=REPLACE_WITH_YOUR_SERVICE_ROLE_KEY

# OpenRouter API Key (for AI features)
OPENAI_API_KEY=your-openrouter-key-here

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
"@

$content | Out-File -FilePath $envFile -Encoding utf8

Write-Host "Created .env.local file!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Get your Supabase keys from: https://app.supabase.com/project/fckszlhkvdnrvgsjymgs/settings/api" -ForegroundColor White
Write-Host "2. Open .env.local and replace REPLACE_WITH_YOUR_ANON_KEY with your actual anon key" -ForegroundColor White
Write-Host "3. Replace REPLACE_WITH_YOUR_SERVICE_ROLE_KEY with your service role key" -ForegroundColor White
Write-Host "4. Run: node scripts/seed-tariff-types.js" -ForegroundColor White

