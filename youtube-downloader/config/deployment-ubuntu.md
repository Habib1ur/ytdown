# Ubuntu Production Deployment

## 1. System Setup

```bash
sudo apt update
sudo apt install -y git curl nginx redis-server ffmpeg python3 python3-pip
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 2. Clone and Install

```bash
git clone <your-repo-url> youtube-downloader
cd youtube-downloader
cd backend && npm install
cd ../frontend && npm install && npm run build
cd ..
```

## 3. Configure Environment

- Copy `backend/.env.example` to `backend/.env` and set production values.
- Copy `frontend/.env.example` to `frontend/.env.local` and set API/Socket URLs.

## 4. Start Services with PM2

```bash
pm2 start config/ecosystem.config.cjs
pm2 save
pm2 startup
```

## 5. Configure Nginx

```bash
sudo cp config/nginx-mediaforge.conf /etc/nginx/sites-available/mediaforge
sudo ln -s /etc/nginx/sites-available/mediaforge /etc/nginx/sites-enabled/mediaforge
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Enable HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 7. Verify

```bash
curl http://127.0.0.1:8080/health
pm2 status
sudo systemctl status redis-server
```

## 8. Operational Recommendations

- Put Redis behind firewall/private networking.
- Rotate logs with PM2 and system logrotate.
- Add monitoring (Uptime Kuma, Prometheus, Grafana, or Datadog).
- Run worker and API on dedicated compute for large workloads.
