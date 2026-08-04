# BOFC Frontend — Deployment Guide

**Stack:** React (CRA), static build served by Nginx  
**Server path:** `/home/application/feBuild/`  
**Domain:** `bofc.example.com`  
**Repo:** `https://github.com/Druvo/bofc-frontend.git`

---

## Step 1 — Create the static files directory

```bash
sudo mkdir -p /home/application/feBuild
sudo chown -R jenkins:jenkins /home/application/feBuild
sudo chmod -R 755 /home/application/feBuild
```

> `jenkins` user owns the folder so the pipeline can write directly without sudo.

---

## Step 2 — Configure Nginx to serve static files

```bash
sudo nano /etc/nginx/sites-available/bofc.example.com
```

Add (or update) the `bofc.example.com` server block:

```nginx
server {
    listen 80;
    server_name bofc.example.com www.bofc.example.com;

    root /home/application/feBuild;
    index index.html;

    # React SPA — all routes fallback to index.html
    location / {
        try_files $uri /index.html;
    }

    # Optional: cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable and reload:

```bash
sudo ln -sf /etc/nginx/sites-available/bofc.example.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 3 — Get SSL certificate

```bash
sudo certbot --nginx -d bofc.example.com -d www.bofc.example.com
```

Certbot will auto-update the nginx block with HTTPS.

---

## Step 4 — Add GitHub credentials in Jenkins (if not already)

> The repo is under the `Druvo` org — use `github-creds-bofc` if already created, otherwise:

**Manage Jenkins → Credentials → System → Global → Add Credentials**
- Kind: `Username with password`
- Username: GitHub username with access to `Druvo` org
- Password: GitHub Fine-grained PAT (Contents: Read-only for `bofc-frontend`)
- ID: `github-creds-bofc`

---

## Step 5 — Create the Jenkins pipeline job

1. **New Item** → `bofc-frontend` → **Pipeline** → OK
2. **General** → GitHub project: `https://github.com/Druvo/bofc-frontend/`
3. **Build Triggers** → leave unchecked (manual for now)
4. **Pipeline** → Pipeline script from SCM
   - SCM: `Git`
   - Repo: `https://github.com/Druvo/bofc-frontend.git`
   - Credentials: `github-creds-bofc`
   - Branch: `*/master`  _(or `*/main` — check your default branch)_
   - Script Path: `Jenkinsfile`
5. **Save**

---

## Step 6 — Commit and push Jenkinsfile + .env.production

```bash
cd "D:\Others\BOFC\bofc-frontend"
git add Jenkinsfile .env.production
git commit -m "ci: add Jenkins pipeline and production env"
git push
```

> `.env.production` bakes `REACT_APP_API_URL=https://api.bofc.example.com` into the CRA bundle at build time.

---

## Step 7 — Build Now

In Jenkins, open `bofc-frontend` and click **Build Now**.

Pipeline stages:
1. Checkout from GitHub
2. `npm ci` — install exact dependencies
3. `npm run build` — produces `build/` folder (static HTML/JS/CSS)
4. `rsync -av --delete build/ /home/application/feBuild/` — sync to server path
5. `chmod -R 755 /home/application/feBuild` — ensure Nginx can read files

---

## Useful Commands

```bash
# Check nginx is serving correctly
curl -I https://bofc.example.com

# Check static files are present
ls -la /home/application/feBuild/

# Reload nginx after any manual config change
sudo systemctl reload nginx

# Check nginx config syntax
sudo nginx -t
```

---

## Notes

- No PM2 or Java process needed — Nginx serves files directly.
- To update the API URL in future, edit `.env.production` and re-run the pipeline.
- If you add subdomains (e.g. `www`), ensure the cert and nginx block include both.
