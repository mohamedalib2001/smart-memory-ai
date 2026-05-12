# SmartMemoryAI Deployment Guide

## VPS Deployment (91.98.166.125:4103)

### Prerequisites

1. **VPS Requirements**
   - Ubuntu 20.04+ or similar Linux distribution
   - Node.js 20.x
   - PostgreSQL 14+
   - PM2 for process management
   - SSL certificate (Let's Encrypt recommended)

2. **Environment Variables**
   Set these on your VPS in `/opt/smartmemoryai/.env`:

   ```bash
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://smartmemory:<STRONG_PASSWORD>@localhost:5432/smartmemoryai
   SESSION_SECRET=<RANDOMLY_GENERATED_SECRET>
   ```

   **Security Requirements:**
   - Generate strong passwords: `openssl rand -base64 32`
   - Secure the .env file: `chmod 600 /opt/smartmemoryai/.env`
   - Set proper ownership: `chown smartmemory:smartmemory /opt/smartmemoryai/.env`
   - Never commit .env files to version control

### Initial VPS Setup

```bash
# SSH into your VPS
ssh -p 4103 root@91.98.166.125

# Run the setup script
curl -sSL https://raw.githubusercontent.com/mohamedalib2001/SmartMemoryAI/main/scripts/vps-setup.sh | bash
```

### Manual Deployment Steps

1. **Build the application locally**
   ```bash
   npm run build
   ```

2. **Create deployment package**
   ```bash
   tar -czvf dist.tar.gz dist/ package.json package-lock.json drizzle.config.ts shared/
   ```

3. **Upload to VPS**
   ```bash
   scp -P 4103 dist.tar.gz root@91.98.166.125:/opt/smartmemoryai/
   ```

4. **Deploy on VPS**
   ```bash
   ssh -p 4103 deploy@91.98.166.125
   cd /opt/smartmemoryai
   tar -xzvf dist.tar.gz
   
   # Install all dependencies (needed for migrations - drizzle-kit is a devDependency)
   npm ci
   
   # Run database migrations
   npm run db:push
   
   # Reinstall production-only dependencies
   npm ci --only=production
   
   # Start/restart the application
   pm2 restart smartmemoryai || pm2 start dist/server.js --name smartmemoryai
   pm2 save
   ```

### Automated Deployment

Use the deploy script:

```bash
./scripts/deploy.sh
```

### SSL/HTTPS Setup with Nginx

1. **Install Nginx and Certbot**
   ```bash
   apt install nginx certbot python3-certbot-nginx
   ```

2. **Configure Nginx** (`/etc/nginx/sites-available/smartmemoryai`)
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable and get SSL**
   ```bash
   ln -s /etc/nginx/sites-available/smartmemoryai /etc/nginx/sites-enabled/
   certbot --nginx -d yourdomain.com
   ```

### Database Setup

1. **Install PostgreSQL**
   ```bash
   apt install postgresql postgresql-contrib
   ```

2. **Create database**
   ```bash
   # Generate a strong password first
   DB_PASSWORD=$(openssl rand -base64 24)
   echo "Save this password securely: $DB_PASSWORD"
   
   sudo -u postgres psql << EOF
   CREATE DATABASE smartmemoryai;
   CREATE USER smartmemory WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
   GRANT ALL PRIVILEGES ON DATABASE smartmemoryai TO smartmemory;
   EOF
   ```

3. **Run migrations**
   ```bash
   DATABASE_URL="postgresql://smartmemory:<YOUR_GENERATED_PASSWORD>@localhost:5432/smartmemoryai" npm run db:push
   ```
   
   **Note:** Replace `<YOUR_GENERATED_PASSWORD>` with the password you generated above.

### Monitoring

```bash
# View application logs
pm2 logs smartmemoryai

# Monitor resources
pm2 monit

# Restart application
pm2 restart smartmemoryai
```

### Replit Deployment (Alternative)

For easier deployment, you can use Replit's built-in publishing feature which handles:
- Automatic builds
- SSL certificates
- Health checks
- Zero-downtime deploys

Click the "Publish" button in Replit to deploy.

## Troubleshooting

### Application not starting
- Check logs: `pm2 logs smartmemoryai`
- Verify environment variables
- Ensure database is running

### Database connection issues
- Verify DATABASE_URL is correct
- Check PostgreSQL is running: `systemctl status postgresql`
- Test connection: `psql $DATABASE_URL`

### SSL certificate issues
- Renew certificate: `certbot renew`
- Check Nginx config: `nginx -t`
