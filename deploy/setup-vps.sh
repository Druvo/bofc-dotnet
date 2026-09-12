#!/bin/bash
# One-time VPS setup for BOFC .NET deployment
# Run: ssh -i key ubuntu@168.107.78.111 'bash -s' < setup-vps.sh
set -euo pipefail

DEPLOY_DIR="/opt/bofc-dotnet"
FRONTEND_DIR="/opt/bofc-dotnet/frontend"

echo "=== Installing nginx ==="
sudo apt-get update -qq
sudo apt-get install -y -qq nginx curl

echo "=== Creating deploy directories ==="
sudo mkdir -p "$DEPLOY_DIR/publish"
sudo mkdir -p "$DEPLOY_DIR/uploads/player-profiles"
sudo mkdir -p "$DEPLOY_DIR/uploads/player-photos"
sudo mkdir -p "$DEPLOY_DIR/uploads/team-logos"
sudo mkdir -p "$FRONTEND_DIR"
sudo chown -R ubuntu:ubuntu "$DEPLOY_DIR"

echo "=== Installing systemd service ==="
sudo tee /etc/systemd/system/bofc-dotnet.service > /dev/null << 'EOF'
[Unit]
Description=BOFC .NET Backend
After=network.target

[Service]
WorkingDirectory=/opt/bofc-dotnet/publish
ExecStart=/opt/bofc-dotnet/publish/BofcBackend.Api
Restart=always
RestartSec=10
SyslogIdentifier=bofc-dotnet
User=ubuntu
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://0.0.0.0:9292
Environment="ConnectionStrings__Default=Server=localhost,1433;Database=bofc_football;User Id=sa;Password=BofcDotnet2026!;TrustServerCertificate=True;Encrypt=False;"
Environment=Jwt__Secret=YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkwYWJjZGVmZ2hpamts
Environment=Player__DefaultPassword=Bjit@123#
Environment=Player__SuperAdminEmail=zhdruvo@gmail.com
Environment=Storage__PlayerProfile__BaseUrl=https://originalsfootball.club
Environment=Storage__PlayerPhoto__BaseUrl=https://originalsfootball.club
Environment=Storage__TeamLogo__BaseUrl=https://originalsfootball.club

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable bofc-dotnet

echo "=== Configuring nginx ==="
sudo tee /etc/nginx/sites-available/bofc > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    root /opt/bofc-dotnet/frontend;
    index index.html;

    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:9292/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        client_max_body_size 10M;
    }

    # WebSocket support (for STOMP auction)
    location /ws/ {
        proxy_pass http://127.0.0.1:9292/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # Uploads proxy
    location /uploads/ {
        proxy_pass http://127.0.0.1:9292/uploads/;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/bofc /etc/nginx/sites-enabled/bofc
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl enable nginx

echo ""
echo "=== VPS setup complete ==="
echo "Backend will run on: http://0.0.0.0:9292"
echo "Nginx serving frontend on: http://0.0.0.0:80"
echo "Deploy dir: $DEPLOY_DIR"
echo ""
echo "Next: push to master (or run the Deploy workflow manually) to deploy the app."
