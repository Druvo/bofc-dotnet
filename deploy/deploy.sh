#!/bin/bash
# Deploy script — historically called by Jenkins after SCP of artifacts.
# Deployment now runs from .github/workflows/deploy.yml, which performs these
# steps inline over SSH; kept for manual/recovery use.
# Runs on the VPS
set -euo pipefail

DEPLOY_DIR="/opt/bofc-dotnet"

echo "=== Stopping backend ==="
sudo systemctl stop bofc-dotnet 2>/dev/null || true

echo "=== Deploying backend ==="
# Files are already in /opt/bofc-dotnet/publish/ from SCP
chmod +x "$DEPLOY_DIR/publish/BofcBackend.Api" 2>/dev/null || true

echo "=== Starting backend ==="
sudo systemctl start bofc-dotnet

echo "=== Reloading nginx ==="
sudo systemctl reload nginx

echo "=== Waiting for backend to start ==="
for i in $(seq 1 15); do
    if curl -sf -o /dev/null http://127.0.0.1:9292/swagger/index.html 2>/dev/null; then
        echo "Backend is UP"
        break
    fi
    echo "Waiting... ($i/15)"
    sleep 2
done

echo "=== Deploy complete ==="
echo "Backend:  http://127.0.0.1:9292"
echo "Frontend: http://127.0.0.1:80"
sudo systemctl is-active bofc-dotnet
