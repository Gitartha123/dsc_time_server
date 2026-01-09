# Deployment Guide - DSC Time Server

## Prerequisites

### 1. Install Node.js (v18+ recommended)
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or using nvm (recommended for version management)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### 2. Install MongoDB
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

---

## Deployment Steps

### Step 1: Transfer Application Files

**Option A: Using Git**
```bash
cd /opt
sudo git clone <your-repo-url> dsc_time_server
cd dsc_time_server
```

**Option B: Using SCP/SFTP**
```bash
# From your local machine
scp -r e:\dsc_time_server user@your-server:/opt/dsc_time_server
```

### Step 2: Install Dependencies
```bash
cd /opt/dsc_time_server
npm install --production
```

### Step 3: Configure Environment

Create/update the `env` file:
```bash
nano env
```

Set production values:
```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/dsc
JWT_SECRET=<generate-strong-secret>
TIME_SIGN_SECRET=<generate-strong-secret>
```

**Generate strong secrets:**
```bash
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Set File Permissions
```bash
sudo chown -R $USER:$USER /opt/dsc_time_server
chmod 600 env  # Protect secrets
```

### Step 5: Start with PM2
```bash
cd /opt/dsc_time_server

# Start the application
pm2 start server.js --name "dsc-time-server"

# Save PM2 configuration
pm2 save

# Enable PM2 startup on boot
pm2 startup
# Follow the command it outputs (usually requires sudo)
```

### Step 6: Verify Deployment
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs dsc-time-server

# Test endpoint
curl http://localhost:5001/health
```

---

## Optional: Nginx Reverse Proxy

### Install Nginx
```bash
sudo apt-get install -y nginx
```

### Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/dsc-time-server
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Change this

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/dsc-time-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL with Let's Encrypt (Optional)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Firewall Configuration

```bash
# Allow HTTP/HTTPS (if using nginx)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Or allow direct Node.js port (if not using nginx)
sudo ufw allow 5001/tcp

# Enable firewall
sudo ufw enable
```

---

## PM2 Management Commands

```bash
# View status
pm2 status

# View logs (real-time)
pm2 logs dsc-time-server

# Restart application
pm2 restart dsc-time-server

# Stop application
pm2 stop dsc-time-server

# Monitor resources
pm2 monit

# Update after code changes
cd /opt/dsc_time_server
git pull  # or upload new files
npm install
pm2 restart dsc-time-server
```

---

## MongoDB Security (Production)

### Enable Authentication
```bash
# Connect to MongoDB
mongosh

# Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "strong_password_here",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})

# Create app-specific user
use dsc
db.createUser({
  user: "dsc_app",
  pwd: "app_password_here",
  roles: ["readWrite"]
})
exit
```

### Update MongoDB Config
```bash
sudo nano /etc/mongod.conf
```

Enable auth:
```yaml
security:
  authorization: enabled
```

Restart MongoDB:
```bash
sudo systemctl restart mongod
```

### Update Application `env` File
```env
MONGO_URI=mongodb://dsc_app:app_password_here@127.0.0.1:27017/dsc?authSource=dsc
```

Restart app:
```bash
pm2 restart dsc-time-server
```

---

## Monitoring & Logs

### View Application Logs
```bash
# PM2 logs
pm2 logs dsc-time-server --lines 100

# Custom logs (if created)
tail -f /opt/dsc_time_server/logs/time-controller.log
```

### Setup Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Troubleshooting

### Check if MongoDB is running
```bash
sudo systemctl status mongod
mongosh --eval "db.runCommand({ ping: 1 })"
```

### Check if app is listening
```bash
sudo netstat -tulpn | grep 5001
# or
sudo ss -tulpn | grep 5001
```

### Test endpoint
```bash
curl -X POST http://localhost:5001/api/time \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","machineHash":"TEST-001"}'
```

### Common Issues

**Port already in use:**
```bash
# Find process using port
sudo lsof -i :5001
# Kill if needed
sudo kill -9 <PID>
```

**MongoDB connection failed:**
- Check MongoDB is running: `sudo systemctl status mongod`
- Check connection string in `env` file
- Verify firewall isn't blocking port 27017

**Permission denied:**
```bash
sudo chown -R $USER:$USER /opt/dsc_time_server
```

---

## Update Procedure

```bash
cd /opt/dsc_time_server

# Backup database (optional)
mongodump --db dsc --out /backup/$(date +%Y%m%d)

# Pull latest code
git pull

# Install new dependencies
npm install

# Restart application
pm2 restart dsc-time-server

# Verify
pm2 logs dsc-time-server --lines 20
curl http://localhost:5001/health
```

---

## Production Checklist

- [ ] Change default secrets in `env` file
- [ ] Enable MongoDB authentication
- [ ] Configure firewall (ufw)
- [ ] Setup nginx reverse proxy (optional)
- [ ] Enable SSL with Let's Encrypt
- [ ] Configure PM2 startup script
- [ ] Setup log rotation
- [ ] Regular database backups
- [ ] Monitor disk space and logs
- [ ] Document your deployment specifics

---

## Quick Deploy Script

Save as `deploy.sh`:
```bash
#!/bin/bash
set -e

echo "=== DSC Time Server Deployment ==="

# Install dependencies
npm install --production

# Restart with PM2
pm2 restart dsc-time-server || pm2 start server.js --name "dsc-time-server"

# Save PM2 config
pm2 save

echo "=== Deployment Complete ==="
pm2 status
```

Make executable:
```bash
chmod +x deploy.sh
```
