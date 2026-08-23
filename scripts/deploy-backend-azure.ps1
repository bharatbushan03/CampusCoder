<#
.SYNOPSIS
    Deploy CampusCoder backend to Microsoft Azure App Service (Linux, Node 22 LTS).
.DESCRIPTION
    Builds the TypeScript backend, provisions Azure resources (Resource Group, App Service Plan, Web App),
    syncs environment variables from backend/.env, and deploys the zip bundle.
.PARAMETER ResourceGroup
    Name of the Azure Resource Group (Default: campuscoder-rg).
.PARAMETER Location
    Azure Region (Default: centralindia).
.PARAMETER AppServicePlan
    Name of App Service Plan (Default: campuscoder-backend-plan).
.PARAMETER AppName
    Name of the Web App (Default: campuscoder-api).
.PARAMETER Sku
    App Service Plan SKU (Default: B1).
#>

[CmdletBinding()]
param (
    [string]$ResourceGroup = "campuscoder-rg",
    [string]$Location = "centralindia",
    [string]$AppServicePlan = "campuscoder-backend-plan",
    [string]$AppName = "campuscoder-api",
    [string]$Sku = "B1",
    [string]$Runtime = "NODE:22-lts"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  CampusCoder Backend -> Azure Deployment" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify Azure CLI Authentication
Write-Host "`n[1/6] Verifying Azure CLI login..." -ForegroundColor Yellow
$account = az account show --output json 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Error "Azure CLI is not logged in. Please run 'az login' first."
}
Write-Host "Authenticated as: $($account.user.name) (Subscription: $($account.name))" -ForegroundColor Green

# 2. Build Backend TypeScript
Write-Host "`n[2/6] Building Backend TypeScript..." -ForegroundColor Yellow
$rootPath = Resolve-Path "$PSScriptRoot\.."
$backendPath = Join-Path $rootPath "backend"

Push-Location $backendPath
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "TypeScript build failed!"
    }
} finally {
    Pop-Location
}
Write-Host "Backend build successful (dist/ generated)." -ForegroundColor Green

# 3. Create Resource Group and App Service Plan
Write-Host "`n[3/6] Ensuring Azure Resource Group & App Service Plan..." -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -ne "true") {
    Write-Host "Creating Resource Group '$ResourceGroup' in '$Location'..."
    az group create --name $ResourceGroup --location $Location --output none
} else {
    Write-Host "Resource Group '$ResourceGroup' is ready." -ForegroundColor Gray
}

# Check plan existence safely
$existingPlan = az appservice plan list --resource-group $ResourceGroup --query "[?name=='$AppServicePlan'].name" -o tsv
if (-not $existingPlan) {
    Write-Host "Creating Linux App Service Plan '$AppServicePlan' (SKU: $Sku) in '$Location'..."
    az appservice plan create --name $AppServicePlan --resource-group $ResourceGroup --location $Location --is-linux --sku $Sku --output none
} else {
    Write-Host "App Service Plan '$AppServicePlan' is ready." -ForegroundColor Gray
}

# 4. Create Web App if it doesn't exist
Write-Host "`n[4/6] Ensuring Azure Web App '$AppName'..." -ForegroundColor Yellow
$existingApp = az webapp list --resource-group $ResourceGroup --query "[?name=='$AppName'].name" -o tsv
if (-not $existingApp) {
    Write-Host "Creating Web App '$AppName' (Runtime: $Runtime)..."
    az webapp create --name $AppName --resource-group $ResourceGroup --plan $AppServicePlan --runtime $Runtime --output none
} else {
    Write-Host "Web App '$AppName' is ready." -ForegroundColor Gray
}

# Configure Startup Command
Write-Host "Configuring startup command and port settings..." -ForegroundColor Gray
az webapp config set --resource-group $ResourceGroup --name $AppName --startup-file "node dist/server.js" --output none

# 5. Sync Environment Variables from backend/.env
Write-Host "`n[5/6] Syncing environment variables from backend/.env..." -ForegroundColor Yellow
$envPath = Join-Path $backendPath ".env"
$settingsList = @(
    "NODE_ENV=production",
    "PORT=8080",
    "WEBSITES_PORT=8080",
    "SCM_DO_BUILD_DURING_DEPLOYMENT=false"
)

if (Test-Path $envPath) {
    $lines = Get-Content $envPath
    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        if ($trimmed -and -not $trimmed.StartsWith("#") -and $trimmed.Contains("=")) {
            $key = $trimmed.Substring(0, $trimmed.IndexOf("=")).Trim()
            $val = $trimmed.Substring($trimmed.IndexOf("=") + 1).Trim()
            if ($key -and $key -ne "PORT" -and $key -ne "BACKEND_PORT" -and $key -ne "NODE_ENV" -and $key -ne "SCM_DO_BUILD_DURING_DEPLOYMENT") {
                $settingsList += "$key=$val"
            }
        }
    }
}

Write-Host "Applying $($settingsList.Count) app settings to Azure Web App..."
az webapp config appsettings set --resource-group $ResourceGroup --name $AppName --settings $settingsList --output none
Write-Host "Environment settings synced successfully." -ForegroundColor Green

# 6. Package and Deploy Self-Contained Zip Bundle
Write-Host "`n[6/6] Packaging self-contained backend bundle..." -ForegroundColor Yellow
$tempDeployDir = Join-Path $env:TEMP "cc-backend-pkg-$([System.Guid]::NewGuid().ToString('N').Substring(0,8))"
New-Item -ItemType Directory -Path $tempDeployDir -Force | Out-Null
$zipFile = Join-Path $env:TEMP "cc-backend-deploy-$([System.Guid]::NewGuid().ToString('N').Substring(0,8)).zip"

try {
    # Copy compiled dist
    Copy-Item -Path (Join-Path $backendPath "dist") -Destination (Join-Path $tempDeployDir "dist") -Recurse -Force
    Copy-Item -Path (Join-Path $backendPath "package.json") -Destination (Join-Path $tempDeployDir "package.json") -Force
    Copy-Item -Path (Join-Path $backendPath "package-lock.json") -Destination (Join-Path $tempDeployDir "package-lock.json") -Force

    # Install clean production dependencies
    Write-Host "Installing production dependencies in bundle..." -ForegroundColor Gray
    Push-Location $tempDeployDir
    try {
        npm ci --omit=dev --ignore-scripts
    } finally {
        Pop-Location
    }

    # Zip the package with POSIX forward slashes for Linux compatibility
    Write-Host "Compressing deployment package with POSIX path separators..." -ForegroundColor Gray
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    $zipArchive = [System.IO.Compression.ZipFile]::Open($zipFile, [System.IO.Compression.ZipArchiveMode]::Create)
    Get-ChildItem -Path $tempDeployDir -Recurse -File | ForEach-Object {
        $relativePath = $_.FullName.Substring($tempDeployDir.Length).TrimStart("\", "/").Replace("\", "/")
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zipArchive, $_.FullName, $relativePath) | Out-Null
    }
    $zipArchive.Dispose()

    $zipSizeMb = [math]::Round(((Get-Item $zipFile).Length / 1MB), 2)
    Write-Host "Uploading and deploying self-contained package ($zipSizeMb MB) to Azure ($AppName)..." -ForegroundColor Yellow
    az webapp deploy --resource-group $ResourceGroup --name $AppName --src-path $zipFile --type zip --async false --clean true --output none

} finally {
    # Clean up temp directories
    Remove-Item -Path $tempDeployDir -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $zipFile -Force -ErrorAction SilentlyContinue
}

$siteUrl = "https://$AppName.azurewebsites.net"
Write-Host "`nWaiting for live health check on $siteUrl/health..." -ForegroundColor Yellow
$retries = 6
$healthy = $false
while ($retries -gt 0) {
    try {
        $res = Invoke-RestMethod -Uri "$siteUrl/health" -Method Get -TimeoutSec 10 -ErrorAction Stop
        if ($res.ok -eq $true) {
            $healthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 5
        $retries--
    }
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  CampusCoder Backend Deployed Successfully!" -ForegroundColor Green
Write-Host "  Live URL: $siteUrl" -ForegroundColor Green
Write-Host "  Health Endpoint: $siteUrl/health" -ForegroundColor Green
if ($healthy) {
    Write-Host "  Live Health Check: HEALTHY (HTTP 200)" -ForegroundColor Green
}
Write-Host "==========================================================" -ForegroundColor Green
