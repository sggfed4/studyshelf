$ErrorActionPreference = "Stop"

Write-Host "Cloudflare setup for VS Code / GitHub Copilot" -ForegroundColor Cyan
Write-Host "Project: $((Get-Location).Path)"

if (-not (Test-Path ".git") -and -not (Test-Path "package.json")) {
    Write-Host "Warning: this folder doesn't look like the StudyShelf project root." -ForegroundColor Yellow
    Write-Host "Run this script from C:\Users\logan\StudyShelf3 after extracting the setup files."
}

# Preserve an existing VS Code MCP configuration and add/update only the Cloudflare entry.
$configPath = Join-Path (Get-Location) ".vscode\mcp.json"
$configDir = Split-Path $configPath -Parent
New-Item -ItemType Directory -Force -Path $configDir | Out-Null

if (Test-Path $configPath) {
    $backupPath = "$configPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $configPath $backupPath
    Write-Host "Backed up existing MCP config to $backupPath"
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    if (-not $config.servers) {
        $config | Add-Member -MemberType NoteProperty -Name servers -Value ([pscustomobject]@{}) -Force
    }
    $config.servers | Add-Member -MemberType NoteProperty -Name cloudflare -Value ([pscustomobject]@{
        type = "http"
        url = "https://mcp.cloudflare.com/mcp"
    }) -Force
    $config | ConvertTo-Json -Depth 30 | Set-Content -Encoding utf8 $configPath
} else {
    @'
{
  "servers": {
    "cloudflare": {
      "type": "http",
      "url": "https://mcp.cloudflare.com/mcp"
    }
  }
}
'@ | Set-Content -Encoding utf8 $configPath
}

Write-Host "`nInstalling Cloudflare Agent Skills into this project..." -ForegroundColor Cyan
if (-not (Get-Command npx.cmd -ErrorAction SilentlyContinue)) {
    throw "npx.cmd was not found. Install Node.js, reopen PowerShell, and retry."
}
npx.cmd -y skills add https://github.com/cloudflare/skills --skill '*' --yes
if ($LASTEXITCODE -ne 0) {
    throw "Cloudflare Skills installation failed with exit code $LASTEXITCODE."
}

Write-Host "`nSetup files and skills are installed." -ForegroundColor Green
Write-Host "Next: reload VS Code (Developer: Reload Window)."
Write-Host "In Copilot Chat, switch to Agent mode and select/use the Cloudflare MCP server."
Write-Host "The first Cloudflare MCP use should open a browser for Cloudflare OAuth authorization."
