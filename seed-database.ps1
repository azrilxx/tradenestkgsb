# TradeNest Database Seeding Script
# Run this after setting up the database schema

Write-Host "🌱 Seeding TradeNest Database..." -ForegroundColor Green
Write-Host ""

try {
    $body = '{"action": "seed"}'
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/seed" -Method POST -Body $body -ContentType "application/json"
    
    if ($response.StatusCode -eq 200) {
        $result = $response.Content | ConvertFrom-Json
        if ($result.success) {
            Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📊 Data Summary:" -ForegroundColor Cyan
            Write-Host "   - Products: $($result.summary.products)" -ForegroundColor White
            Write-Host "   - Companies: $($result.summary.companies)" -ForegroundColor White
            Write-Host "   - Ports: $($result.summary.ports)" -ForegroundColor White
            Write-Host "   - Shipments: $($result.summary.shipments)" -ForegroundColor White
            Write-Host "   - Price records: $($result.summary.price_records)" -ForegroundColor White
            Write-Host "   - Tariff records: $($result.summary.tariff_records)" -ForegroundColor White
            Write-Host "   - FX rates: $($result.summary.fx_rates)" -ForegroundColor White
            Write-Host "   - Freight indexes: $($result.summary.freight_indexes)" -ForegroundColor White
            Write-Host "   - Anomalies: $($result.summary.anomalies)" -ForegroundColor White
            Write-Host "   - Alerts: $($result.summary.alerts)" -ForegroundColor White
            Write-Host ""
            Write-Host "🎉 Your modernized dashboard is ready!" -ForegroundColor Green
            Write-Host "🌐 Visit: http://localhost:3002/dashboard" -ForegroundColor Yellow
            Write-Host "🔍 Trade Intelligence: http://localhost:3002/dashboard/trade-intelligence" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Seeding failed: $($result.error)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ HTTP Error: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Make sure:" -ForegroundColor Yellow
    Write-Host "   1. Development server is running (npm run dev)" -ForegroundColor White
    Write-Host "   2. Database schema is set up in Supabase" -ForegroundColor White
    Write-Host "   3. Environment variables are configured" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
