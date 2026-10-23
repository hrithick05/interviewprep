param([switch]$VercelOnly)

$ErrorActionPreference = "Stop"
Write-Host "PrepForge deployment prerequisites"

$hasSupabase = $null -ne (Get-Command supabase -ErrorAction SilentlyContinue) -or $null -ne (Get-Command npx -ErrorAction SilentlyContinue)
$hasVercel = $null -ne (Get-Command vercel -ErrorAction SilentlyContinue)

if (-not $hasSupabase) { Write-Warning "Supabase CLI missing. Run: npm install -g supabase" }
if (-not $hasVercel) { Write-Warning "Vercel CLI missing. Run: npm install -g vercel" }
if (-not $env:SUPABASE_PROJECT_REF) { Write-Warning "SUPABASE_PROJECT_REF is not set." }
if (-not $env:SUPABASE_ACCESS_TOKEN) { Write-Warning "SUPABASE_ACCESS_TOKEN is not set in the shell environment." }
if (-not $env:PRODUCTION_CLIENT_URL) { Write-Warning "PRODUCTION_CLIENT_URL is not set." }

if ($hasVercel) {
  Write-Host "Deploying client with Vercel..."
  Push-Location client
  vercel --prod
  Pop-Location
}

if (-not $VercelOnly) {
  Write-Host "Run the Render deployment hook from dashboard, or use the GitHub Actions deploy workflow."
}
