# Git 部署指南

## 方案 1：使用 GitHub/GitLab 作为中转（推荐）

### 1. 在 GitHub 创建仓库

1. 登录 https://github.com
2. 创建新仓库，命名为 `milktea-backend`
3. 不要勾选 "Initialize this repository with a README"

### 2. 本地仓库关联远程仓库

```powershell
# 进入后端目录
cd "F:\奶茶店小程序\后台\backend"

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/milktea-backend.git

# 或者使用 SSH（推荐，需要配置 SSH 密钥）
git remote add origin git@github.com:YOUR_USERNAME/milktea-backend.git
```

### 3. 推送代码到 GitHub

```powershell
# 添加所有文件
git add .

# 提交更改
git commit -m "更新后端代码：统计功能、订单功能等"

# 推送到 GitHub
git push -u origin main
# 如果是 master 分支
git push -u origin master
```

### 4. 服务器拉取代码并重启

```powershell
# SSH 登录服务器
ssh root@39.102.214.230

# 进入项目目录
cd /opt/milktea-backend

# 拉取最新代码
git pull origin main

# 安装依赖（如果有新依赖）
npm install

# 重启服务
pm2 restart milktea-backend
```

---

## 方案 2：服务器直接作为 Git 仓库（简单快速）

### 1. 在服务器初始化裸仓库

```powershell
# SSH 登录服务器
ssh root@39.102.214.230

# 创建裸仓库
cd /opt
git init --bare milktea-backend.git

# 创建项目目录
mkdir -p milktea-backend
cd milktea-backend
git init
git remote add origin /opt/milktea-backend.git
```

### 2. 本地配置远程仓库

```powershell
cd "F:\奶茶店小程序\后台\backend"

# 添加服务器为远程仓库
git remote add server ssh://root@39.102.214.230/opt/milktea-backend.git
```

### 3. 推送代码到服务器

```powershell
# 提交更改
git add .
git commit -m "更新后端代码"

# 推送到服务器
git push server main
```

### 4. 服务器自动部署（使用 Git Hook）

在服务器上创建部署钩子：

```bash
# 服务器上执行
cd /opt/milktea-backend.git/hooks
cat > post-receive << 'EOF'
#!/bin/bash
TARGET="/opt/milktea-backend"
GIT_DIR="/opt/milktea-backend.git"
BRANCH="main"

while read oldrev newrev ref
do
    if [ "$ref" = "refs/heads/$BRANCH" ]; then
        echo "接收到 $BRANCH 分支的推送，开始部署..."
        cd $TARGET
        git --git-dir=$GIT_DIR --work-tree=$TARGET checkout -f $BRANCH
        npm install
        pm2 restart milktea-backend
        echo "部署完成！"
    fi
done
EOF

chmod +x post-receive
```

这样每次推送代码到服务器，会自动部署并重启服务！

---

## 方案 3：一键部署脚本（最简单）

创建 `deploy-git.ps1` 脚本：

```powershell
# deploy-git.ps1
$serverIp = "39.102.214.230"
$serverUser = "root"
$remotePath = "/opt/milktea-backend"

Write-Host "开始 Git 部署..." -ForegroundColor Cyan

# 1. 本地提交并推送
cd "F:\奶茶店小程序\后台\backend"

git add .
$commitMessage = Read-Host "输入提交信息"
git commit -m "$commitMessage"
git push origin main

Write-Host "代码已推送到 GitHub" -ForegroundColor Green

# 2. 服务器拉取并重启
$commands = @"
cd $remotePath
git pull origin main
npm install
pm2 restart milktea-backend
"@

$commands | ssh ${serverUser}@${serverIp}

Write-Host "部署完成！" -ForegroundColor Green
```

---

## 推荐工作流程

### 日常更新步骤：

```powershell
# 1. 修改代码后，进入后端目录
cd "F:\奶茶店小程序\后台\backend"

# 2. 查看修改的文件
git status

# 3. 添加修改的文件
git add .

# 4. 提交更改
git commit -m "修复：统计功能显示问题"

# 5. 推送到远程仓库
git push origin main

# 6. 登录服务器拉取并重启（或使用自动化脚本）
ssh root@39.102.214.230 "cd /opt/milktea-backend && git pull && npm install && pm2 restart milktea-backend"
```

### 查看提交历史：

```powershell
git log --oneline -10
```

### 查看修改内容：

```powershell
git diff
```

---

## 常见问题

### 1. 推送被拒绝
```
! [rejected]        main -> main (fetch first)
```
**解决：**
```powershell
git pull origin main
git push origin main
```

### 2. 合并冲突
```
CONFLICT (content): Merge conflict in app.js
```
**解决：**
```powershell
# 手动编辑冲突文件，解决冲突后
git add .
git commit -m "解决合并冲突"
git push origin main
```

### 3. 忘记添加远程仓库
```
fatal: 'origin' does not appear to be a git repository
```
**解决：**
```powershell
git remote add origin https://github.com/YOUR_USERNAME/milktea-backend.git
```

---

## 您现在需要做的

1. **选择方案**（推荐方案 1：GitHub 中转）
2. **创建 GitHub 仓库**
3. **配置远程仓库**
4. **推送代码**
5. **服务器拉取部署**

需要我帮您配置具体的 Git 仓库地址吗？
