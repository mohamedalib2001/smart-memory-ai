#!/bin/bash
set -e

VPS_HOST="91.98.166.125"
VPS_PORT="4103"
VPS_USER="${VPS_USER:-deploy}"
APP_DIR="/opt/smartmemoryai"

if [ "$VPS_USER" = "root" ]; then
  echo "WARNING: Deploying as root is not recommended. Consider using a dedicated deploy user."
  echo "Set VPS_USER environment variable to specify a different user."
fi

echo "Building SmartMemoryAI for production..."

npm run build

echo "Creating deployment package..."
tar -czvf dist.tar.gz \
  dist/ \
  package.json \
  package-lock.json \
  drizzle.config.ts \
  shared/ \
  --exclude node_modules

echo "Uploading to VPS..."
scp -P ${VPS_PORT} dist.tar.gz ${VPS_USER}@${VPS_HOST}:${APP_DIR}/

echo "Deploying on VPS..."
ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd /opt/smartmemoryai
tar -xzvf dist.tar.gz

# Install all dependencies first for migrations (drizzle-kit is a devDependency)
npm ci

# Run database migrations
npm run db:push

# Then reinstall production-only dependencies to reduce footprint
npm ci --only=production

# Restart or start the application
pm2 restart smartmemoryai 2>/dev/null || pm2 start dist/server.js --name smartmemoryai
pm2 save
ENDSSH

echo "Deployment complete!"
echo "Application running at http://${VPS_HOST}:${VPS_PORT}"
