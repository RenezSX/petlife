$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot

$targets = @(
  "apps\api\dist",
  "apps\web\dist",
  "apps\web\tsconfig.tsbuildinfo",
  "apps\web\tsconfig.node.tsbuildinfo",
  "apps\web\vite.config.js",
  "apps\web\vite.config.d.ts"
)

foreach ($relative in $targets) {
  $target = Join-Path $ProjectRoot $relative
  if (Test-Path $target) {
    Remove-Item $target -Recurse -Force
    Write-Host "Removido: $relative"
  }
}

Write-Host ""
Write-Host "Limpeza da Fase 8 concluida." -ForegroundColor Green
Write-Host "Agora rode: npm install; npm run db:generate; npm run typecheck" -ForegroundColor Yellow
