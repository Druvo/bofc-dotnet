#!/bin/bash
set -euo pipefail

mkdir -p /opt/bofc-dotnet/docker

cat > /opt/bofc-dotnet/docker/docker-compose.yml << 'EOF'
services:
  sqlserver:
    image: mcr.microsoft.com/azure-sql-edge:latest
    container_name: bofc-sqlserver
    restart: unless-stopped
    ports:
      - "1433:1433"
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: "BofcDotnet2026!"
    volumes:
      - sqlserver-data:/var/opt/mssql

volumes:
  sqlserver-data:
EOF

cd /opt/bofc-dotnet/docker
sudo docker compose up -d
echo "=== SQL Server container started ==="
