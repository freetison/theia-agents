# build-images.ps1
# Builds backend and frontend container images using podman.
# Run this once (or after source changes) before `podman-compose up -d`.
#
# Usage:
#   .\build-images.ps1           # build both
#   .\build-images.ps1 -Service backend   # only backend
#   .\build-images.ps1 -Service frontend  # only frontend

param(
    [ValidateSet('backend', 'frontend', 'all')]
    [string]$Service = 'all'
)

$root = $PSScriptRoot

function Build-Backend {
    Write-Host "`n==> Building theia-backend:dev ..." -ForegroundColor Cyan
    podman build -f "$root\Dockerfile.backend" -t theia-backend:dev $root
    if ($LASTEXITCODE -ne 0) { Write-Error "Backend build failed"; exit 1 }
    Write-Host "==> theia-backend:dev built OK" -ForegroundColor Green
}

function Build-Frontend {
    Write-Host "`n==> Building theia-frontend:dev ..." -ForegroundColor Cyan
    podman build -f "$root\Dockerfile.frontend" -t theia-frontend:dev $root
    if ($LASTEXITCODE -ne 0) { Write-Error "Frontend build failed"; exit 1 }
    Write-Host "==> theia-frontend:dev built OK" -ForegroundColor Green
}

if ($Service -eq 'backend') { Build-Backend }
elseif ($Service -eq 'frontend') { Build-Frontend }
else { Build-Backend; Build-Frontend }

Write-Host "`nDone. Run: podman-compose up -d" -ForegroundColor Yellow
