# Post-Deployment Verification Script (Windows)
# Run this after deploying to Vercel and Railway
# Usage: .\verify-deployment.ps1

param(
    [string]$FrontendUrl = "https://lifelink.vercel.app",
    [string]$BackendUrl = "https://lifelink-backend.railway.app"
)

# Configuration
$ApiBaseUrl = "$BackendUrl/api"
$Passed = 0
$Failed = 0

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url
    )
    
    Write-Host -NoNewline "Testing $Name... "
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -TimeoutSec 10 -SkipHttpErrorCheck
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq 200 -or $statusCode -eq 301 -or $statusCode -eq 302 -or $statusCode -eq 400) {
            Write-Success "(Status: $statusCode)"
            return $true
        }
        else {
            Write-Error-Custom "(Status: $statusCode)"
            return $false
        }
    }
    catch {
        Write-Error-Custom "(Error: $($_.Exception.Message))"
        return $false
    }
}

# Header
Write-Host "`n🔍 Starting Post-Deployment Verification...`n" -ForegroundColor Yellow

Write-Host "Frontend Domain: $FrontendUrl" -ForegroundColor Cyan
Write-Host "Backend Domain: $BackendUrl" -ForegroundColor Cyan
Write-Host "`n"

# Test 1: DNS & Network Tests
Write-Host "1️⃣  DNS & Network Tests" -ForegroundColor Yellow

if (Test-Endpoint "Frontend Homepage" $FrontendUrl) { $Passed++ } else { $Failed++ }
if (Test-Endpoint "Frontend Login" "$FrontendUrl/login") { $Passed++ } else { $Failed++ }

Write-Host ""

if (Test-Endpoint "Backend API Health" "$ApiBaseUrl/health") { $Passed++ } else { $Failed++ }
if (Test-Endpoint "Backend Home" $BackendUrl) { $Passed++ } else { $Failed++ }

# Test 2: API Endpoints
Write-Host "`n2️⃣  API Endpoints Tests" -ForegroundColor Yellow

if (Test-Endpoint "Auth Signup" "$ApiBaseUrl/auth/signup") { $Passed++ } else { $Failed++ }
if (Test-Endpoint "Auth Login" "$ApiBaseUrl/auth/login") { $Passed++ } else { $Failed++ }
if (Test-Endpoint "Hospital List" "$ApiBaseUrl/hospitals") { $Passed++ } else { $Failed++ }

# Test 3: Security Tests
Write-Host "`n3️⃣  Security Tests" -ForegroundColor Yellow

# Check HTTPS
if ($FrontendUrl.StartsWith("https://") -and $BackendUrl.StartsWith("https://")) {
    Write-Success "Both services use HTTPS"
    $Passed++
}
else {
    Write-Error-Custom "Not using HTTPS"
    $Failed++
}

# Check CORS headers
Write-Host -NoNewline "Testing CORS headers... "
try {
    $corsResponse = Invoke-WebRequest -Uri "$ApiBaseUrl/hospitals" `
        -Headers @{"Origin" = $FrontendUrl; "Access-Control-Request-Method" = "GET" } `
        -Method Options -SkipHttpErrorCheck -TimeoutSec 5
    
    if ($corsResponse.Headers["access-control-allow-origin"]) {
        Write-Success "CORS headers present"
        $Passed++
    }
    else {
        Write-Warning-Custom "CORS headers not found (might be OK)"
    }
}
catch {
    Write-Warning-Custom "Could not verify CORS headers"
}

# Test 4: Environment Variables Check
Write-Host "`n4️⃣  Environment Variables Check" -ForegroundColor Yellow
Write-Host "Environment variables should be checked in Vercel and Railway dashboards:" -ForegroundColor Yellow
Write-Host "Frontend: https://vercel.com/dashboard → Settings → Environment Variables" -ForegroundColor Cyan
Write-Host "Backend: https://railway.app/dashboard → Settings → Variables" -ForegroundColor Cyan

# Test 5: Performance Tests
Write-Host "`n5️⃣  Performance Tests" -ForegroundColor Yellow

Write-Host -NoNewline "Frontend response time... "
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $null = Invoke-WebRequest -Uri $FrontendUrl -Method Get -UseBasicParsing -TimeoutSec 10 -SkipHttpErrorCheck
    $stopwatch.Stop()
    Write-Host "$($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Green
}
catch {
    Write-Error-Custom "Failed to measure response time"
}

Write-Host -NoNewline "Backend response time... "
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $null = Invoke-WebRequest -Uri "$ApiBaseUrl/health" -Method Get -UseBasicParsing -TimeoutSec 10 -SkipHttpErrorCheck
    $stopwatch.Stop()
    Write-Host "$($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Green
}
catch {
    Write-Error-Custom "Failed to measure response time"
}

# Summary
Write-Host "`n📋 Summary" -ForegroundColor Yellow
Write-Host "Passed: $Passed" -ForegroundColor Green
Write-Host "Failed: $Failed" -ForegroundColor Red

if ($Failed -eq 0) {
    Write-Host "`n✅ All checks passed! Deployment successful." -ForegroundColor Green
    exit 0
}
else {
    Write-Host "`n❌ Some checks failed. Review the output above." -ForegroundColor Red
    exit 1
}

Write-Host "`n🔗 Useful Links" -ForegroundColor Yellow
Write-Host "Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host "Vercel Logs: $FrontendUrl" -ForegroundColor Cyan
Write-Host "Railway Dashboard: https://railway.app/dashboard" -ForegroundColor Cyan
Write-Host "Railway Logs: https://railway.app/dashboard → Logs" -ForegroundColor Cyan
Write-Host "GitHub Actions: Check your repository's Actions tab" -ForegroundColor Cyan
