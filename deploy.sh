#!/bin/bash

SERVER_IP="39.102.214.230"
SERVER_USER="root"
REMOTE_PATH="/opt/milktea-backend"

echo "===================================="
echo "  Milktea Backend Deployment Script  "
echo "===================================="
echo ""

# 1. Check git status
echo "1. Checking git status..."

if [ -n "$(git status --porcelain)" ]; then
    echo "Found uncommitted changes, committing..."
    git add .
    git commit -m "Auto commit: Deployment update"
    echo "Commit completed"
else
    echo "Working directory clean, skipping commit"
fi

echo ""

# 2. Push to server
echo "2. Pushing to server..."

# Check if remote exists
if [ -z "$(git remote -v)" ]; then
    echo "No remote repository configured, setting up..."
    git remote add origin "ssh://${SERVER_USER}@${SERVER_IP}${REMOTE_PATH}"
    echo "Remote repository configured"
fi

# Push
git push origin main
echo "Push completed"

echo ""

# 3. Deploy on server
echo "3. Deploying on server..."

echo "Executing deployment commands:"
echo "cd ${REMOTE_PATH}; git checkout -f main; npm install; pm2 restart milktea-backend"
echo ""

# Execute SSH commands
echo "Checking server status..."
ssh "${SERVER_USER}@${SERVER_IP}" "cd ${REMOTE_PATH}; git checkout -f main; npm install; pm2 delete milktea-backend 2>/dev/null; pm2 start app.js --name milktea-backend --update-env; pm2 save; pm2 status"

echo ""
echo "===================================="
echo "   Deployment completed!            "
echo "===================================="
echo "Server URL: http://${SERVER_IP}:3003"
echo ""
