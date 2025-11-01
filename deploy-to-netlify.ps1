# Deploy to Netlify helper script
# Usage: .\deploy-to-netlify.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "TradeNest - Deploy to Netlify" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

if ($currentBranch -eq "master") {
    Write-Host "You're already on master. This will deploy to Netlify!" -ForegroundColor Red
    $confirm = Read-Host "Continue? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit
    }
} else {
    Write-Host "Switching to master branch..." -ForegroundColor Green
    git checkout master
    Write-Host ""
    Write-Host "Merging dev into master..." -ForegroundColor Green
    git merge dev --no-ff -m "Merge dev into master for Netlify deployment"
    Write-Host ""
}

# Push to trigger Netlify deployment
Write-Host "Pushing to GitHub (this will trigger Netlify deploy)..." -ForegroundColor Green
git push origin master

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Deployment triggered!" -ForegroundColor Green
Write-Host "Netlify URL: https://spiffy-manatee-7f2d24.netlify.app" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Switch back to dev branch
Write-Host "Switching back to dev branch..." -ForegroundColor Green
git checkout dev

Write-Host ""
Write-Host "Done! Continue working on dev branch." -ForegroundColor Green

