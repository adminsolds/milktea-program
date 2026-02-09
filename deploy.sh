#!/bin/bash

# 奶茶店小程序后端部署脚本
# 服务器地址: 39.102.214.230

set -e

echo "=========================================="
echo "奶茶店小程序后端部署脚本"
echo "目标服务器: 39.102.214.230"
echo "=========================================="

# 配置
SERVER_IP="39.102.214.230"
SERVER_USER="root"
DEPLOY_DIR="/opt/milktea-backend"
BACKUP_DIR="/opt/backups/milktea-backend"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo ""
echo "步骤 1: 检查服务器连接..."
ping -c 1 $SERVER_IP > /dev/null 2>&1 && echo "✓ 服务器可连接" || { echo "✗ 无法连接服务器"; exit 1; }

echo ""
echo "步骤 2: 创建部署包..."
cd ..
# 排除不需要的文件
tar -czf backend-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='uploads/avatars/*' \
  --exclude='uploads/image-*' \
  --exclude='*.log' \
  --exclude='nul' \
  backend/
echo "✓ 部署包创建完成"

echo ""
echo "步骤 3: 上传文件到服务器..."
scp backend-deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/
echo "✓ 文件上传完成"

echo ""
echo "步骤 4: 在服务器上执行部署..."
ssh $SERVER_USER@$SERVER_IP << 'REMOTE_SCRIPT'

DEPLOY_DIR="/opt/milktea-backend"
BACKUP_DIR="/opt/backups/milktea-backend"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "  4.1 创建备份目录..."
mkdir -p $BACKUP_DIR

echo "  4.2 备份现有版本..."
if [ -d "$DEPLOY_DIR" ]; then
    mv $DEPLOY_DIR $BACKUP_DIR/backup_$TIMESTAMP
    echo "  ✓ 备份完成: $BACKUP_DIR/backup_$TIMESTAMP"
fi

echo "  4.3 解压新版本..."
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR
tar -xzf /tmp/backend-deploy.tar.gz
mv backend/* .
rm -rf backend

echo "  4.4 安装依赖..."
cd $DEPLOY_DIR
npm install --production

echo "  4.5 创建必要的目录..."
mkdir -p uploads/avatars
mkdir -p logs

echo "  4.6 设置文件权限..."
chmod -R 755 $DEPLOY_DIR
chmod -R 777 uploads

echo "  4.7 复制环境配置文件..."
if [ -f "$BACKUP_DIR/backup_$TIMESTAMP/.env" ]; then
    cp $BACKUP_DIR/backup_$TIMESTAMP/.env $DEPLOY_DIR/
    echo "  ✓ 环境配置已恢复"
else
    echo "  ⚠ 未找到环境配置文件，请手动配置 .env 文件"
fi

echo "  4.8 检查并安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "  ✓ PM2 安装完成"
fi

echo "  4.9 使用 PM2 启动/重启服务..."
cd $DEPLOY_DIR
pm2 delete milktea-api 2>/dev/null || true
pm2 start app.js --name milktea-api --env production
pm2 save
pm2 startup systemd -u root --hp /root

echo "  ✓ 服务启动完成"

echo ""
echo "  4.10 检查服务状态..."
sleep 2
pm2 status milktea-api

echo ""
echo "  4.11 测试 API 健康检查..."
curl -s http://localhost:3000/api/health || echo "  ⚠ 健康检查失败"

REMOTE_SCRIPT

echo ""
echo "=========================================="
echo "部署完成!"
echo "=========================================="
echo ""
echo "服务信息:"
echo "  - 服务器: http://$SERVER_IP:3000"
echo "  - API地址: http://$SERVER_IP:3000/api"
echo "  - 健康检查: http://$SERVER_IP:3000/api/health"
echo ""
echo "管理命令:"
echo "  - 查看日志: ssh $SERVER_USER@$SERVER_IP 'pm2 logs milktea-api'"
echo "  - 重启服务: ssh $SERVER_USER@$SERVER_IP 'pm2 restart milktea-api'"
echo "  - 查看状态: ssh $SERVER_USER@$SERVER_IP 'pm2 status'"
echo ""
echo "备份位置: $BACKUP_DIR"
echo ""

# 清理本地临时文件
rm -f backend-deploy.tar.gz
cd backend

echo "部署脚本执行完毕!"
