$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$databaseUrl = if ($env:E2E_DATABASE_URL) { $env:E2E_DATABASE_URL } else { "postgres://prepull:prepull-test-only@localhost:5433/prepull_test" }
$baseUrl = if ($env:E2E_BASE_URL) { $env:E2E_BASE_URL } else { "http://127.0.0.1:3101" }
$server = Start-Job -ScriptBlock {
  param($db, $url, $root)
  $env:DATABASE_URL = $db
  $env:NEXTAUTH_URL = $url
  $env:PREPULL_CHARACTER_PROVIDER = "mock"
  Set-Location $root
  $port = ([Uri]$url).Port
  npm run dev -- --port $port
} -ArgumentList $databaseUrl, $baseUrl, $repoRoot

try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 45; $attempt++) {
    Start-Sleep -Seconds 1
    try {
      $response = Invoke-WebRequest -Uri "$baseUrl/api/health/live" -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        $ready = $true
        break
      }
    } catch {}
  }
  if (-not $ready) {
    Receive-Job $server
    throw "Local E2E server did not become ready."
  }

  $env:E2E_DATABASE_URL = $databaseUrl
  $env:E2E_BASE_URL = $baseUrl
  npx playwright test `
    tests/e2e/player-onboarding.e2e.spec.ts `
    tests/e2e/player-onboarding.accessibility.e2e.spec.ts `
    tests/e2e/player-advice.e2e.spec.ts `
    tests/e2e/player-refresh.e2e.spec.ts `
    tests/e2e/session-planner.e2e.spec.ts `
    --project=chromium `
    --workers=1
  if ($LASTEXITCODE -ne 0) {
    throw "Playwright exited with $LASTEXITCODE."
  }
} finally {
  Stop-Job $server -ErrorAction SilentlyContinue
  Receive-Job $server -ErrorAction SilentlyContinue | Out-Null
  Remove-Job $server -Force -ErrorAction SilentlyContinue
}
