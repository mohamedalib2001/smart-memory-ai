#!/bin/bash
set -e

echo "Setting up VPS for SmartMemoryAI..."

apt update && apt upgrade -y

echo "Creating dedicated application user..."
if ! id "smartmemory" &>/dev/null; then
  useradd -r -m -s /bin/bash smartmemory
  echo "Created 'smartmemory' system user"
fi

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

npm install -g pm2

mkdir -p /opt/smartmemoryai
chown -R smartmemory:smartmemory /opt/smartmemoryai
chmod 750 /opt/smartmemoryai

cat > /etc/systemd/system/smartmemoryai.service << 'EOF'
[Unit]
Description=SmartMemoryAI Application
After=network.target postgresql.service

[Service]
Type=simple
User=smartmemory
Group=smartmemory
WorkingDirectory=/opt/smartmemoryai
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000
EnvironmentFile=/opt/smartmemoryai/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

echo "VPS setup complete!"
echo ""
echo "SECURITY NOTES:"
echo "1. Create .env file with proper permissions: chmod 600 /opt/smartmemoryai/.env"
echo "2. Set strong, randomly generated passwords for all secrets"
echo "3. Use environment variables or a secrets manager for sensitive data"
echo "4. Run the application as the 'smartmemory' user, not root"
