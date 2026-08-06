#!/bin/bash
# Fix the originalsfootball.club nginx config
# First, get everything before line 280
head -279 /etc/nginx/sites-available/druvium > /tmp/nginx-fix.conf

# Add the properly formatted originalsfootball.club HTTPS block
cat >> /tmp/nginx-fix.conf << 'NGINX'

# Originals Football Club - HTTPS (.NET BOFC)
server {
    listen 443 ssl;
    server_name originalsfootball.club www.originalsfootball.club;
    ssl_certificate /etc/ssl/originalsfootball/fullchain.pem;
    ssl_certificate_key /etc/ssl/originalsfootball/privkey.pem;
    client_max_body_size 10M;
    proxy_read_timeout 300s;

    # API proxy to .NET backend
    location /api/ {
        proxy_pass http://127.0.0.1:9292/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket support (STOMP)
    location /ws/ {
        proxy_pass http://127.0.0.1:9292/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }

    # Uploads
    location /uploads/ {
        alias /opt/bofc-dotnet/publish/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Frontend static files
    root /opt/bofc-dotnet/frontend;
    index index.html;

    # Prevent Cloudflare from caching
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets (with revalidation)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        add_header Cache-Control "no-cache, must-revalidate";
    }
}
NGINX

# Replace the file
sudo cp /tmp/nginx-fix.conf /etc/nginx/sites-available/druvium
sudo nginx -t
sudo systemctl reload nginx
echo "DONE"
